/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, Fragment } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, AreaChart, Area, ReferenceLine
} from 'recharts';
import { Trade, Profile, RiskSettings } from '../types';
import { cardStyle, gridStyle, Stat, badgeStyle, C, MiniStat, PrivacyValue } from './Common';
import { fmt, pct, getDQ, tradeDur, fmtDur } from '../lib/utils';
import { WDAYS } from '../constants';

function CT({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--s1)", border: "1px solid var(--b2)", borderRadius: 8, padding: "10px 14px", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,.3)" }}>
      <div style={{ color: "var(--t2)", marginBottom: 5, fontSize: 11, fontWeight: 500 }}>{label}</div>
      {payload.map((p: any, i: number) => <div key={i} style={{ color: p.color || "var(--t1)", fontWeight: 600, fontFamily: "var(--font-mono)" }}>{`${p.name}: ${typeof p.value === 'number' ? fmt(p.value) : p.value}`}</div>)}
    </div>
  );
}

import { TradeChart } from './TradeChart';

export function Dashboard({ 
  trades, 
  metrics, 
  profile, 
  riskSettings,
  dark,
  syncing,
  privacyMode,
  setPrivacyMode
}: { 
  trades: Trade[]; 
  metrics: any; 
  profile: Profile; 
  riskSettings: RiskSettings;
  dark: boolean;
  syncing?: boolean;
  privacyMode: boolean;
  setPrivacyMode: (v: boolean) => void;
}) {
  const [calM, setCalM] = useState(() => { const d = new Date(); return { yr: d.getFullYear(), mo: d.getMonth() }; });
  const [sel, setSel] = useState<string | null>(null);
  const quote = useMemo(() => getDQ(), []);
  const now = new Date();
  const hour = now.getHours();
  const todayStr = new Date().toISOString().split("T")[0];
  
  const curMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthTr = trades.filter(t => t.date.startsWith(curMonth));
  const monthPnl = monthTr.reduce((a, t) => a + t.pnl, 0);
  const monthWins = monthTr.filter(t => t.pnl > 0).length;
  const monthLosses = monthTr.filter(t => t.pnl < 0).length;
  const monthWr = monthTr.length ? monthWins / monthTr.length : 0;
  const monthAvgRR = monthTr.length ? monthTr.reduce((a, t) => a + t.rr, 0) / monthTr.length : 0;
  
  const todayTrades = trades.filter(t => t.date === todayStr);
  const todayPnl = todayTrades.reduce((a, t) => a + t.pnl, 0);

  const cumData = useMemo(() => {
    if (trades.length === 0) return [];
    let cum = 0;
    const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));
    const dm: Record<string, number> = {};
    
    // Add a baseline point (day before first trade)
    const firstDate = new Date(sorted[0].date);
    firstDate.setDate(firstDate.getDate() - 1);
    const baseline = firstDate.toISOString().split('T')[0];
    
    const result = [{ time: baseline, value: 0 }];
    sorted.forEach(t => { 
      cum += t.pnl; 
      dm[t.date] = cum; 
    });
    
    Object.entries(dm).forEach(([d, v]) => {
      result.push({ time: d, value: parseFloat(v.toFixed(2)) });
    });
    return result;
  }, [trades]);

  const riskHealth = useMemo(() => {
    const dailyLimit = riskSettings?.dailyLimit || 500;
    const dailyPct = todayPnl < 0 ? (Math.abs(todayPnl) / dailyLimit) * 100 : 0;
    const drawdownPct = metrics.maxDD > 0 ? (metrics.maxDD / (riskSettings?.weeklyLimit || 1500)) * 100 : 0;
    
    let status = "Healthy";
    let color = C.g;
    if (dailyPct > 80 || drawdownPct > 80) { status = "Danger"; color = C.r; }
    else if (dailyPct > 50 || drawdownPct > 50) { status = "Warning"; color = "var(--am)"; }

    return { status, color, dailyPct, drawdownPct };
  }, [todayPnl, metrics.maxDD, riskSettings]);

  const calMap = useMemo(() => {
    const m: Record<string, any> = {};
    trades.forEach(t => {
      if (!m[t.date]) m[t.date] = { pnl: 0, c: 0, wins: 0, losses: 0, bes: 0, trades: [] };
      m[t.date].pnl += t.pnl;
      m[t.date].c++;
      if (t.pnl > 0) m[t.date].wins++;
      else if (t.pnl < 0) m[t.date].losses++;
      else m[t.date].bes++;
      m[t.date].trades.push(t);
    });
    return m;
  }, [trades]);

  const { yr, mo } = calM;
  const dim = new Date(yr, mo + 1, 0).getDate();
  const calWeeks = []; let week = [];
  const fd7 = new Date(yr, mo, 1).getDay();
  for (let i = 0; i < fd7; i++) week.push(null);
  for (let d = 1; d <= dim; d++) { week.push(d); if (week.length === 7) { calWeeks.push(week); week = []; } }
  if (week.length > 0) { while (week.length < 7) week.push(null); calWeeks.push(week); }
  const mn = new Date(yr, mo, 1).toLocaleString("en", { month: "long", year: "numeric" });
  const mt = trades.filter(t => t.date.startsWith(`${yr}-${String(mo + 1).padStart(2, "0")}`));
  const mPnl = mt.reduce((a, t) => a + t.pnl, 0);
  const dateStr = now.toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const daysSinceBackup = profile?.lastBackup ? Math.floor((Date.now() - new Date(profile.lastBackup).getTime()) / 86400000) : null;
  const backupOverdue = daysSinceBackup === null || daysSinceBackup >= 7;

  return (
    <div className="fade-in">
      {backupOverdue && (
        <div style={{ padding: "10px 16px", background: "var(--amBg)", border: `1px solid var(--am)33`, borderRadius: 8, marginBottom: 16, fontSize: 12, color: "var(--am)", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 16 }}>⚠</span>
          <span>{daysSinceBackup === null ? "You haven't backed up yet. Go to Settings → Data → Export JSON to create your first backup." : `Last backup was ${daysSinceBackup} day${daysSinceBackup !== 1 ? "s" : ""} ago. Back up now via Settings → Data → Export JSON.`}</span>
        </div>
      )}

      {/* Greeting & Info Section */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 24, marginBottom: 28, alignItems: "center" }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
             <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-.5px", color: "var(--t1)", marginBottom: 4 }}>{`${hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"}, ${profile?.name || "Trader"}! 👋`}</div>
             {syncing && <span style={{ fontSize: 10, color: "var(--am)", background: "var(--amBg)", padding: "2px 6px", borderRadius: 4, height: 18, display: 'flex', alignItems: 'center' }}>☁ Syncing...</span>}
          </div>
          <div style={{ fontSize: 12, color: "var(--t3)", marginBottom: 6 }}>{dateStr}</div>
          <div style={{ fontSize: 12, color: "var(--t3)" }}>{`"${quote.q}" — ${quote.a}`}</div>
        </div>
        
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {metrics.currentStreak !== 0 && (
            <div style={{ 
              background: metrics.currentStreak > 0 ? 'var(--gBg)' : 'var(--rBg)', 
              color: metrics.currentStreak > 0 ? C.g : C.r,
              padding: '12px 16px',
              borderRadius: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px solid ${metrics.currentStreak > 0 ? C.g : C.r}33`,
              minWidth: 80,
              height: 64
            }}>
              <div style={{ fontSize: 18 }}>{metrics.currentStreak > 0 ? "🔥" : "❄️"}</div>
              <div style={{ fontSize: 13, fontWeight: 800 }}>{Math.abs(metrics.currentStreak)}</div>
              <div style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', opacity: .8 }}>Streak</div>
            </div>
          )}

          <div style={{ ...cardStyle(), padding: "12px 18px", border: `1px solid ${riskHealth.color}33`, display: 'flex', gap: 14, alignItems: 'center', minWidth: 240, height: 64 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: riskHealth.color, boxShadow: `0 0 10px ${riskHealth.color}66` }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "var(--t1)", textTransform: "uppercase" }}>{riskHealth.status}</div>
                <div style={{ fontSize: 10, color: riskHealth.color, fontWeight: 700 }}>{riskHealth.dailyPct.toFixed(0)}% Cap</div>
              </div>
              <div style={{ width: "100%", height: 6, background: "var(--s3)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${Math.min(100, riskHealth.dailyPct)}%`, height: "100%", background: riskHealth.color, transition: "width .4s" }} />
              </div>
              <div style={{ fontSize: 9, color: 'var(--t3)', marginTop: 4 }}>Risk Compliance Monitor</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ ...gridStyle(4, 10), marginBottom: 20 }}>
        <Stat label="Monthly P&L" value={<PrivacyValue value={monthPnl} privacyMode={privacyMode} />} color={monthPnl >= 0 ? C.g : C.r} sub={now.toLocaleString("en", { month: "long" })} />
        <Stat label="Win Rate" value={pct(monthWr)} color={monthWr >= 0.5 ? C.g : C.r} sub={`${monthWins}W / ${monthLosses}L`} />
        <Stat label="Avg R:R" value={`${monthAvgRR.toFixed(2)}R`} color={monthAvgRR >= 1.5 ? C.g : C.am} sub="this month" />
        <Stat label="Trades" value={monthTr.length} color="var(--t1)" sub={now.toLocaleString("en", { month: "short" }) + " " + now.getFullYear()} />
      </div>
      <div style={{ ...cardStyle(), marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => setCalM(p => p.mo === 0 ? { yr: p.yr - 1, mo: 11 } : { yr: p.yr, mo: p.mo - 1 })} style={{ padding: "3px 10px", borderRadius: 5, border: "1px solid var(--b1)", cursor: "pointer", fontSize: 15, background: "var(--s2)", color: "var(--t1)" }}>‹</button>
            <span className="h2" style={{ minWidth: 160, textAlign: "center" }}>{mn}</span>
            <button onClick={() => setCalM(p => p.mo === 11 ? { yr: p.yr + 1, mo: 0 } : { yr: p.yr, mo: p.mo + 1 })} style={{ padding: "3px 10px", borderRadius: 5, border: "1px solid var(--b1)", cursor: "pointer", fontSize: 15, background: "var(--s2)", color: "var(--t1)" }}>›</button>
            <button onClick={() => { const n = new Date(); setCalM({ yr: n.getFullYear(), mo: n.getMonth() }); }} style={{ padding: "3px 10px", borderRadius: 5, border: `1px solid var(--a)33`, cursor: "pointer", fontSize: 10, background: "var(--aBg)", color: "var(--a)" }}>Today</button>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{ ...badgeStyle(mPnl >= 0 ? C.g : C.r, mPnl >= 0 ? "var(--gBg)" : "var(--rBg)"), padding: "4px 12px", fontFamily: "var(--font-mono)" }}>
               <PrivacyValue value={mPnl} privacyMode={privacyMode} />
            </span>
            <span style={{ ...badgeStyle(C.a, "var(--aBg)"), padding: "4px 10px" }}>{`${mt.length} trades`}</span>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr) 70px", gap: 0 }}>
          {WDAYS.map((d, i) => <div key={d} style={{ color: i === 0 || i === 6 ? C.r : "var(--t3)", fontSize: 10, fontWeight: 600, padding: "5px 4px", textAlign: "center", borderBottom: "1px solid var(--b1)", textTransform: "uppercase" }}>{"  " + d}</div>)}
          <div style={{ color: "var(--t3)", fontSize: 10, fontWeight: 600, padding: "5px 6px", textAlign: "center", borderBottom: "1px solid var(--b1)", textTransform: "uppercase" }}>Week</div>
          {calWeeks.map((weekItem, wi) => {
            const wPnl = weekItem.reduce((a, d) => { if (!d) return a; const ds = `${yr}-${String(mo + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`; return a + (calMap[ds]?.pnl || 0); }, 0);
            const wT = weekItem.reduce((a, d) => { if (!d) return a; const ds = `${yr}-${String(mo + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`; return a + (calMap[ds]?.c || 0); }, 0);
            return (
              <Fragment key={wi}>
                {weekItem.map((d, di) => {
                  const isWeekend = di === 0 || di === 6;
                  if (!d) return <div key={di} style={{ borderBottom: `1px solid var(--b1)22`, minHeight: 62, background: isWeekend ? `${C.r}04` : "transparent" }} />;
                  const ds = `${yr}-${String(mo + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                  const data = calMap[ds]; const isT = ds === todayStr; const isSel = ds === sel;
                  const bg = isSel ? `var(--a)15` : data ? (data.pnl > 0 ? "var(--gBg)" : data.pnl < 0 ? "var(--rBg)" : "transparent") : isWeekend ? `${C.r}04` : "transparent";
                  return (
                    <div key={di} onClick={() => data && setSel(isSel ? null : ds)} style={{ padding: "6px 5px", borderBottom: `1px solid var(--b1)22`, minHeight: 62, background: bg, cursor: data ? "pointer" : "default" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                        <span style={{ fontSize: 10, color: isT ? C.g : isWeekend ? C.r : "var(--t3)", fontWeight: isT ? 700 : 400, ...(isT ? { background: "var(--gBg)", borderRadius: 3, padding: "0 5px" } : {}) }}>{d}</span>
                        {data && <span style={{ fontSize: 8, color: "var(--t3)", background: "var(--s2)", borderRadius: 3, padding: "1px 4px" }}>{data.c}</span>}
                      </div>
                      {data && (
                        <div>
                          <div style={{ color: data.pnl > 0 ? C.g : data.pnl < 0 ? C.r : "var(--am)", fontWeight: 700, fontFamily: "var(--font-mono)", fontSize: 11 }}>
                            {data.pnl === 0 ? "BE" : <PrivacyValue value={data.pnl} privacyMode={privacyMode} />}
                          </div>
                          <div style={{ fontSize: 8, color: "var(--t3)" }}>{`${data.wins}W ${data.losses}L${data.bes > 0 ? ` ${data.bes}B` : ""}`}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
                <div key="w" style={{ borderBottom: `1px solid var(--b1)22`, minHeight: 62, padding: "6px 4px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: wT > 0 ? (wPnl > 0 ? "var(--gBg)" : wPnl < 0 ? "var(--rBg)" : "var(--amBg)") : "transparent" }}>
                  {wT > 0 && (
                    <Fragment>
                      <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 11, color: wPnl >= 0 ? C.g : C.r }}>
                        <PrivacyValue value={wPnl} privacyMode={privacyMode} />
                      </div>
                      <div style={{ fontSize: 8, color: "var(--t3)", marginTop: 1 }}>{`${wT}t`}</div>
                    </Fragment>
                  )}
                </div>
              </Fragment>
            );
          })}
        </div>
        {sel && calMap[sel] && (
          <div style={{ marginTop: 12, background: "var(--s2)", borderRadius: 7, border: "1px solid var(--b1)", overflow: "hidden" }}>
            <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--b1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="h3">{new Date(sel + "T12:00:00").toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })}</span>
                <span style={badgeStyle(calMap[sel].pnl >= 0 ? C.g : C.r, calMap[sel].pnl >= 0 ? "var(--gBg)" : "var(--rBg)")}>
                   <PrivacyValue value={calMap[sel].pnl} privacyMode={privacyMode} />
                </span>
              </div>
              <button onClick={() => setSel(null)} style={{ background: "none", border: "none", color: "var(--t3)", cursor: "pointer", fontSize: 16 }}>×</button>
            </div>
            {calMap[sel].trades.map((t: Trade) => (
              <div key={t.id} style={{ padding: "8px 16px", borderBottom: `1px solid var(--b1)22`, display: "grid", gridTemplateColumns: "50px 38px 50px 1fr 70px 46px 60px", alignItems: "center", gap: 8, fontSize: 12 }}>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--t3)", fontSize: 10 }}>{t.session === "New York" ? "NY" : t.session.slice(0, 3)}</span>
                <span style={{ fontWeight: 700 }}>{t.symbol}</span>
                <span style={badgeStyle(t.direction === "Long" ? C.g : C.r, t.direction === "Long" ? "var(--gBg)" : "var(--rBg)")}>{t.direction}</span>
                <span style={{ color: "var(--t2)", fontSize: 11 }}>{t.strategy}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: t.pnl >= 0 ? C.g : C.r, textAlign: "right" }}>
                  <PrivacyValue value={t.pnl} privacyMode={privacyMode} />
                </span>
                <span style={{ fontFamily: "var(--font-mono)", color: t.rr >= 0 ? C.g : C.r, textAlign: "right", fontSize: 11 }}>{`${t.rr.toFixed(1)}R`}</span>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--t3)", fontSize: 10 }}>{tradeDur(t) > 0 ? fmtDur(tradeDur(t)) : "—"}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={cardStyle()}>
        <div className="h4" style={{ marginBottom: 14 }}>Equity Curve</div>
        <TradeChart data={cumData} height={220} dark={dark} />
      </div>
    </div>
  );
}
