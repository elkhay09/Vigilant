/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { WeeklyOutlook } from '../types';
import {
  cardStyle, badgeStyle, btnStyle, btnSmStyle, gridStyle,
  C, Field, ModalPortal, modalStyle, ovStyle, taStyle, inpStyle, selStyle,
  EmptyState, TradeImgRow, MdView
} from './Common';
import { uid, today, saveDraft, loadDraft, clearDraft } from '../lib/utils';
import { MdEditor, MultiUrlInput, ImageUploader, WeeklyOutlookModal } from './Modals';
import { BIAS_OPTS } from '../constants';

export function Outlook({ outlooks, setOutlooks }: { outlooks: WeeklyOutlook[]; setOutlooks: React.Dispatch<React.SetStateAction<WeeklyOutlook[]>> }) {
  const [modal, setModal] = useState(false); const [f, setF] = useState<any>(null);
  const [expanded, setExpanded] = useState(() => new Set<string>());
  const toggle = (id: string) => setExpanded(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const biasC: Record<string, string> = { Bullish: C.g, Bearish: C.r, Neutral: C.a, Range: "var(--am)" };
  const sorted = [...outlooks].sort((a, b) => b.date.localeCompare(a.date));

  const save = (en: any) => {
    const next = { ...en, id: en.id || uid(), updatedAt: new Date().toISOString(), type: "Weekly" };
    setOutlooks(p => { const i = p.findIndex(x => x.id === next.id); if (i >= 0) { const n = [...p]; n[i] = next; return n; } return [...p, next]; });
    setModal(false);
  };
  const newOutlook = () => { const draft = loadDraft("outlook"); setF(draft || { id: null, type: "Weekly", date: today(), title: "", newsCalendar: "", macroDrivers: "", keyLevels: "", narrative: "", lastWeekBottomLine: "", watchThisWeek: "", notes: "", bias: "Neutral", urls: [], images: [] }); setModal(true); };
  useEffect(() => { if (modal && f && !f.id) saveDraft("outlook", f); }, [f, modal]);

  const Section = (o: any, key: string, label: string, color?: string, monoFont?: boolean) => o[key] && (
    <div style={{ gridColumn: "1/-1" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: color || "var(--t1)", marginBottom: 6, letterSpacing: "-.1px" }}>{label}</div>
      {monoFont ? <p style={{ lineHeight: 1.6, color: "var(--t2)", whiteSpace: "pre-line", fontFamily: "var(--font-mono)", fontSize: 11 }}>{o[key]}</p> : <MdView text={o[key]} style={{ color: "var(--t2)", fontSize: 12 }} />}
    </div>
  );

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div><div className="h1">Weekly Outlook</div><div style={{ fontSize: 12, color: "var(--t2)", marginTop: 2 }}>Plan your week ahead</div></div>
        <button style={btnStyle(true)} onClick={newOutlook}>+ New Weekly Outlook</button>
      </div>
      {sorted.map(o => {
        const isOpen = expanded.has(o.id);
        return (
          <div key={o.id} style={{ ...cardStyle(), marginBottom: 10, padding: isOpen ? 20 : "14px 20px", borderLeft: `3px solid ${C.g}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", marginBottom: isOpen ? 14 : 0 }} onClick={() => toggle(o.id)}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, color: "var(--t3)", marginRight: 4 }}>{isOpen ? "▼" : "▶"}</span>
                <span style={badgeStyle(C.g, `${C.g}18`)}>Weekly</span>
                <span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>{`Week of ${o.date}`}</span>
                {o.title && <span style={{ fontSize: 12, color: "var(--t2)" }}>{`— ${o.title}`}</span>}
                {o.bias && <span style={badgeStyle(biasC[o.bias] || "var(--t2)", `${biasC[o.bias] || "var(--t2)"}15`)}>{o.bias}</span>}
              </div>
              <div style={{ display: "flex", gap: 4 }} onClick={ev => ev.stopPropagation()}>
                <button style={btnSmStyle()} onClick={() => { setF({ ...o }); setModal(true); }}>✏</button>
                <button style={btnSmStyle(C.r)} onClick={() => { if (window.confirm("Delete outlook?")) setOutlooks(p => p.filter(x => x.id !== o.id)); }}>×</button>
              </div>
            </div>
            {isOpen && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14, fontSize: 12 }}>
                {Section(o, "lastWeekBottomLine", "Last Week's Market Recap", "var(--am)")}
                {Section(o, "newsCalendar", "Red Folder News", C.r)}
                {Section(o, "macroDrivers", "Key Macro Drivers", C.a)}
                {Section(o, "keyLevels", "Key Levels", C.g, true)}
                {Section(o, "narrative", "Narrative", C.a)}
                {Section(o, "watchThisWeek", "What to Watch this Week", C.g)}
                {Section(o, "notes", "Notes")}
              </div>
            )}
          </div>
        );
      })}
      {sorted.length === 0 && <EmptyState icon="◈" title="No weekly outlooks yet" sub="Add your weekly market plan before the open." />}
      {modal && f && <WeeklyOutlookModal outlook={f} onSave={save} onClose={() => setModal(false)} biasOpts={BIAS_OPTS} />}
    </div>
  );
}
