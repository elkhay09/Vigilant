/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Shield } from 'lucide-react';
import { Trade, RiskSettings } from '../types';
import { cardStyle, gridStyle, C, MiniStat, btnStyle, btnSmStyle, inpStyle, selStyle, Field } from './Common';
import { fmt, pct, today, uid } from '../lib/utils';
import { SYMBOLS, PNL_RATES } from '../constants';
import { PromptModal } from './Modals';
import { PrivacyValue } from './Common';

export function Risk({ 
  trades, 
  riskSettings, 
  setRiskSettings, 
  metrics,
  privacyMode,
  setPrivacyMode
}: { 
  trades: Trade[]; 
  riskSettings: RiskSettings; 
  setRiskSettings: React.Dispatch<React.SetStateAction<RiskSettings>>; 
  metrics: any;
  privacyMode: boolean;
  setPrivacyMode: (v: boolean) => void;
}) {
  const tDay = trades.filter(t => t.date === today());
  const ws = new Date(); ws.setDate(ws.getDate() - ws.getDay() + 1);
  const wT = trades.filter(t => t.date >= ws.toISOString().split("T")[0]);
  const dPnl = tDay.reduce((a, t) => a + t.pnl, 0), wPnl = wT.reduce((a, t) => a + t.pnl, 0);
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthTrades = trades.filter(t => t.date.startsWith(currentMonthKey));
  const monthPnl = monthTrades.reduce((a, t) => a + t.pnl, 0);
  const monthWr = monthTrades.length ? (monthTrades.filter(t => t.pnl > 0).length / monthTrades.length) * 100 : 0;
  const set = (k: string, v: any) => setRiskSettings((p: any) => ({ ...p, [k]: v }));
  const rules = riskSettings.nonNegotiables || [];
  const [ruleModal, setRuleModal] = useState<any>(null);

  const onSubmitRule = (text: string) => {
    if (ruleModal?.mode === "add") set("nonNegotiables", [...rules, { id: uid(), text }]);
    else if (ruleModal?.mode === "edit") set("nonNegotiables", rules.map(r => r.id === ruleModal.id ? { ...r, text } : r));
  };
  const delRule = (id: string) => { if (window.confirm("Delete rule?")) set("nonNegotiables", rules.filter(r => r.id !== id)); };

  const dU = riskSettings.dailyLimit > 0 ? Math.min(Math.abs(Math.min(0, dPnl)) / riskSettings.dailyLimit, 1) : 0;
  const wU = riskSettings.weeklyLimit > 0 ? Math.min(Math.abs(Math.min(0, wPnl)) / riskSettings.weeklyLimit, 1) : 0;
  const tU = riskSettings.maxTrades > 0 ? Math.min(tDay.length / riskSettings.maxTrades, 1) : 0;
  
  const cA = riskSettings.calcAccount ?? 10000, cR = riskSettings.calcRiskPct ?? 1, cS = riskSettings.calcSymbol || "NQ", cL = riskSettings.calcStop ?? 10;
  const rate = PNL_RATES[cS] || 1, rD = cA * (cR / 100), maxL = cL > 0 ? Math.floor(rD / (cL * rate)) : 0, aR = maxL * cL * rate;

  // Goal Progress Calculations
  const pnlGoal = riskSettings.monthlyTarget || 2000;
  const pnlProgress = Math.min(100, Math.max(0, (monthPnl / pnlGoal) * 100));
  const wrGoalPct = riskSettings.winRateTarget || 60;
  const wrProgress = Math.min(100, Math.max(0, (monthWr / wrGoalPct) * 100));

  return (
    <div className="fade-in">
      <div className="h1" style={{ marginBottom: 20 }}>Risk</div>

      <div style={{ ...cardStyle(), marginBottom: 14, padding: 20, borderLeft: `3px solid ${C.r}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div><div className="h3" style={{ color: C.r, fontSize: 14 }}>⛔ Non-Negotiable Rules</div><div style={{ fontSize: 11, color: "var(--t3)", marginTop: 2 }}>The rules you NEVER break</div></div>
          <button style={btnStyle(true)} onClick={() => setRuleModal({ mode: "add" })}>+ Add Rule</button>
        </div>
        {rules.length === 0 && <div style={{ padding: "18px", textAlign: "center", color: "var(--t3)", fontSize: 12, border: `1px dashed var(--b2)`, borderRadius: 6 }}>No rules set yet.</div>}
        {rules.map((r, i) => (
          <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "var(--s2)", borderRadius: 7, marginBottom: 6, border: `1px solid var(--b1)`, borderLeft: `3px solid ${C.r}` }}>
            <span style={{ fontSize: 11, color: C.r, fontWeight: 700, fontFamily: "var(--font-mono)", minWidth: 24 }}>{`#${i + 1}`}</span>
            <span style={{ flex: 1, fontSize: 13, color: "var(--t1)", fontWeight: 500, lineHeight: 1.5 }}>{r.text}</span>
            <button style={btnSmStyle()} onClick={() => setRuleModal({ mode: "edit", id: r.id, text: r.text })}>✏</button>
            <button style={btnSmStyle(C.r)} onClick={() => delRule(r.id)}>×</button>
          </div>
        ))}
      </div>

      {/* Goal Tracker Implementation in Risk Tab (Moved after Non-Negotiable Rules) */}
      <div style={{ ...cardStyle(), marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 16 }}>🎯</span>
          <div className="h3" style={{ marginBottom: 0, color: C.a }}>Goal Tracker & Risk Guards</div>
        </div>
        <div style={{ fontSize: 11, color: "var(--t3)", marginBottom: 16 }}>Track your monthly goals and enforce hard risk limits.</div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
          <Field label="Monthly P&L Target ($)">
            <input type="number" style={inpStyle()} value={riskSettings.monthlyTarget || ""} onChange={x => set("monthlyTarget", parseFloat(x.target.value) || 0)} placeholder="e.g. 2000" />
          </Field>
          <Field label="Win Rate Target (%)">
            <input type="number" step=".1" style={inpStyle()} value={riskSettings.winRateTarget || ""} onChange={x => set("winRateTarget", parseFloat(x.target.value) || 0)} placeholder="e.g. 60" />
          </Field>
          <Field label="Daily Loss Limit ($)">
            <input type="number" style={{ ...inpStyle(), borderColor: `${C.r}44` }} value={riskSettings.dailyLimit || ""} onChange={x => set("dailyLimit", parseFloat(x.target.value) || 0)} placeholder="Hard stop for the day" />
          </Field>
          <Field label="Max Daily Trades">
            <input type="number" style={{ ...inpStyle(), borderColor: `${C.a}44` }} value={riskSettings.maxTrades || ""} onChange={x => set("maxTrades", parseInt(x.target.value) || 0)} placeholder="e.g. 3" />
          </Field>
          <Field label="Weekly Max Drawdown ($)">
            <input type="number" style={{ ...inpStyle(), borderColor: `${C.r}44` }} value={riskSettings.weeklyLimit || ""} onChange={x => set("weeklyLimit", parseFloat(x.target.value) || 0)} placeholder="Weekly risk roof" />
          </Field>
          <Field label="Max Consec Losses">
            <input type="number" style={inpStyle()} value={riskSettings.maxConsecLosses || ""} onChange={x => set("maxConsecLosses", parseFloat(x.target.value) || 0)} placeholder="e.g. 2" />
          </Field>
        </div>

        <div style={{ background: 'var(--s2)', borderRadius: 8, padding: 14, border: '1px solid var(--b1)', marginBottom: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6 }}>
                <span style={{ color: 'var(--t2)' }}>Monthly P&L Progress</span>
                <span style={{ fontWeight: 700, color: monthPnl >= pnlGoal ? C.g : 'var(--t1)' }}>
                  <PrivacyValue value={monthPnl} privacyMode={privacyMode} /> 
                  <span style={{ color: 'var(--t3)', fontWeight: 400 }}> / <PrivacyValue value={pnlGoal} privacyMode={privacyMode} /></span>
                </span>
              </div>
              <div style={{ height: 5, background: 'var(--s3)', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pnlProgress}%`, background: C.g, transition: 'width 0.5s ease' }} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6 }}>
                <span style={{ color: 'var(--t2)' }}>Win Rate Progress</span>
                <span style={{ fontWeight: 700, color: monthWr >= wrGoalPct ? C.g : 'var(--t1)' }}>{monthWr.toFixed(1)}% <span style={{ color: 'var(--t3)', fontWeight: 400 }}>/ {wrGoalPct}%</span></span>
              </div>
              <div style={{ height: 5, background: 'var(--s3)', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${wrProgress}%`, background: C.g, transition: 'width 0.5s ease' }} />
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: "0 10px" }}>
          <div className="h4" style={{ fontSize: 11, color: "var(--am)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6, fontWeight: 700 }}>
            <Shield size={12} />
            <span style={{ letterSpacing: '0.5px' }}>LIVE RISK MONITOR</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, paddingBottom: 10 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                <span style={{ color: 'var(--t3)' }}>Daily Trades</span>
                <span style={{ fontWeight: 700, color: "var(--t1)" }}>
                  {tDay.length} <span style={{ color: 'var(--t3)', fontWeight: 400 }}>/ {riskSettings.maxTrades || "∞"}</span>
                </span>
              </div>
              <div style={{ height: 6, background: 'var(--s1)', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--b1)' }}>
                <div 
                  style={{ 
                    height: '100%', 
                    width: `${Math.min(tU * 100, 100)}%`, 
                    background: tU > 0.8 ? C.r : C.g, 
                    transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)' 
                  }} 
                />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                <span style={{ color: 'var(--t3)' }}>Daily Loss</span>
                <span style={{ fontWeight: 700, color: "var(--t1)" }}>
                  <PrivacyValue value={Math.abs(Math.min(0, dPnl))} privacyMode={privacyMode} />
                  <span style={{ color: 'var(--t3)', fontWeight: 400 }}> / <PrivacyValue value={riskSettings.dailyLimit} privacyMode={privacyMode} /></span>
                </span>
              </div>
              <div style={{ height: 6, background: 'var(--s1)', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--b1)' }}>
                <div 
                  style={{ 
                    height: '100%', 
                    width: `${Math.min(dU * 100, 100)}%`, 
                    background: dU > 0.8 ? C.r : C.g, 
                    transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)' 
                  }} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div style={{ ...cardStyle(), marginBottom: 14 }}>
        <div className="h3" style={{ marginBottom: 14, color: "var(--t2)" }}>Position Size Calculator</div>
        <div style={gridStyle(2, 10)}>
          <Field label="Account ($)"><input type="number" style={inpStyle()} value={cA} onChange={x => set("calcAccount", parseFloat(x.target.value) || 0)} /></Field>
          <Field label="Risk %"><input type="number" step=".1" style={inpStyle()} value={cR} onChange={x => set("calcRiskPct", parseFloat(x.target.value) || 0)} /></Field>
        </div>
        <div style={gridStyle(2, 10)}>
          <Field label="Symbol"><select style={selStyle()} value={cS} onChange={x => set("calcSymbol", x.target.value)}>{SYMBOLS.map(s => <option key={s}>{s}</option>)}</select></Field>
          <Field label="Stop (pts)"><input type="number" style={inpStyle()} value={cL} onChange={x => set("calcStop", parseFloat(x.target.value) || 0)} /></Field>
        </div>
        <div style={{ background: "var(--s2)", borderRadius: 8, padding: 18, border: "1px solid var(--b1)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            {[["Risk ($)", fmt(rD), "var(--am)"], ["Max Micros", maxL, C.g], ["Actual Risk", fmt(aR), "var(--am)"], ["$/pt", `$${rate}/pt`, C.a]].map(([l, v, c]) => (
              <div key={l as string}>
                <div className="h4" style={{ marginBottom: 4 }}>{l}</div>
                <div className="mono" style={{ fontWeight: 700, color: c as string, fontSize: 18 }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: "9px 12px", background: "var(--gBg)", borderRadius: 6, border: `1px solid var(--gB)`, fontSize: 12, color: C.g }}>{`Trade ${maxL} micros with ${cL}pt stop → risk ${fmt(aR)}`}</div>
        </div>
      </div>
      <div style={{ height: 20 }} />
      {ruleModal && <PromptModal title={ruleModal.mode === "add" ? "Add Rule" : "Edit Rule"} multiline onSubmit={onSubmitRule} onClose={() => setRuleModal(null)} initialValue={ruleModal.text} />}
    </div>
  );
}
