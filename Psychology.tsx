/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { Trade } from '../types';
import { cardStyle, gridStyle, C, MiniStat } from './Common';
import { fmt, pct } from '../lib/utils';
import { MENTAL_STATES, RULES } from '../constants';

const CT = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--s1)", border: "1px solid var(--b2)", borderRadius: 8, padding: "10px 14px", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,.3)" }}>
      <div style={{ color: "var(--t2)", marginBottom: 5, fontSize: 11, fontWeight: 500 }}>{label}</div>
      {payload.map((p: any, i: number) => <div key={i} style={{ color: p.color || "var(--t1)", fontWeight: 600, fontFamily: "var(--font-mono)" }}>{`${p.name}: ${typeof p.value === 'number' ? fmt(p.value) : p.value}`}</div>)}
    </div>
  );
};

const CTCount = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--s1)", border: "1px solid var(--b2)", borderRadius: 8, padding: "10px 14px", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,.3)" }}>
      <div style={{ color: "var(--t2)", marginBottom: 5, fontSize: 11, fontWeight: 500 }}>{label}</div>
      {payload.map((p: any, i: number) => <div key={i} style={{ color: p.color || "var(--t1)", fontWeight: 600, fontFamily: "var(--font-mono)" }}>{`${p.name}: ${p.value}`}</div>)}
    </div>
  );
};

export function Psychology({ trades }: { trades: Trade[] }) {
  const mentalData = useMemo(() => {
    const m: any = {};
    trades.forEach(t => { if (!m[t.mentalPre]) m[t.mentalPre] = { pnl: 0, c: 0 }; m[t.mentalPre].pnl += t.pnl; m[t.mentalPre].c++; });
    return Object.entries(m).map(([s, v]: any) => ({ state: s, ...v })).sort((a, b) => b.pnl - a.pnl);
  }, [trades]);

  const mentalComp = useMemo(() => {
    const s: any = {};
    MENTAL_STATES.forEach(st => s[st] = { pre: 0, during: 0, post: 0 });
    trades.forEach(t => { if (s[t.mentalPre]) s[t.mentalPre].pre++; if (s[t.mentalDuring]) s[t.mentalDuring].during++; if (s[t.mentalPost]) s[t.mentalPost].post++; });
    return Object.entries(s).filter(([, v]: any) => v.pre + v.during + v.post > 0).map(([state, v]: any) => ({ state, ...v })).sort((a, b) => b.pre - a.pre);
  }, [trades]);

  const ds = trades.length ? trades.reduce((a, t) => a + t.followedRules.length / RULES.length, 0) / trades.length : 0;
  const fT = trades.filter(t => t.followedRules.length >= RULES.length * .7), bT = trades.filter(t => t.followedRules.length < RULES.length * .7);
  const fPnl = fT.reduce((a, t) => a + t.pnl, 0), bPnl = bT.reduce((a, t) => a + t.pnl, 0);
  const fWr = fT.length ? fT.filter(t => t.pnl > 0).length / fT.length : 0, bWr = bT.length ? bT.filter(t => t.pnl > 0).length / bT.length : 0;

  return (
    <div className="fade-in">
      <div className="h1" style={{ marginBottom: 20 }}>Psychology</div>
      <div style={{ ...gridStyle(4, 10), marginBottom: 16 }}>
        <MiniStat label="Discipline Score" value={pct(ds)} color={ds >= .7 ? C.g : "var(--am)"} />
        <MiniStat label="Rules/Trade" value={`${trades.length ? (trades.reduce((a, t) => a + t.followedRules.length, 0) / trades.length).toFixed(1) : 0}/${RULES.length}`} color={C.a} />
        <MiniStat label="Best Pre-State" value={mentalData[0]?.state || "—"} color={C.g} />
        <MiniStat label="Worst Pre-State" value={mentalData[mentalData.length - 1]?.state || "—"} color={C.r} />
      </div>
      <div style={{ ...gridStyle(2, 12), marginBottom: 12 }}>
        <div style={{ ...cardStyle(), borderLeft: `3px solid ${C.g}` }}>
          <div className="h4" style={{ color: C.g, textTransform: 'uppercase', fontSize: 10, fontWeight: 800, marginBottom: 8, letterSpacing: '0.5px' }}>Disciplined History</div>
          <div style={{ display: "flex", gap: 20 }}>{[["Trades", fT.length, "var(--t1)"], ["P&L", fmt(fPnl), fPnl >= 0 ? C.g : C.r], ["Win Rate", pct(fWr), fWr >= .5 ? C.g : C.r]].map(([l, v, c]) => <div key={l as string}><div className="h4" style={{ marginBottom: 3 }}>{l}</div><div className="mono" style={{ fontSize: 18, fontWeight: 700, color: c as string }}>{v}</div></div>)}</div>
        </div>
        <div style={{ ...cardStyle(), borderLeft: `3px solid ${C.r}` }}>
          <div className="h4" style={{ color: C.r, textTransform: 'uppercase', fontSize: 10, fontWeight: 800, marginBottom: 8, letterSpacing: '0.5px' }}>Guideline Leaks</div>
          <div style={{ display: "flex", gap: 20 }}>{[["Trades", bT.length, "var(--t1)"], ["P&L", fmt(bPnl), bPnl >= 0 ? C.g : C.r], ["Win Rate", pct(bWr), bWr >= .5 ? C.g : C.r]].map(([l, v, c]) => <div key={l as string}><div className="h4" style={{ marginBottom: 3 }}>{l}</div><div className="mono" style={{ fontSize: 18, fontWeight: 700, color: c as string }}>{v}</div></div>)}</div>
        </div>
      </div>
      <div style={{ ...cardStyle(), marginBottom: 12 }}>
        <div className="h4" style={{ marginBottom: 14 }}>Mental State → P&L (Pre-Trade)</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={mentalData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--b1)" />
            <XAxis type="number" stroke="transparent" fontSize={10} tick={{ fill: "var(--t2)" }} />
            <YAxis dataKey="state" type="category" stroke="transparent" fontSize={10} width={90} tick={{ fill: "var(--t2)" }} />
            <Tooltip content={<CT />} />
            <Bar dataKey="pnl" name="P&L" radius={[0, 4, 4, 0]} fill={C.a} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={cardStyle()}>
        <div className="h4" style={{ marginBottom: 14 }}>Mental Frequency</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={mentalComp}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--b1)" />
            <XAxis dataKey="state" stroke="transparent" fontSize={9} angle={-15} textAnchor="end" height={40} tick={{ fill: "var(--t2)" }} />
            <YAxis stroke="transparent" fontSize={10} tick={{ fill: "var(--t2)" }} />
            <Tooltip content={<CTCount />} />
            <Bar dataKey="pre" name="Pre-Trade" fill={C.a} radius={[3, 3, 0, 0]} />
            <Bar dataKey="during" name="During" fill="var(--am)" radius={[3, 3, 0, 0]} />
            <Bar dataKey="post" name="Post-Trade" fill={C.a} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
