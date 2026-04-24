/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, Fragment } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, AreaChart, Area, ReferenceLine,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { Trade, TradeReview, RiskSettings } from '../types';
import { cardStyle, gridStyle, C, EmptyState, thStyle, tdStyle, btnStyle, badgeStyle, btnSmStyle, inpStyle, lblStyle } from './Common';
import { fmt, pct, tradeDur, fmtDur, computeMetrics } from '../lib/utils';
import { WDAYS } from '../constants';
import { TradeChart } from './TradeChart';

const CT = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  const isCurrency = (name: string) => name.toLowerCase().includes('p&l') || name.toLowerCase().includes('win') || name.toLowerCase().includes('loss') || name.toLowerCase().includes('mfe') || name.toLowerCase().includes('mae');

  return (
    <div style={{ background: "var(--s3)", border: "1px solid var(--b2)", borderRadius: 10, padding: "12px 16px", fontSize: 12, boxShadow: "0 12px 32px rgba(0,0,0,.5)", backdropFilter: 'blur(10px)' }}>
      <div style={{ color: "var(--t3)", marginBottom: 8, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: (i === payload.length - 1 && data.pnl === undefined) ? 0 : 4 }}>
          <span style={{ color: "var(--t2)", fontWeight: 500 }}>{p.name}</span>
          <span style={{ color: p.color || "var(--t1)", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
            {typeof p.value === 'number' ? (p.name.includes('%') ? p.value.toFixed(1)+'%' : (isCurrency(p.name) ? fmt(p.value) : p.value)) : p.value}
          </span>
        </div>
      ))}
      {data.pnl !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginTop: 4, paddingTop: 4, borderTop: '1px solid var(--b1)' }}>
          <span style={{ color: "var(--t2)", fontWeight: 500 }}>Total P&L</span>
          <span style={{ color: data.pnl >= 0 ? C.g : C.r, fontWeight: 700, fontFamily: "var(--font-mono)" }}>{fmt(data.pnl)}</span>
        </div>
      )}
    </div>
  );
};

export function Stats({ 
  trades, 
  tradeReviews, 
  riskSettings, 
  setRiskSettings, 
  dark,
  privacyMode
}: { 
  trades: Trade[]; 
  tradeReviews: TradeReview[]; 
  riskSettings: RiskSettings; 
  setRiskSettings: any; 
  dark: boolean;
  privacyMode: boolean;
}) {
  const [statsMonth, setStatsMonth] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; });
  const [isEditingRisk, setIsEditingRisk] = useState(false);

  const monthTrades = useMemo(() => trades.filter(t => t.date.startsWith(statsMonth)), [trades, statsMonth]);
  const m = useMemo(() => computeMetrics(trades), [trades]);

  const playbookEdge = useMemo(() => {
    const stats: Record<string, { pnl: number, c: number, w: number, rr: number }> = {};
    trades.forEach(t => {
      const s = t.strategy || "Unknown";
      if (!stats[s]) stats[s] = { pnl: 0, c: 0, w: 0, rr: 0 };
      stats[s].pnl += t.pnl;
      stats[s].c++;
      stats[s].rr += t.rr || 0;
      if (t.pnl > 0) stats[s].w++;
    });
    return Object.entries(stats).map(([n, v]) => ({ name: n, pnl: v.pnl, wr: (v.w / v.c) * 100, rr: v.rr / v.c, count: v.c }));
  }, [trades]);

  const efficiency = useMemo(() => {
    const analyzed = trades.filter(t => t.pnl !== 0 && (t.mfe || t.mae));
    if (!analyzed.length) return null;
    const avgMfe = analyzed.reduce((a, t) => a + (t.mfe || 0), 0) / analyzed.length;
    const avgMae = analyzed.reduce((a, t) => a + (t.mae || 0), 0) / analyzed.length;
    const pos = analyzed.filter(t => t.pnl > 0 && t.mfe);
    const avgCaptured = pos.length ? pos.reduce((a, t) => a + (t.pnl / t.mfe!), 0) / pos.length : 0;
    return { avgMfe, avgMae, captured: avgCaptured || 0 };
  }, [trades]);

  const monthPnl = monthTrades.reduce((a, t) => a + t.pnl, 0);
  const monthLabel = new Date(statsMonth + "-15").toLocaleString("en", { month: "long", year: "numeric" });
  const sorted = useMemo(() => [...trades].sort((a, b) => a.date.localeCompare(b.date)), [trades]);
  
  const cumData = useMemo(() => {
    if (!sorted.length) return [];
    let cum = 0; 
    const dm: Record<string, number> = {};
    const firstDate = sorted[0].date;
    const d = new Date(firstDate);
    d.setDate(d.getDate() - 1);
    const prevDate = d.toISOString().split('T')[0];
    dm[prevDate] = 0;
    sorted.forEach(t => { cum += t.pnl; dm[t.date] = cum; });
    return Object.entries(dm).map(([d, v]) => ({ time: d, value: parseFloat(v.toFixed(2)) })).sort((a, b) => a.time.localeCompare(b.time));
  }, [sorted]);

  const heatmap = useMemo(() => {
    const dNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const hNames = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"];
    const data: any[] = [];
    dNames.forEach(d => {
      hNames.forEach(h => {
        const matching = trades.filter(t => {
          const tradeDate = new Date(t.date);
          const dayName = tradeDate.toLocaleDateString('en-US', { weekday: 'long' });
          const tradeHour = t.timeEntry ? t.timeEntry.split(":")[0] + ":00" : null;
          return dayName === d && tradeHour === h;
        });
        const pnl = matching.reduce((sum, t) => sum + t.pnl, 0);
        if (matching.length > 0) data.push({ day: d, hour: h, pnl, count: matching.length });
      });
    });
    return data;
  }, [trades]);
  
  const bySym = useMemo(() => { const mp: any = {}; sorted.forEach(t => { if (!mp[t.symbol]) mp[t.symbol] = { pnl: 0, c: 0 }; mp[t.symbol].pnl += t.pnl; mp[t.symbol].c++; }); return Object.entries(mp).map(([n, v]: any) => ({ name: n, ...v })).sort((a, b) => b.pnl - a.pnl); }, [sorted]);

  const timeStats = useMemo(() => {
    const hours: Record<string, { pnl: number, c: number, w: number }> = {};
    trades.forEach(t => {
      if (!t.timeEntry) return;
      const h = t.timeEntry.split(":")[0] + ":00";
      if (!hours[h]) hours[h] = { pnl: 0, c: 0, w: 0 };
      hours[h].pnl += t.pnl; hours[h].c++;
      if (t.pnl > 0) hours[h].w++;
    });
    return Object.entries(hours).sort((a, b) => a[0].localeCompare(b[0])).map(([h, v]) => ({ hour: h, pnl: v.pnl, wr: (v.w / v.c) * 100, count: v.c }));
  }, [trades]);

  const dayStats = useMemo(() => {
    const days: Record<string, { pnl: number, c: number, w: number }> = {};
    trades.forEach(t => {
      if (!t.date) return;
      const [y, mv, dv] = t.date.split("-").map(Number);
      const d = new Date(y, mv - 1, dv).getDay();
      const name = WDAYS[d];
      if (!name) return;
      if (!days[name]) days[name] = { pnl: 0, c: 0, w: 0 };
      days[name].pnl += t.pnl; days[name].c++;
      if (t.pnl > 0) days[name].w++;
    });
    return WDAYS.map(name => ({ day: name, pnl: days[name]?.pnl || 0, wr: days[name] ? (days[name].w / days[name].c) * 100 : 0 }));
  }, [trades]);

  const gradeStats = useMemo(() => {
    const counts: Record<string, { count: number, pnl: number }> = { 
      'A': { count: 0, pnl: 0 }, 
      'B': { count: 0, pnl: 0 }, 
      'C': { count: 0, pnl: 0 }, 
      'D': { count: 0, pnl: 0 }, 
      'F': { count: 0, pnl: 0 } 
    };
    const monthTradeIds = new Map<string, number>(monthTrades.map(t => [t.id, t.pnl]));
    tradeReviews.forEach(r => {
      if (monthTradeIds.has(r.tradeId) && r.grade && counts[r.grade] !== undefined) {
        counts[r.grade].count++;
        counts[r.grade].pnl += monthTradeIds.get(r.tradeId) || 0;
      }
    });
    return Object.entries(counts).map(([name, v]) => ({ name, value: v.count, pnl: v.pnl }));
  }, [tradeReviews, monthTrades]);

  const scoreData = useMemo(() => {
    const pf = m.profitFactor;
    const wr = m.winRate;
    const rr = m.avgRR;
    
    // Normalize PF (0 to 2.5+)
    const pfScore = Math.min(100, Math.max(0, (pf / 2.5) * 100));
    // Normalize Win Rate (0 to 70%+)
    const wrScore = Math.min(100, Math.max(0, (wr / 0.7) * 100));
    // Normalize RR (0 to 3.0+)
    const rrScore = Math.min(100, Math.max(0, (rr / 3.0) * 100));
    
    // Discipline: Ratio of A/B trades in this month
    const monthReviews = tradeReviews.filter(r => monthTrades.find(t => t.id === r.tradeId));
    const goodGrades = monthReviews.filter(r => r.grade === 'A' || r.grade === 'B').length;
    const discScore = monthReviews.length > 0 ? (goodGrades / monthReviews.length) * 100 : 50;
    
    // Resilience: Max DD vs Total PnL (inverse)
    const ddRatio = m.totalPnl > 0 ? (m.maxDD / m.totalPnl) : 1;
    const resScore = Math.min(100, Math.max(0, 100 - (ddRatio * 50)));

    const average = Math.round((pfScore + wrScore + rrScore + discScore + resScore) / 5);

    return {
      radar: [
        { subject: 'Profit Factor', A: pfScore, fullMark: 100 },
        { subject: 'Win Rate', A: wrScore, fullMark: 100 },
        { subject: 'Risk (RR)', A: rrScore, fullMark: 100 },
        { subject: 'Discipline', A: discScore, fullMark: 100 },
        { subject: 'Resilience', A: resScore, fullMark: 100 },
      ],
      total: average
    };
  }, [m, tradeReviews, monthTrades]);

  const mistakeStats = useMemo(() => {
    const counts: Record<string, number> = {};
    tradeReviews.forEach(r => {
      if (r.mistakes) {
        r.mistakes.forEach(m_v => {
          counts[m_v] = (counts[m_v] || 0) + 1;
        });
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [tradeReviews]);

  const simulated = useMemo(() => {
    const mistakeTradeIds = new Set(tradeReviews.filter(r => r.mistakes && r.mistakes.length > 0).map(r => r.tradeId));
    const lowGradeTradeIds = new Set(tradeReviews.filter(r => r.grade === 'C' || r.grade === 'D' || r.grade === 'F').map(r => r.tradeId));
    const filtered = monthTrades.filter(t => !mistakeTradeIds.has(t.id) && !lowGradeTradeIds.has(t.id));
    if (filtered.length === monthTrades.length) {
      const sortMonth = [...monthTrades].sort((a, b) => a.pnl - b.pnl);
      return { metrics: computeMetrics(sortMonth.slice(3)), method: "Biggest Losers" };
    }
    return { metrics: computeMetrics(filtered), method: "Discipline-Adjusted" };
  }, [monthTrades, tradeReviews]);

  const SEC = ({ title, children, action, sub }: any) => (
    <div style={{ ...cardStyle(), marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: children ? 14 : 0, paddingBottom: children ? 10 : 0, borderBottom: children ? "1px solid var(--b1)" : "none" }}>
        <div>
          <div className="h4">{title}</div>
          {sub && <div style={{ fontSize: 10, color: "var(--t3)", marginTop: 2 }}>{sub}</div>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );

  const SH = (label: string, value: any, color?: string, sub?: string) => <div style={{ background: "var(--s2)", borderRadius: 7, border: "1px solid var(--b1)", padding: "12px 14px" }}><div className="h4" style={{ marginBottom: 5 }}>{label}</div><div className="mono fade-in" style={{ fontSize: 16, fontWeight: 700, color: color || "var(--t1)" }}>{value}</div>{sub && <div style={{ fontSize: 9, color: "var(--t3)", marginTop: 3 }}>{sub}</div>}</div>;

  if (!trades.length) return <EmptyState icon="◈" title="No data yet" sub="Log some trades to see your stats." />;

  const isRiskNotSet = !riskSettings.dailyLimit || riskSettings.dailyLimit === 0;

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div><div className="h1">Stats & Performance Audit</div><div style={{ fontSize: 13, color: "var(--t2)", marginTop: 4 }}>{`${monthLabel}: ${monthTrades.length} trades`}</div></div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="month" style={{ background: "var(--s2)", padding: "8px 12px", border: "1px solid var(--b1)", color: "var(--t1)", borderRadius: 6, width: 160, fontSize: 12 }} value={statsMonth} onChange={x => setStatsMonth(x.target.value)} />
          <button style={{ padding: "8px 12px", borderRadius: 5, border: `1px solid var(--a)33`, cursor: "pointer", fontSize: 11, background: "var(--aBg)", color: "var(--a)" }} onClick={() => { const d = new Date(); setStatsMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`); }}>This Month</button>
        </div>
      </div>

      <div style={{ ...gridStyle(3, 16), marginBottom: 24 }}>
        <div style={{ ...cardStyle(), padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t1)", marginBottom: 8 }}>Best Month</div>
          <div className="h2" style={{ color: C.g }}>{fmt(m.bestMonth.pnl)}</div>
          <div style={{ fontSize: 10, color: "var(--t3)", marginTop: 4 }}>{m.bestMonth.name ? new Date(m.bestMonth.name + "-15").toLocaleString("en", { month: 'short', year: 'numeric' }) : '—'}</div>
        </div>
        <div style={{ ...cardStyle(), padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t1)", marginBottom: 8 }}>Lowest Month</div>
          <div className="h2" style={{ color: m.lowestMonth.pnl < 0 ? C.r : "var(--t1)" }}>{fmt(m.lowestMonth.pnl)}</div>
          <div style={{ fontSize: 10, color: "var(--t3)", marginTop: 4 }}>{m.lowestMonth.name ? new Date(m.lowestMonth.name + "-15").toLocaleString("en", { month: 'short', year: 'numeric' }) : '—'}</div>
        </div>
        <div style={{ ...cardStyle(), padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t1)", marginBottom: 8 }}>Average Monthly</div>
          <div className="h2" style={{ color: m.avgMonthlyPnl >= 0 ? C.g : C.r }}>{fmt(m.avgMonthlyPnl)}</div>
          <div style={{ fontSize: 10, color: "var(--t3)", marginTop: 4 }}>per month of activity</div>
        </div>
      </div>

      {isRiskNotSet && (
        <div style={{ background: 'var(--aBg)', padding: 24, borderRadius: 12, border: `2px dashed ${C.a}`, marginBottom: 24 }} className="fade-in">
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ fontSize: 32 }}>🛡️</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--t1)', marginBottom: 4 }}>Initialize Your Risk Guard</div>
              <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 16 }}>Performance tracking is meaningless without risk parameters. Define your limits below to unlock advanced analytics and behavior audits.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                <div>
                  <label style={lblStyle()}>Daily Loss Limit ($)</label>
                  <input style={inpStyle()} type="number" placeholder="e.g. 500" onChange={e => setRiskSettings({ ...riskSettings, dailyLimit: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <label style={lblStyle()}>Max Daily Trades</label>
                  <input style={inpStyle()} type="number" placeholder="e.g. 3" onChange={e => setRiskSettings({ ...riskSettings, maxTrades: parseInt(e.target.value) || 0 })} />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button style={{ ...btnStyle(true), width: '100%', height: 38 }} onClick={() => setIsEditingRisk(false)}>Confirm Limits</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <SEC title={`Portfolio Key Metrics`}>
        <div style={gridStyle(4, 10)}>
          {SH("Total P&L", fmt(m.totalPnl), m.totalPnl >= 0 ? C.g : C.r)}
          {SH("Avg Daily Volume", m.avgDailyVolume.toFixed(2), "var(--t1)", "Trades per day")}
          {SH("Avg Winning Trade", fmt(m.avgWin), C.g)}
          {SH("Avg Losing Trade", fmt(m.avgLoss), C.r)}
          {SH("Total Number of Trades", m.totalTrades, "var(--t1)")}
          {SH("Number of Winning Trades", m.wins, C.g)}
          {SH("Number of Losing Trades", m.losses, C.r)}
          {SH("Number of Break-Even Trades", m.beTrades, "var(--t3)")}
          {SH("Max Consecutive Wins", m.bestStreak, C.g)}
          {SH("Max Consecutive Losses", m.worstStreak, C.r)}
          {SH("Win Rate", pct(m.winRate), m.winRate >= .5 ? C.g : C.r, `${m.wins}W / ${m.losses}L`)}
          {SH("Profit Factor", m.profitFactor.toFixed(2), m.profitFactor >= 1.5 ? C.g : "var(--am)")}
          {SH("Expectancy", fmt(m.expectancy), m.expectancy > 0 ? C.g : C.r, "Expected $ per trade")}
          {SH("Avg R:R", `${m.avgRR.toFixed(2)}R`, m.avgRR >= 1.5 ? C.g : "var(--am)")}
          {SH("SQN", m.sqn.toFixed(2), m.sqn >= 1.6 ? C.g : "var(--am)", "System Quality Number")}
          {SH("Recovery Factor", m.recoveryFactor.toFixed(2), m.recoveryFactor >= 2 ? C.g : "var(--am)", "Profit / Max DD")}
          {SH("Largest Profit", fmt(m.largestWin), C.g)}
          {SH("Largest Loss", fmt(m.largestLoss), C.r)}
          {SH("Max DD", fmt(m.maxDD), C.r)}
          {SH("Payoff Ratio", m.payoffRatio.toFixed(2), m.payoffRatio >= 1.5 ? C.g : "var(--am)", "Avg Win / Avg Loss")}
          {SH("Volatility (σ)", m.stdDev.toFixed(1), "var(--t3)", "PnL Standard Deviation")}
          {SH("Avg Hold Time (All)", fmtDur(m.avgDuration), "var(--am)")}
          {SH("Avg Hold Time (Wins)", fmtDur(m.avgWinDuration), C.g)}
          {SH("Avg Hold Time (Losses)", fmtDur(m.avgLossDuration), C.r)}
        </div>
      </SEC>

      <div style={gridStyle(2, 12)}>
        <SEC title="Trade Grading" sub="Execution quality breakdown">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={gradeStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--b1)" />
              <XAxis dataKey="name" stroke="transparent" fontSize={10} tick={{ fill: "var(--t2)" }} />
              <YAxis stroke="transparent" fontSize={10} tick={{ fill: "var(--t2)" }} />
              <Tooltip content={<CT />} />
              <Bar dataKey="value" name="Trades" radius={[2, 2, 0, 0]} barSize={24}>
                {gradeStats.map((d, i) => (
                  <Cell key={i} fill={d.name === 'A' || d.name === 'B' ? C.g : d.name === 'C' ? C.am : C.r} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </SEC>
        <SEC title="Behavioral Leaks" sub="Most frequent execution mistakes">
          {mistakeStats.length > 0 ? (
            <div style={{ display: 'grid', gap: 10 }}>
              {mistakeStats.map((m_v, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--s2)', padding: '10px 14px', borderRadius: 6, border: '1px solid var(--b1)' }}>
                  <div style={{ fontSize: 13, color: 'var(--t1)' }}>{m_v.name}</div>
                  <div style={{ ...badgeStyle(C.r, C.rBg), fontSize: 10 }}>{m_v.value} occurrences</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center', padding: '40px 0' }}>No mistakes logged yet. Perfect discipline!</div>
          )}
        </SEC>
      </div>

      <div style={gridStyle(2, 12)}>
        <SEC 
          title="Edge Analysis" 
          sub="Efficiency & Execution Quality"
        >
          <div style={gridStyle(2, 10)}>
            {efficiency && (
              <Fragment>
                {SH("Avg MFE (Potential)", fmt(efficiency.avgMfe), C.g, "Max favorable move")}
                {SH("Profit Efficiency", pct(efficiency.captured), C.a, "Amount of move captured")}
                {SH("Avg MAE (Hardship)", fmt(efficiency.avgMae), C.r, "Heat taken on average")}
                {SH("Risk Utilization", ((efficiency.avgMae / Math.abs(m.avgLoss)) * 100).toFixed(1) + "%", C.am, "MAE relative to Stop Loss")}
              </Fragment>
            )}
            {!efficiency && <div style={{ gridColumn: '1/-1', color: 'var(--t3)', fontSize: 12, textAlign: 'center', padding: '20px' }}>Fill in MAE/MFE in your trade logs to see efficiency stats.</div>}
          </div>
        </SEC>
        <SEC title="Vigilant Score" sub="Multi-dimensional performance evaluation">
          <div style={{ position: 'relative' }}>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={scoreData.radar}>
                <PolarGrid stroke="var(--b2)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "var(--t3)", fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Metrics"
                  dataKey="A"
                  stroke={C.a}
                  fill={C.a}
                  fillOpacity={0.4}
                />
              </RadarChart>
            </ResponsiveContainer>
            <div style={{ textAlign: 'center', marginTop: -10 }}>
              <div style={{ fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Your Vigilant Score</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: scoreData.total > 70 ? C.g : scoreData.total > 40 ? C.am : C.r }}>{scoreData.total}</div>
              <div style={{ width: '60%', height: 4, background: 'var(--b1)', margin: '10px auto', borderRadius: 2, position: 'relative' }}>
                <div style={{ position: 'absolute', left: 0, height: '100%', width: `${scoreData.total}%`, background: `linear-gradient(to right, ${C.r}, ${C.am}, ${C.g})`, borderRadius: 2 }} />
              </div>
            </div>
          </div>
        </SEC>
      </div>

      <div style={gridStyle(2, 12)}>
        <SEC title="P&L by Strategy" sub="Setup performance comparison">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={playbookEdge} margin={{ bottom: 80, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--b1)" />
              <XAxis dataKey="name" stroke="transparent" fontSize={10} tick={{ fill: "var(--t2)" }} interval={0} angle={-45} textAnchor="end" />
              <YAxis stroke="transparent" fontSize={10} tick={{ fill: "var(--t2)" }} />
              <Tooltip content={<CT />} />
              <Bar dataKey="pnl" name="P&L" radius={[2, 2, 0, 0]} barSize={32}>
                {playbookEdge.map((d, i) => <Cell key={i} fill={d.pnl > 0 ? "var(--g)" : "var(--r)"} fillOpacity={0.8} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </SEC>
        <SEC title="Performance Heatmap" sub="P&L by Day vs Hour (NY Time)">
          <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr', gap: 4 }}>
            <div />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--t3)', paddingBottom: 4 }}>
               {["08", "10", "12", "14", "16", "18", "20"].map(h => <span key={h}>{h}h</span>)}
            </div>
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(day => (
              <Fragment key={day}>
                <div style={{ fontSize: 9, color: 'var(--t3)', alignSelf: 'center' }}>{day.slice(0, 3)}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(13, 1fr)', gap: 2, height: 28, marginBottom: 4 }}>
                  {["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"].map(hour => {
                    const cell = heatmap.find(h => h.day === day && h.hour === hour);
                    const color = cell ? (cell.pnl > 0 ? C.g : cell.pnl < 0 ? C.r : C.a) : 'var(--s3)';
                    const opacity = cell ? Math.min(0.2 + (Math.abs(cell.count) / 5), 1) : 0.2;
                    return (
                      <div 
                        key={hour} 
                        title={cell ? `${day} ${hour}: ${fmt(cell.pnl)} (${cell.count} trades)` : "No trades"}
                        style={{ background: color, opacity, borderRadius: 2 }} 
                      />
                    );
                  })}
                </div>
              </Fragment>
            ))}
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 12, alignItems: 'center', fontSize: 9, color: 'var(--t3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 8, height: 8, background: C.g, borderRadius: 2 }} /> Profits</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 8, height: 8, background: C.r, borderRadius: 2 }} /> Losses</div>
            <div style={{ flex: 1 }} />
            <span>Opacity = Trade Frequency</span>
          </div>
        </SEC>
      </div>

      <div style={gridStyle(2, 12)}>
        <SEC title="Asset Allocation" sub="Trade volume share by symbol">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={bySym}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--b1)" />
              <XAxis dataKey="name" stroke="transparent" fontSize={10} tick={{ fill: "var(--t2)" }} />
              <YAxis stroke="transparent" fontSize={10} tick={{ fill: "var(--t2)" }} />
              <Tooltip content={<CT />} />
              <Bar dataKey="c" name="Trades" radius={[2, 2, 0, 0]} barSize={24} fill="var(--a)" fillOpacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </SEC>
        <SEC title="Day-of-Week Edge" sub="Which days you trade best">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dayStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--b1)" />
              <XAxis dataKey="day" stroke="transparent" fontSize={10} tick={{ fill: "var(--t2)" }} />
              <YAxis stroke="transparent" fontSize={10} tick={{ fill: "var(--t2)" }} />
              <Tooltip content={<CT />} />
              <Bar dataKey="pnl" name="P&L" radius={[2, 2, 0, 0]} barSize={24}>
                {dayStats.map((d, i) => <Cell key={i} fill={d.pnl > 0 ? "var(--g)" : "var(--r)"} fillOpacity={0.8} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </SEC>
      </div>

      <div style={gridStyle(2, 12)}>
        <SEC title="Equity Curve">
          <TradeChart data={cumData} height={200} dark={dark} />
        </SEC>
        <SEC title="Consistency Matrix" sub="P&L Distribution by Asset">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={bySym}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--b1)" />
              <XAxis dataKey="name" stroke="transparent" fontSize={10} tick={{ fill: "var(--t2)" }} />
              <YAxis stroke="transparent" fontSize={10} tick={{ fill: "var(--t2)" }} />
              <Tooltip content={<CT />} />
              <Bar dataKey="pnl" name="P&L" radius={[2, 2, 0, 0]} barSize={32}>
                {bySym.map((d: any, i: number) => <Cell key={i} fill={d.pnl > 0 ? "var(--a)" : "var(--r)"} fillOpacity={0.8} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </SEC>
      </div>

      <SEC title={`What-If Analysis (${monthLabel})`}>
        <div style={{ marginBottom: 20, padding: '12px 16px', background: 'var(--aBg)', borderRadius: 10, border: `1px solid var(--aB)`, fontSize: 13, color: 'var(--t2)', lineHeight: 1.6 }}>
          {simulated.method.includes("Discipline-Adjusted") 
            ? <span>Analysis identifies results if trades with <strong>recorded mistakes</strong> or poor grades (<strong>C, D, F</strong>) were avoided. discipline is your greatest edge.</span>
            : <span>Simulating potential results by removing the <strong>3 largest losing trades</strong> from this period. This assumes tighter stop loss management or risk avoidance.</span>
          }
        </div>
        <div style={gridStyle(3, 16)}>
          <div style={{ borderLeft: `2px solid var(--t3)`, paddingLeft: 16, background: 'var(--s2)', padding: '12px 16px', borderRadius: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 6 }}>Actual P&L</div>
            <div className="mono" style={{ fontSize: 20, fontWeight: 800, color: monthPnl >= 0 ? "var(--g)" : "var(--r)" }}>{fmt(monthPnl)}</div>
          </div>
          <div style={{ borderLeft: `2px solid var(--g)`, paddingLeft: 16, background: 'var(--s2)', padding: '12px 16px', borderRadius: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 6 }}>Simulated P&L</div>
            <div className="mono" style={{ fontSize: 20, fontWeight: 800, color: "var(--g)" }}>{fmt(simulated.metrics.totalPnl)}</div>
          </div>
          <div style={{ borderLeft: `2px solid var(--a)`, paddingLeft: 16, background: 'var(--s2)', padding: '12px 16px', borderRadius: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 6 }}>Edge Decay</div>
            <div className="mono" style={{ fontSize: 20, fontWeight: 800, color: "var(--r)" }}>{fmt(simulated.metrics.totalPnl - monthPnl)}</div>
          </div>
        </div>
      </SEC>
    </div>
  );
}
