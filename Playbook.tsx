/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, Fragment } from 'react';
import { PlaybookSetup, Trade } from '../types';
import {
  cardStyle, badgeStyle, btnStyle, btnSmStyle, gridStyle,
  C, Field, ModalPortal, modalStyle, ovStyle, taStyle, inpStyle, selStyle,
  EmptyState, PrivacyValue
} from './Common';
import { pct, fmt, uid } from '../lib/utils';
import { SYMBOLS, SESSIONS, ENTRY_WINDOWS } from '../constants';
import { MultiUrlInput, ImageUploader } from './Modals';

export function Playbook({ 
  setups, 
  setSetups, 
  trades,
  privacyMode
}: { 
  setups: PlaybookSetup[]; 
  setSetups: React.Dispatch<React.SetStateAction<PlaybookSetup[]>>; 
  trades: Trade[];
  privacyMode: boolean;
}) {
  const [modal, setModal] = useState(false); const [f, setF] = useState<any>(null);
  const [collapsedSetups, setCollapsedSetups] = useState(() => new Set());
  const save = () => { const en = { ...f, id: f.id || uid(), updatedAt: new Date().toISOString() }; setSetups(p => { const i = p.findIndex(x => x.id === en.id); if (i >= 0) { const n = [...p]; n[i] = en; return n; } return [...p, en]; }); setModal(false); };
  const toggleSetup = (id: string) => setCollapsedSetups(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const gC: Record<string, string> = { "A+": C.g, A: C.g, B: C.a, C: "var(--am)" };

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, gap: 10, flexWrap: "wrap" }}>
        <div>
          <div className="h1">Playbook</div>
          <div style={{ fontSize: 12, color: "var(--t3)", marginTop: 2 }}>Your setups are the only strategies available when logging trades</div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {setups.length > 0 && <button style={btnSmStyle()} onClick={() => setCollapsedSetups(new Set(setups.map(s => s.id)))}>Collapse All</button>}
          {setups.length > 0 && <button style={btnSmStyle()} onClick={() => setCollapsedSetups(new Set())}>Expand All</button>}
          <button style={btnStyle(true)} onClick={() => { setF({ id: null, name: "", symbol: "ES", session: "New York", timeframe: "15m", description: "", entryRules: "", invalidation: "", targetRR: "2.0", grade: "A+", images: [], urls: [] }); setModal(true); }}>+ Add Setup</button>
        </div>
      </div>
      {setups.map(s => {
        const matched = trades.filter(t => t.strategy === s.name);
        const tPnl = matched.reduce((a, t) => a + t.pnl, 0), wr = matched.length ? matched.filter(t => t.pnl > 0).length / matched.length : 0;
        const isCollapsed = collapsedSetups.has(s.id);
        return (
          <div key={s.id} style={{ ...cardStyle(), marginBottom: 10, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: isCollapsed ? 0 : 14 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ ...badgeStyle(gC[s.grade] || C.a, `${gC[s.grade] || C.a}18`), fontSize: 12, padding: "3px 10px" }}>{s.grade}</span>
                <div className="h2">{s.name || "Unnamed"}</div>
                {[s.symbol, s.session, s.timeframe].map(x => <span key={x} style={badgeStyle("var(--t2)", "var(--s2)")}>{x}</span>)}
              </div>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <button style={btnSmStyle()} onClick={() => toggleSetup(s.id)} title={isCollapsed ? "Expand" : "Collapse"}>{isCollapsed ? "▼" : "▲"}</button>
                <button style={btnSmStyle()} onClick={() => { setF({ ...s }); setModal(true); }}>✏</button>
                <button style={btnSmStyle(C.r)} onClick={() => { if (window.confirm("Delete setup?")) setSetups(p => p.filter(x => x.id !== s.id)); }}>×</button>
              </div>
            </div>
            {!isCollapsed && (
              <Fragment>
                {matched.length > 0 && <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>{[
                  ["Trades", matched.length, "var(--t1)"], 
                  ["Win Rate", pct(wr), wr >= .5 ? C.g : C.r], 
                  ["P&L", <PrivacyValue value={tPnl} privacyMode={privacyMode} />, tPnl >= 0 ? C.g : C.r], 
                  ["Target R:R", `${s.targetRR}R`, C.a]
                ].map(([l, v, c]) => <div key={l as string} style={{ background: "var(--s2)", borderRadius: 6, padding: "7px 12px", border: "1px solid var(--b1)" }}><div className="h4" style={{ marginBottom: 2 }}>{l}</div><div className="mono" style={{ fontWeight: 700, color: c as string, fontSize: 13 }}>{v}</div></div>)}</div>}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, fontSize: 12 }}>
                  {s.description && <div style={{ gridColumn: "1/-1" }}><div className="h4" style={{ marginBottom: 5 }}>Overview</div><p style={{ lineHeight: 1.6, color: "var(--t2)" }}>{s.description}</p></div>}
                  {s.entryRules && <div><div className="h4" style={{ marginBottom: 5, color: C.g }}>Entry Rules</div><p style={{ lineHeight: 1.7, color: "var(--t2)", whiteSpace: "pre-line" }}>{s.entryRules}</p></div>}
                  {s.invalidation && <div><div className="h4" style={{ marginBottom: 5, color: C.r }}>Invalidation</div><p style={{ lineHeight: 1.6, color: "var(--t2)" }}>{s.invalidation}</p></div>}
                </div>
              </Fragment>
            )}
          </div>
        );
      })}
      {setups.length === 0 && <EmptyState icon="◆" title="No setups yet" sub="Add your A+ setups here." />}
      {modal && f && (
        <ModalPortal>
          <div style={ovStyle()} onClick={() => setModal(false)}>
            <div style={modalStyle()} onClick={x => x.stopPropagation()}>
              <div className="h2" style={{ marginBottom: 18 }}>Playbook Setup</div>
              <div style={gridStyle(2, 10)}>
                <Field label="Name"><input style={inpStyle()} value={f.name} onChange={x => setF((p: any) => ({ ...p, name: x.target.value }))} /></Field>
                <Field label="Grade"><select style={selStyle()} value={f.grade} onChange={x => setF((p: any) => ({ ...p, grade: x.target.value }))}> {["A+", "A", "B", "C"].map(gr => <option key={gr}>{gr}</option>)}</select></Field>
              </div>
              <div style={gridStyle(3, 10)}>
                <Field label="Symbol"><select style={selStyle()} value={f.symbol} onChange={x => setF((p: any) => ({ ...p, symbol: x.target.value }))}>{SYMBOLS.map(s => <option key={s}>{s}</option>)}</select></Field>
                <Field label="Session"><select style={selStyle()} value={f.session} onChange={x => setF((p: any) => ({ ...p, session: x.target.value }))}>{SESSIONS.map(s => <option key={s}>{s}</option>)}</select></Field>
                <Field label="Timeframe"><select style={selStyle()} value={f.timeframe} onChange={x => setF((p: any) => ({ ...p, timeframe: x.target.value }))}>{ENTRY_WINDOWS.map(s => <option key={s}>{s}</option>)}</select></Field>
              </div>
              <Field label="Description"><textarea style={taStyle()} value={f.description} onChange={x => setF((p: any) => ({ ...p, description: x.target.value }))} /></Field>
              <Field label="Entry Rules"><textarea style={{ ...taStyle(), minHeight: 90 }} value={f.entryRules} onChange={x => setF((p: any) => ({ ...p, entryRules: x.target.value }))} /></Field>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button style={btnStyle(false)} onClick={() => setModal(false)}>Cancel</button>
                <button style={btnStyle(true)} onClick={save}>Save</button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
