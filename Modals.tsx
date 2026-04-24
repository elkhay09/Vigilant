/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect, Fragment } from 'react';
import { Attachment, PlaybookSetup, Trade, TradeReview, UrlReference } from '../types';
import {
  C, Field, ModalPortal, ImageLightbox, ImageLightbox as LB,
  inpStyle, selStyle, taStyle, btnStyle, btnSmStyle,
  ovStyle, modalStyle, gridStyle, badgeStyle, lblStyle
} from './Common';
import {
  uid, today, fmt, tradeDur, fmtDur, tMins, saveDraft, loadDraft, clearDraft
} from '../lib/utils';
import { RULES, SYMBOLS, ACCOUNTS, PNL_RATES, SESSIONS, ENTRY_WINDOWS, MENTAL_STATES, MISTAKE_CATS } from '../constants';

export function MdEditor({ value, onChange, placeholder, minHeight = 80, borderColor, label }: { value?: string; onChange: (v: string) => void; placeholder?: string; minHeight?: number; borderColor?: string; label?: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [focusMode, setFocusMode] = useState(false);
  const wrap = (before: string, after: string = "", targetRef?: React.RefObject<HTMLTextAreaElement>) => {
    const ta = (targetRef || ref).current; if (!ta) return;
    const s = ta.selectionStart, en = ta.selectionEnd;
    const sel = (value || "").slice(s, en) || "text";
    const next = (value || "").slice(0, s) + before + sel + after + (value || "").slice(en);
    onChange(next);
    setTimeout(() => { ta.focus(); ta.selectionStart = s + before.length; ta.selectionEnd = s + before.length + sel.length; }, 10);
  };
  const linePrefix = (p: string, targetRef?: React.RefObject<HTMLTextAreaElement>) => {
    const ta = (targetRef || ref).current; if (!ta) return;
    const s = ta.selectionStart; const v = value || "";
    const lineStart = v.lastIndexOf("\n", s - 1) + 1;
    const next = v.slice(0, lineStart) + p + v.slice(lineStart);
    onChange(next);
    setTimeout(() => { ta.focus(); ta.selectionStart = ta.selectionEnd = s + p.length; }, 10);
  };
  const TBtn = ({ label: l, title, onClick, bold }: any) => <button type="button" title={title} onClick={onClick} style={{ padding: "3px 9px", background: "var(--s3)", border: "1px solid var(--b1)", borderRadius: 4, color: "var(--t2)", fontSize: 11, fontWeight: bold ? 700 : 500, cursor: "pointer" }}>{l}</button>;
  const Toolbar = ({ targetRef }: any) => (
    <div style={{ display: "flex", gap: 4, marginBottom: 4, flexWrap: "wrap" }}>
      <TBtn label="B" bold title="Bold (**text**)" onClick={() => wrap("**", "**", targetRef)} />
      <TBtn label="I" bold title="Italic (*text*)" onClick={() => wrap("*", "*", targetRef)} />
      <TBtn label="H1" title="Heading 1" onClick={() => linePrefix("# ", targetRef)} />
      <TBtn label="H2" title="Heading 2" onClick={() => linePrefix("## ", targetRef)} />
      <TBtn label="• List" title="Bullet list" onClick={() => linePrefix("- ", targetRef)} />
      {!targetRef && <button type="button" title="Expand to focus mode" onClick={() => setFocusMode(true)} style={{ padding: "3px 9px", background: "var(--aBg)", border: `1px solid ${C.aB}`, borderRadius: 4, color: C.a, fontSize: 11, fontWeight: 600, cursor: "pointer", marginLeft: "auto" }}>⤢ Expand</button>}
    </div>
  );
  return (
    <div>
      <Toolbar />
      <textarea ref={ref} style={{ ...taStyle(), minHeight, ...(borderColor ? { borderColor } : {}) }} value={value || ""} onChange={x => onChange(x.target.value)} placeholder={placeholder} />
      {focusMode && <FocusEditor label={label} value={value} onChange={onChange} placeholder={placeholder} borderColor={borderColor} onClose={() => setFocusMode(false)} Toolbar={Toolbar} />}
    </div>
  );
}

function FocusEditor({ label, value, onChange, placeholder, borderColor, onClose, Toolbar }: any) {
  const fRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { const h = (ev: KeyboardEvent) => { if (ev.key === "Escape") onClose(); }; window.addEventListener("keydown", h); setTimeout(() => fRef.current?.focus(), 50); return () => window.removeEventListener("keydown", h); }, [onClose]);
  return (
    <ModalPortal>
      <div style={{ ...ovStyle(), padding: "2vh 2vw" }} onClick={onClose}>
        <div style={{ background: "var(--s1)", borderRadius: 14, border: "1px solid var(--b2)", padding: 24, width: "min(960px,96vw)", maxHeight: "96vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,.5)" }} onClick={x => x.stopPropagation()}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexShrink: 0 }}>
            <div>
              <div className="h2">{label || "Focus Mode"}</div>
              <div style={{ fontSize: 11, color: "var(--g)", marginTop: 2 }}>✓ Auto-saves as you type · Press Esc to close</div>
            </div>
            <button onClick={onClose} style={{ ...btnStyle(true), padding: "8px 18px" }}>Done</button>
          </div>
          <div style={{ flexShrink: 0, marginBottom: 8 }}><Toolbar targetRef={fRef} /></div>
          <textarea ref={fRef} value={value || ""} onChange={x => onChange(x.target.value)} placeholder={placeholder} style={{ ...taStyle(), flex: 1, minHeight: "60vh", fontSize: 14, lineHeight: 1.7, padding: "18px 22px", ...(borderColor ? { borderColor } : {}) }} />
        </div>
      </div>
    </ModalPortal>
  );
}

export function ImageUploader({ images = [], onChange, label = "Screenshots" }: { images: Attachment[]; onChange: (imgs: Attachment[]) => void; label?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [lb, setLb] = useState<Attachment | null>(null);
  const [uploadType, setUploadType] = useState("Chart");
  const handle = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(ev.target.files || []) as File[];
    const validFiles = files.filter(f => { if (f.size > 2000000) { console.warn('Image too large (max 2MB):', f.name); return false; } return true; });
    if (!validFiles.length) { ev.target.value = ''; return; }
    Promise.all(validFiles.map(f => new Promise<Attachment>(res => { const r = new FileReader(); r.onload = x => res({ id: uid(), name: f.name, data: x.target?.result as string, type: uploadType }); r.readAsDataURL(f); }))).then(imgs => onChange([...images, ...imgs]));
    ev.target.value = "";
  };
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, gap: 8, flexWrap: "wrap" }}>
        <label style={{ fontSize: 10, fontWeight: 600, color: "var(--t3)", textTransform: "uppercase", letterSpacing: ".7px" }}>{label}</label>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 10, color: "var(--t3)" }}>Attachment Type</span>
          <select value={uploadType} onChange={x => setUploadType(x.target.value)} style={{ ...selStyle(), padding: "4px 8px", fontSize: 11, minWidth: 110 }}>{["Chart", "Review", "Performance", "Other"].map(opt => <option key={opt} value={opt}>{opt}</option>)}</select>
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 4 }}>
        {images.map(img => (
          <div key={img.id} style={{ position: "relative", borderRadius: 6, overflow: "hidden", border: "1px solid var(--b1)", flexShrink: 0 }}>
            <img src={img.data} alt={img.name} title="Click to enlarge" onClick={() => setLb(img)} style={{ width: 100, height: 70, objectFit: "cover", display: "block", cursor: "zoom-in" }} />
            <div style={{ position: "absolute", left: 3, bottom: 3, fontSize: 9, padding: "1px 4px", borderRadius: 3, background: "rgba(0,0,0,.65)", color: "#d9e8ef" }}>{img.type || "Chart"}</div>
            <button onClick={ev => { ev.stopPropagation(); onChange(images.filter(i => i.id !== img.id)); }} style={{ position: "absolute", top: 3, right: 3, background: "rgba(0,0,0,.8)", border: "none", borderRadius: 3, color: "#ccc", fontSize: 10, cursor: "pointer", padding: "2px 5px" }}>×</button>
          </div>
        ))}
        <div onClick={() => ref.current?.click()} style={{ width: 100, height: 70, borderRadius: 6, border: `1px dashed var(--b2)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "var(--s2)", color: "var(--t3)", fontSize: 11, gap: 3, flexShrink: 0 }}>
          <span style={{ fontSize: 20, lineHeight: 1 }}>+</span>
          <span>Upload</span>
        </div>
      </div>
      {images.length > 0 && <div style={{ fontSize: 10, color: "var(--t3)" }}>{images.length} attachment{images.length !== 1 ? "s" : ""} • click to enlarge</div>}
      <input ref={ref} type="file" accept="image/*" multiple onChange={handle} style={{ display: "none" }} />
      {lb && <LB img={lb} onClose={() => setLb(null)} />}
    </div>
  );
}

export function MultiUrlInput({ urls = [], onChange, label = "Reference URLs" }: { urls: UrlReference[]; onChange: (urls: UrlReference[]) => void; label?: string }) {
  const add = () => onChange([...urls, { id: uid(), val: "", label: "" }]);
  const upd = (id: string, k: string, v: string) => onChange(urls.map(u => u.id === id ? { ...u, [k]: v } : u));
  const rem = (id: string) => onChange(urls.filter(u => u.id !== id));
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <label style={{ fontSize: 10, fontWeight: 600, color: "var(--t3)", textTransform: "uppercase", letterSpacing: ".7px" }}>{label}</label>
        <button style={{ ...btnSmStyle(C.a), fontSize: 10, padding: "2px 8px" }} onClick={add}>+ Add</button>
      </div>
      {urls.length === 0 && <div onClick={add} style={{ border: `1px dashed var(--b1)`, borderRadius: 6, padding: "8px 14px", fontSize: 12, color: "var(--t3)", cursor: "pointer", textAlign: "center" }}>Click to add a reference link</div>}
      {urls.map((u, i) => (
        <div key={u.id} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
          <input style={{ ...inpStyle(), width: 90, flex: "0 0 90px", fontSize: 11 }} value={u.label} onChange={ev => upd(u.id, "label", ev.target.value)} placeholder="Label" />
          <input style={{ ...inpStyle(), flex: 1, fontFamily: "var(--font-mono)", fontSize: 11 }} value={u.val} onChange={ev => upd(u.id, "val", ev.target.value)} placeholder="https://..." />
          {u.val && <a href={u.val} target="_blank" rel="noreferrer noopener" referrerPolicy="no-referrer" style={{ color: C.a, fontSize: 13, textDecoration: "none" }}>↗</a>}
          <button onClick={() => rem(u.id)} style={{ ...btnSmStyle(C.r), padding: "4px 7px" }}>×</button>
        </div>
      ))}
    </div>
  );
}

export function PromptModal({ title, label, placeholder, initialValue = "", onSubmit, onClose, multiline }: { title: string; label?: string; placeholder?: string; initialValue?: string; onSubmit: (v: string) => void; onClose: () => void; multiline?: boolean }) {
  const [v, setV] = useState(initialValue);
  useEffect(() => {
    const h = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") onClose();
      if (ev.key === "Enter" && !multiline && !ev.shiftKey) { ev.preventDefault(); if (v.trim()) { onSubmit(v.trim()); onClose(); } }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [v, multiline, onSubmit, onClose]);
  return (
    <ModalPortal>
      <div style={ovStyle()} onClick={onClose}>
        <div style={{ ...modalStyle(), width: "min(520px,92vw)" }} onClick={x => x.stopPropagation()}>
          <div className="h2" style={{ marginBottom: 6 }}>{title}</div>
          {label && <div style={{ fontSize: 12, color: "var(--t2)", marginBottom: 14, whiteSpace: "pre-line", lineHeight: 1.6 }}>{label}</div>}
          {multiline ? <textarea autoFocus style={{ ...taStyle(), minHeight: 90 }} value={v} onChange={x => setV(x.target.value)} placeholder={placeholder} /> : <input autoFocus style={inpStyle()} value={v} onChange={x => setV(x.target.value)} placeholder={placeholder} />}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 14 }}>
            <button style={btnStyle(false)} onClick={onClose}>Cancel</button>
            <button style={btnStyle(true)} onClick={() => { if (v.trim()) { onSubmit(v.trim()); onClose(); } }}>Save</button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

export function TradeModal({ trade, reviews = [], onSave, onClose, setups = [] }: { trade?: Trade | null; reviews?: TradeReview[]; onSave: (t: Trade, review?: TradeReview | null) => void; onClose: () => void; setups?: PlaybookSetup[] }) {
  useEffect(() => { const h = (ev: KeyboardEvent) => { if ((ev.ctrlKey || ev.metaKey) && ev.key === "Enter") { ev.preventDefault(); (document.querySelector("[data-save-trade]") as HTMLButtonElement)?.click(); } }; window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, []);
  const playbookStrats = setups.map(s => s.name).filter(Boolean);
  const strats = playbookStrats.length > 0 ? playbookStrats : ["Order Block", "Fair Value Gap", "Break and Retest", "15m ORB", "5m ORB", "VWAP Reclaim", "Initial Balance", "Volume Profile", "Other"];
  const defaultStrat = playbookStrats[0] || "Order Block";
  const initResource = trade || loadDraft("trade");
  const init = initResource || { date: today(), timeEntry: "", timeClose: "", symbol: "ES", session: "New York", direction: "Long", entry: "", sl: "", tp: "", exit: "", pnl: "", rr: "", lots: 1, strategy: defaultStrat, entryWindow: "15m", account: "Funded", followedRules: [], mentalPre: "Calm", mentalDuring: "Focused", mentalPost: "Calm", notes: "", tags: [], images: [], urls: [], mfe: "", mae: "" };
  const [f, setF] = useState<any>(init);
  const [tagIn, setTagIn] = useState("");
  const [activeTab, setActiveTab] = useState("details"); // details or review

  // Find existing review if editing
  const existingReview = trade ? reviews.find(r => r.tradeId === trade.id) : null;
  const [revF, setRevF] = useState<any>(existingReview || { grade: "", execution: "", emotion: "", missed: "", lesson: "", mistakes: [] });

  useEffect(() => { if (!trade && f) saveDraft("trade", f); }, [f, trade]);
  
  const sf = (k: string, v: any) => setF((prev: any) => {
    const n = { ...prev, [k]: v };
    const en = parseFloat(k === "entry" ? v : n.entry) || 0, sl2 = parseFloat(k === "sl" ? v : n.sl) || 0, ex = parseFloat(k === "exit" ? v : n.exit) || 0, tp2 = parseFloat(k === "tp" ? v : n.tp) || 0;
    if (["entry", "sl"].includes(k) && en && sl2) n.direction = sl2 < en ? "Long" : "Short";
    const risk = Math.abs(en - sl2);
    if (en && sl2 && ex && risk > 0) { const rw = n.direction === "Long" ? ex - en : en - ex; n.rr = parseFloat((rw / risk).toFixed(2)); }
    if (en && sl2 && tp2 && !ex && risk > 0) { const pr = n.direction === "Long" ? (tp2 - en) / risk : (en - tp2) / risk; n.rr = parseFloat(pr.toFixed(2)); }
    const sym = k === "symbol" ? v : n.symbol, lots2 = parseFloat(k === "lots" ? v : n.lots) || 0, rate = PNL_RATES[sym] || 1;
    if (en && ex && lots2 > 0) { const pts = n.direction === "Long" ? ex - en : en - ex; n.pnl = parseFloat((pts * rate * lots2).toFixed(2)); }
    if (k === "mentalPre") { const neg = ["Revenge", "FOMO", "Anxious", "Fearful", "Overconfident"]; if (neg.includes(v) && !n.tags.includes(v)) n.tags = [...n.tags, v]; }
    return n;
  });
  const toggleRule = (r: string) => setF((p: any) => ({ ...p, followedRules: p.followedRules.includes(r) ? p.followedRules.filter((x: string) => x !== r) : [...p.followedRules, r] }));
  const toggleMistake = (m: string) => setRevF((p: any) => ({ ...p, mistakes: p.mistakes.includes(m) ? p.mistakes.filter((x: string) => x !== m) : [...p.mistakes, m] }));
  const addTag = () => { if (tagIn.trim() && !f.tags.includes(tagIn.trim())) { setF((p: any) => ({ ...p, tags: [...p.tags, tagIn.trim()] })); setTagIn(""); } };
  
  const save = () => {
    if (!f.date) { window.confirm("Please enter a date for this trade."); return; }
    if (!f.entry && !f.pnl) { window.confirm("Please enter at least an entry price or P&L."); return; }
    const t = { ...f, id: f.id || uid(), pnl: parseFloat(f.pnl) || 0, rr: parseFloat(f.rr) || 0, entry: parseFloat(f.entry) || 0, sl: parseFloat(f.sl) || 0, tp: parseFloat(f.tp) || 0, exit: parseFloat(f.exit) || 0, lots: parseFloat(f.lots) || 1, mfe: parseFloat(f.mfe) || 0, mae: parseFloat(f.mae) || 0 };
    const disc = t.followedRules.length / RULES.length;
    const ct = t.tags.filter((x: string) => x !== "Disciplined" && x !== "Undisciplined");
    if (disc >= 0.8) ct.push("Disciplined"); else if (disc < 0.4) ct.push("Undisciplined");
    t.tags = [...new Set(ct) as any]; 

    // Capture review if it was filled out
    const hasData = (revF.grade || revF.execution || revF.emotion || revF.missed || revF.lesson || revF.mistakes.length > 0);
    const review = hasData ? { ...revF, id: revF.id || uid(), tradeId: t.id, date: t.date } : null;

    if (!trade) clearDraft("trade"); 
    onSave(t, review);
  };

  const copySummary = () => {
    const summary = `
📊 TRADE REVIEW: ${f.symbol} (${f.direction}) - ${f.date}
💰 P&L: ${fmt(pv)} (${rv.toFixed(2)}R)
🗺️ Strategy: ${f.strategy}
📝 Grade: ${revF.grade || 'N/A'}
✅ Execution: ${revF.execution || 'No notes'}
🧠 Emotional State: ${revF.emotion || 'No notes'}
❌ Mistakes: ${revF.mistakes.length > 0 ? revF.mistakes.join(', ') : 'None'}
💡 Key Lesson: ${revF.lesson || 'No notes'}
    `.trim();
    navigator.clipboard.writeText(summary);
    alert("Review summary copied to clipboard!");
  };

  const pv = parseFloat(f.pnl) || 0, rv = parseFloat(f.rr) || 0;
  const dur = f.timeEntry && f.timeClose ? Math.abs(tMins(f.timeClose) - tMins(f.timeEntry)) : 0;

  const grading = [
    { g: "A", l: "Perfect", c: C.g },
    { g: "B", l: "Good", c: C.g },
    { g: "C", l: "Average", c: C.a },
    { g: "D", l: "Poor", c: C.r },
    { g: "F", l: "Violation", c: C.r }
  ];
  
  return (
    <ModalPortal>
      <div style={ovStyle()} onClick={onClose}>
        <div style={{ ...modalStyle(), width: "min(840px,94vw)" }} onClick={x => x.stopPropagation()}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, alignItems: "center" }}>
            <div>
              <div className="h2">{trade ? "Edit Trade" : "New Trade"}</div>
              <div style={{ fontSize: 11, color: trade ? "var(--t3)" : "var(--g)", marginTop: 2 }}>{trade ? "P&L and R:R auto-calculate from prices" : "✓ Auto-saving as you type — your draft is safe even if you close this window"}</div>
            </div>
            <button style={{ background: "none", border: "none", color: "var(--t3)", fontSize: 20, cursor: "pointer" }} onClick={onClose}>×</button>
          </div>

          <div style={{ display: "flex", gap: 2, background: "var(--s3)", padding: 4, borderRadius: 10, marginBottom: 20 }}>
            <button onClick={() => setActiveTab("details")} style={{ flex: 1, padding: "8px", border: "none", borderRadius: 8, background: activeTab === "details" ? "var(--s1)" : "none", color: activeTab === "details" ? "var(--t1)" : "var(--t3)", fontSize: 13, fontWeight: activeTab === "details" ? 700 : 500, cursor: "pointer", boxShadow: activeTab === "details" ? "0 2px 8px rgba(0,0,0,.15)" : "none" }}>1. Trade Details</button>
            <button onClick={() => setActiveTab("review")} style={{ flex: 1, padding: "8px", border: "none", borderRadius: 8, background: activeTab === "review" ? "var(--s1)" : "none", color: activeTab === "review" ? "var(--t1)" : "var(--t3)", fontSize: 13, fontWeight: activeTab === "review" ? 700 : 500, cursor: "pointer", boxShadow: activeTab === "review" ? "0 2px 8px rgba(0,0,0,.15)" : "none" }}>2. Trade Review</button>
          </div>

          <div style={{ maxHeight: "calc(90vh - 180px)", overflowY: "auto", paddingRight: 4 }}>
            {activeTab === "details" ? (
              <Fragment>
                <div style={gridStyle(4, 10)}>
                  <Field label="Date"><input type="date" style={inpStyle()} value={f.date} onChange={x => sf("date", x.target.value)} /></Field>
                  <Field label="Symbol"><select style={selStyle()} value={f.symbol} onChange={x => sf("symbol", x.target.value)}>{SYMBOLS.map(s => <option key={s}>{s}</option>)}</select></Field>
                  <Field label="Direction"><select style={selStyle()} value={f.direction} onChange={x => sf("direction", x.target.value)}>{["Long", "Short"].map(s => <option key={s}>{s}</option>)}</select></Field>
                  <Field label="Account"><select style={selStyle()} value={f.account} onChange={x => sf("account", x.target.value)}>{ACCOUNTS.map(s => <option key={s}>{s}</option>)}</select></Field>
                </div>
                <div style={gridStyle(3, 10)}>
                  <Field label="Entry Time"><input type="time" style={inpStyle()} value={f.timeEntry || ""} onChange={x => sf("timeEntry", x.target.value)} /></Field>
                  <Field label="Close Time"><input type="time" style={inpStyle()} value={f.timeClose || ""} onChange={x => sf("timeClose", x.target.value)} /></Field>
                  <Field label="Duration (auto)"><div style={{ ...inpStyle(), display: "flex", alignItems: "center", color: dur > 0 ? "var(--am)" : "var(--t3)", fontFamily: "var(--font-mono)", fontWeight: dur > 0 ? 600 : 400 }}>{dur > 0 ? fmtDur(dur) : "Set times above"}</div></Field>
                </div>
                <div style={gridStyle(4, 10)}>
                  <Field label="Entry Price"><input type="number" style={inpStyle()} value={f.entry} onChange={x => sf("entry", x.target.value)} /></Field>
                  <Field label="Stop Loss"><input type="number" style={inpStyle()} value={f.sl} onChange={x => sf("sl", x.target.value)} /></Field>
                  <Field label="Take Profit"><input type="number" style={inpStyle()} value={f.tp} onChange={x => sf("tp", x.target.value)} /></Field>
                  <Field label="Exit Price"><input type="number" style={inpStyle()} value={f.exit} onChange={x => sf("exit", x.target.value)} /></Field>
                </div>
                <div style={gridStyle(3, 10)}>
                  <Field label="P&L (auto)"><div style={{ ...inpStyle(), fontFamily: "var(--font-mono)", fontWeight: 700, color: pv >= 0 ? C.g : C.r, display: "flex", alignItems: "center" }}>{pv ? fmt(pv) : "—"}</div></Field>
                  <Field label="R:R (auto)"><div style={{ ...inpStyle(), fontFamily: "var(--font-mono)", color: rv >= 0 ? C.g : C.r, display: "flex", alignItems: "center" }}>{rv ? `${rv.toFixed(2)}R` : "—"}</div></Field>
                  <Field label="Micro Lots"><input type="number" style={inpStyle()} value={f.lots} onChange={x => sf("lots", x.target.value)} min="1" /></Field>
                </div>
                <div style={gridStyle(2, 10)}>
                  <Field label="MFE — Max Favorable ($, optional)"><input type="number" style={{ ...inpStyle(), borderColor: `${C.g}33` }} value={f.mfe || ""} onChange={x => sf("mfe", x.target.value)} placeholder="How much was the trade in profit at peak?" /></Field>
                  <Field label="MAE — Max Adverse ($, optional)"><input type="number" style={{ ...inpStyle(), borderColor: `${C.r}33` }} value={f.mae || ""} onChange={x => sf("mae", x.target.value)} placeholder="How much was the trade in loss at worst?" /></Field>
                </div>
                {(parseFloat(f.entry) || parseFloat(f.sl)) > 0 && (
                  <div style={{ background: "var(--s2)", borderRadius: 6, padding: "7px 12px", marginBottom: 12, display: "flex", gap: 14, fontSize: 11, color: "var(--t2)", flexWrap: "wrap", border: "1px solid var(--b1)" }}>
                    <span style={{ color: "var(--t3)", fontWeight: 600, fontSize: 10, fontFamily: "var(--font-mono)" }}>AUTO</span>
                    {f.direction && <span>Dir: <b style={{ color: f.direction === "Long" ? C.g : C.r }}>{f.direction}</b></span>}
                    {rv ? <span>R:R: <b style={{ color: rv >= 0 ? C.g : C.r }}>{rv.toFixed(2)}</b></span> : null}
                    <span>Rate: <b style={{ color: C.a }}>{`$${PNL_RATES[f.symbol] || 1}/pt × ${f.lots || 1}`}</b></span>
                    {pv ? <span>P&L: <b style={{ color: pv >= 0 ? C.g : C.r }}>{fmt(pv)}</b></span> : null}
                    {dur > 0 ? <span>Dur: <b style={{ color: C.am }}>{fmtDur(dur)}</b></span> : null}
                  </div>
                )}
                <div style={gridStyle(3, 10)}>
                  <Field label="Session"><select style={selStyle()} value={f.session} onChange={x => sf("session", x.target.value)}>{SESSIONS.map(s => <option key={s}>{s}</option>)}</select></Field>
                  <Field label="Strategy">
                    <div>
                      <select style={selStyle()} value={f.strategy} onChange={x => sf("strategy", x.target.value)}>
                        {playbookStrats.length === 0 && <optgroup label="⚠ No playbook setups — showing defaults" />}
                        {strats.map(s => {
                          const setup = setups.find(p => p.name === s);
                          return <option key={s} value={s}>{setup ? `${s} (${setup.grade})` : s}</option>;
                        })}
                      </select>
                      {playbookStrats.length === 0 && <div style={{ fontSize: 10, color: C.am, marginTop: 4 }}>⚠ Add setups in Playbook to restrict this list to your strategies only.</div>}
                    </div>
                  </Field>
                  <Field label="Timeframe"><select style={selStyle()} value={f.entryWindow} onChange={x => sf("entryWindow", x.target.value)}>{ENTRY_WINDOWS.map(s => <option key={s}>{s}</option>)}</select></Field>
                </div>
                <div style={{ background: "var(--s2)", borderRadius: 8, border: "1px solid var(--b1)", padding: 14, marginBottom: 12 }}>
                  <div className="h4" style={{ marginBottom: 10 }}>Mental State</div>
                  <div style={gridStyle(3, 10)}>
                    <Field label="Pre"><select style={selStyle()} value={f.mentalPre} onChange={x => sf("mentalPre", x.target.value)}>{MENTAL_STATES.map(s => <option key={s}>{s}</option>)}</select></Field>
                    <Field label="During"><select style={selStyle()} value={f.mentalDuring} onChange={x => sf("mentalDuring", x.target.value)}>{MENTAL_STATES.map(s => <option key={s}>{s}</option>)}</select></Field>
                    <Field label="Post"><select style={selStyle()} value={f.mentalPost} onChange={x => sf("mentalPost", x.target.value)}>{MENTAL_STATES.map(s => <option key={s}>{s}</option>)}</select></Field>
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div className="h4" style={{ marginBottom: 10 }}>Rules Checklist</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
                    {RULES.map(r => (
                      <label key={r} style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", fontSize: 12, color: f.followedRules.includes(r) ? C.g : "var(--t2)", lineHeight: 1.4 }}>
                        <input type="checkbox" style={{ accentColor: C.g, flexShrink: 0 }} checked={f.followedRules.includes(r)} onChange={() => toggleRule(r)} />{r}
                      </label>
                    ))}
                  </div>
                </div>
                <Field label="Notes"><textarea style={taStyle()} value={f.notes} onChange={x => sf("notes", x.target.value)} placeholder="Quick observations about this trade..." /></Field>
                <div style={{ marginBottom: 12 }}>
                  <label style={lblStyle()}>Tags</label>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 7 }}>{f.tags.map((t: string) => <span key={t} style={{ ...badgeStyle(C.a, C.aBg), cursor: "pointer" }} onClick={() => setF((p: any) => ({ ...p, tags: p.tags.filter((x: string) => x !== t) }))}>{t} ×</span>)}</div>
                  <div style={{ display: "flex", gap: 7 }}><input style={{ ...inpStyle(), flex: 1 }} value={tagIn} onChange={x => setTagIn(x.target.value)} onKeyDown={x => x.key === "Enter" && addTag()} placeholder="Add tag..." /><button style={btnStyle(false)} onClick={addTag}>Add</button></div>
                </div>
                <MultiUrlInput urls={f.urls || []} onChange={u => setF((p: any) => ({ ...p, urls: u }))} />
                <ImageUploader images={f.images || []} onChange={imgs => setF((p: any) => ({ ...p, images: imgs }))} />
              </Fragment>
            ) : (
              <div className="fade-in">
                <div style={{ marginBottom: 20 }}>
                  <div className="h3" style={{ marginBottom: 4 }}>Trade Review</div>
                  <div style={{ fontSize: 11, color: "var(--t3)", marginBottom: 16 }}>Analyzing execution quality & psychology</div>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 24 }}>
                    {grading.map(item => (
                      <button 
                        key={item.g} 
                        onClick={() => setRevF((p: any) => ({ ...p, grade: item.g }))} 
                        style={{ 
                          ...btnStyle(), 
                          background: revF.grade === item.g ? `${item.c}22` : "var(--s2)",
                          color: revF.grade === item.g ? item.c : "var(--t1)",
                          borderColor: revF.grade === item.g ? item.c : "var(--b1)",
                          height: 54,
                          flexDirection: 'column',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 2,
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ fontSize: 18, fontWeight: 800 }}>{item.g}</div>
                        <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', opacity: 0.8 }}>{item.l}</div>
                      </button>
                    ))}
                  </div>

                  <div style={{ display: "grid", gap: 14 }}>
                    <Field label="Execution — Did you follow the plan?">
                      <textarea style={{ ...taStyle(), minHeight: 100 }} value={revF.execution} onChange={x => setRevF((p: any) => ({ ...p, execution: x.target.value }))} placeholder="Explain your entry, management and exit logic..." />
                    </Field>
                    <Field label="Emotional State — How did you feel during the trade?">
                      <textarea style={{ ...taStyle(), minHeight: 80 }} value={revF.emotion} onChange={x => setRevF((p: any) => ({ ...p, emotion: x.target.value }))} placeholder="Wait, excitement, anxiety, calm, greed?" />
                    </Field>
                    <Field label="What I missed or would change">
                      <textarea style={{ ...taStyle(), minHeight: 80 }} value={revF.missed} onChange={x => setRevF((p: any) => ({ ...p, missed: x.target.value }))} placeholder="Hindsight observations..." />
                    </Field>
                    <Field label="Key Lesson from this trade">
                      <textarea style={{ ...taStyle(), minHeight: 80 }} value={revF.lesson} onChange={x => setRevF((p: any) => ({ ...p, lesson: x.target.value }))} placeholder="The single most important takeaway..." />
                    </Field>
                  </div>

                  <div style={{ marginTop: 24 }}>
                    <label style={lblStyle()}>Mistakes on this trade</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px 16px", background: 'var(--s2)', padding: 16, borderRadius: 8, border: '1px solid var(--b1)' }}>
                      {MISTAKE_CATS.map(m => (
                        <label key={m} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12, color: revF.mistakes.includes(m) ? C.r : "var(--t2)" }}>
                          <input type="checkbox" style={{ accentColor: C.r }} checked={revF.mistakes.includes(m)} onChange={() => toggleMistake(m)} />
                          {m}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "space-between", paddingTop: 14, borderTop: "1px solid var(--b1)", marginTop: 14 }}>
            {!trade ? <button style={{ ...btnStyle(false), ...btnStyle(false, true) }} onClick={() => { if (window.confirm("Discard this trade draft? All entered data will be lost.")) { clearDraft("trade"); onClose(); } }}>Discard Draft</button> : <div />}
            <div style={{ display: "flex", gap: 10 }}>
              {activeTab === "details" ? (
                <button style={{ ...btnStyle(false), color: C.a, borderColor: "var(--a)" }} onClick={() => setActiveTab("review")}>Next: Trade Review →</button>
              ) : (
                <button style={btnStyle(false)} onClick={() => setActiveTab("details")}>← Back to Details</button>
              )}
              <button style={btnStyle(false)} onClick={onClose}>{trade ? "Cancel" : "Close (keep draft)"}</button>
              {(revF.grade || revF.lesson) && (
                <button style={{ ...btnSmStyle(C.a), padding: '8px 12px' }} onClick={copySummary}>
                  📋 Copy Review
                </button>
              )}
              <button style={btnStyle(true)} onClick={save} data-save-trade>Complete & Save Trade</button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

export function PremarketModal({ pm, onSave, onClose, items, biasOpts }: { pm: any; onSave: (pm: any) => void; onClose: () => void, items: string[], biasOpts: string[] }) {
  const [f, setF] = useState(pm);
  const sf = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));
  return (
    <ModalPortal>
      <div style={ovStyle()} onClick={onClose}>
        <div style={{ ...modalStyle(), width: "min(800px,94vw)" }} onClick={x => x.stopPropagation()}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
            <div className="h2">Pre-Session Checklist</div>
            <button style={{ background: "none", border: "none", color: "var(--t3)", fontSize: 20, cursor: "pointer" }} onClick={onClose}>×</button>
          </div>
          <div style={{ maxHeight: "calc(90vh - 120px)", overflowY: "auto", paddingRight: 4 }}>
            <div style={gridStyle(2, 10)}>
              <Field label="Date"><input type="date" style={inpStyle()} value={f.date} onChange={x => sf("date", x.target.value)} /></Field>
              <Field label="Bias"><select style={selStyle()} value={f.bias} onChange={x => sf("bias", x.target.value)}>{biasOpts.map(b => <option key={b}>{b}</option>)}</select></Field>
            </div>
            
            <div style={{ marginBottom: 14 }}>
              <label style={lblStyle()}>Checklist</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, background: 'var(--s2)', padding: 12, borderRadius: 8, border: '1px solid var(--b1)' }}>
                {items.map((item, i) => (
                  <label key={i} style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", fontSize: 12, color: f.checklist[i] ? C.g : "var(--t2)" }}>
                    <input type="checkbox" checked={!!f.checklist[i]} onChange={() => { const c = [...f.checklist]; c[i] = !c[i]; sf("checklist", c); }} />{item}
                  </label>
                ))}
              </div>
            </div>

            <div style={gridStyle(3, 10)}>
              <Field label="High Impact News"><textarea style={{ ...taStyle(), minHeight: 60 }} value={f.newsToday || ""} onChange={x => sf("newsToday", x.target.value)} placeholder="Economic data, speeches..." /></Field>
              <Field label="Key Levels"><textarea style={{ ...taStyle(), minHeight: 60 }} value={f.keyLevels || ""} onChange={x => sf("keyLevels", x.target.value)} placeholder="S/R, Pivots, VWAP..." /></Field>
              <Field label="Things to Avoid"><textarea style={{ ...taStyle(), minHeight: 60 }} value={f.avoidToday || ""} onChange={x => sf("avoidToday", x.target.value)} placeholder="Bad setups, low volume..." /></Field>
            </div>

            <MdEditor label="Strategy & Plan" value={f.notes} onChange={v => sf("notes", v)} minHeight={120} placeholder="Detailed game plan for the day..." />
            
            <div style={{ marginTop: 14 }}>
              <MultiUrlInput urls={f.urls || []} onChange={u => sf("urls", u)} />
              <ImageUploader images={f.images || []} onChange={imgs => sf("images", imgs)} />
            </div>
          </div>
          
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--b2)' }}>
            <button style={btnStyle(false)} onClick={onClose}>Cancel</button>
            <button style={btnStyle(true)} onClick={() => onSave(f)}>Save Session</button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

export function SessionReviewModal({ review, onSave, onClose }: { review: any; onSave: (rev: any) => void; onClose: () => void }) {
  const [f, setF] = useState(review);
  const sf = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));
  return (
    <ModalPortal>
      <div style={ovStyle()} onClick={onClose}>
        <div style={{ ...modalStyle(), width: "min(840px,94vw)" }} onClick={x => x.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div className="h2">Session Review</div>
            <button style={{ background: "none", border: "none", color: "var(--t3)", fontSize: 20, cursor: "pointer" }} onClick={onClose}>×</button>
          </div>
          
          <div style={{ maxHeight: "calc(90vh - 120px)", overflowY: "auto", paddingRight: 4 }}>
            <div style={gridStyle(3, 10)}>
              <Field label="Type"><select style={selStyle()} value={f.type} onChange={x => sf("type", x.target.value)}>{["Daily", "Weekly", "Monthly", "Quarterly"].map(t => <option key={t}>{t}</option>)}</select></Field>
              <Field label="Date"><input type="date" style={inpStyle()} value={f.date} onChange={x => sf("date", x.target.value)} /></Field>
              <Field label="Grade"><select style={selStyle()} value={f.grade || ""} onChange={x => sf("grade", x.target.value)}>{["","A","B","C","D","F"].map(t => <option key={t}>{t}</option>)}</select></Field>
            </div>
            
            <div style={gridStyle(2, 10)}>
              <Field label="Market Conditions"><textarea style={{ ...taStyle(), minHeight: 60 }} value={f.marketConditions || ""} onChange={x => sf("marketConditions", x.target.value)} placeholder="Volatility, trend, news..." /></Field>
              <Field label="Overall Mindset"><select style={selStyle()} value={f.overallMindset || ""} onChange={x => sf("overallMindset", x.target.value)}>{MENTAL_STATES.map(s => <option key={s}>{s}</option>)}</select></Field>
            </div>

            <div style={gridStyle(2, 10)}>
              <Field label="What Went Well"><textarea style={{ ...taStyle(), minHeight: 100 }} value={f.wentWell || ""} onChange={x => sf("wentWell", x.target.value)} /></Field>
              <Field label="Challenges / Struggles"><textarea style={{ ...taStyle(), minHeight: 100 }} value={f.challenges || ""} onChange={x => sf("challenges", x.target.value)} /></Field>
            </div>

            <Field label="Key Lessons"><textarea style={{ ...taStyle(), minHeight: 80 }} value={f.lessons || ""} onChange={x => sf("lessons", x.target.value)} /></Field>
            <Field label="Tomorrow's Plan"><textarea style={{ ...taStyle(), minHeight: 80 }} value={f.tomorrowPlan || ""} onChange={x => sf("tomorrowPlan", x.target.value)} /></Field>
            
            <div style={{ marginTop: 14 }}>
              <MultiUrlInput urls={f.urls || []} onChange={u => sf("urls", u)} />
              <ImageUploader images={f.images || []} onChange={imgs => sf("images", imgs)} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--b2)' }}>
            <button style={btnStyle(false)} onClick={onClose}>Cancel</button>
            <button style={btnStyle(true)} onClick={() => onSave(f)}>Save Review</button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

export function MistakeModal({ mistake, onSave, onClose, categories }: { mistake: any; onSave: (m: any) => void; onClose: () => void, categories: string[] }) {
  const [f, setF] = useState(mistake);
  const sf = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));
  return (
    <ModalPortal>
      <div style={ovStyle()} onClick={onClose}>
        <div style={{ ...modalStyle(), width: "min(600px,94vw)" }} onClick={x => x.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div className="h2">Log Mistake</div>
            <button style={{ background: "none", border: "none", color: "var(--t3)", fontSize: 20, cursor: "pointer" }} onClick={onClose}>×</button>
          </div>
          
          <div style={gridStyle(2, 10)}>
            <Field label="Date"><input type="date" style={inpStyle()} value={f.date} onChange={x => sf("date", x.target.value)} /></Field>
            <Field label="Category"><select style={selStyle()} value={f.category} onChange={x => sf("category", x.target.value)}>{categories.map(c => <option key={c}>{c}</option>)}</select></Field>
          </div>

          <div style={gridStyle(2, 10)}>
            <Field label="Symbol"><select style={selStyle()} value={f.symbol || "ES"} onChange={x => sf("symbol", x.target.value)}>{SYMBOLS.map(s => <option key={s}>{s}</option>)}</select></Field>
            <Field label="Session"><select style={selStyle()} value={f.session || "New York"} onChange={x => sf("session", x.target.value)}>{SESSIONS.map(s => <option key={s}>{s}</option>)}</select></Field>
          </div>

          <div style={gridStyle(2, 10)}>
            <Field label="Impact ($ Loss)"><input type="number" style={inpStyle()} value={f.impact || 0} onChange={x => sf("impact", parseFloat(x.target.value))} /></Field>
            <Field label="Recurrence (1-5)"><input type="number" style={inpStyle()} min="1" max="5" value={f.recurrence || 1} onChange={x => sf("recurrence", parseInt(x.target.value))} /></Field>
          </div>

          <Field label="Detailed Description"><textarea style={{ ...taStyle(), minHeight: 120 }} value={f.description} onChange={x => sf("description", x.target.value)} placeholder="What happened? Why?" /></Field>
          
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--b2)' }}>
            <button style={btnStyle(false)} onClick={onClose}>Cancel</button>
            <button style={btnStyle(true)} onClick={() => onSave(f)}>Save Mistake</button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

export function WeeklyOutlookModal({ outlook, onSave, onClose, biasOpts }: { outlook: any; onSave: (o: any) => void; onClose: () => void, biasOpts: string[] }) {
  const [f, setF] = useState(outlook);
  const sf = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));
  return (
    <ModalPortal>
      <div style={ovStyle()} onClick={onClose}>
        <div style={{ ...modalStyle(), width: "min(840px,94vw)" }} onClick={x => x.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div className="h2">Weekly Outlook</div>
            <button style={{ background: "none", border: "none", color: "var(--t3)", fontSize: 20, cursor: "pointer" }} onClick={onClose}>×</button>
          </div>
          
          <div style={{ maxHeight: "calc(90vh - 120px)", overflowY: "auto", paddingRight: 4 }}>
            <div style={gridStyle(3, 10)}>
              <Field label="Week Of"><input type="date" style={inpStyle()} value={f.date} onChange={x => sf("date", x.target.value)} /></Field>
              <Field label="Bias"><select style={selStyle()} value={f.bias} onChange={x => sf("bias", x.target.value)}>{biasOpts.map(b => <option key={b}>{b}</option>)}</select></Field>
              <Field label="Title"><input style={inpStyle()} value={f.title} onChange={x => sf("title", x.target.value)} placeholder="E.g., Macro drivers & key levels" /></Field>
            </div>

            <div style={gridStyle(2, 10)}>
              <MdEditor label="Recap (Last Week)" value={f.lastWeekBottomLine} onChange={v => sf("lastWeekBottomLine", v)} minHeight={80} />
              <MdEditor label="Narrative (This Week)" value={f.narrative} onChange={v => sf("narrative", v)} minHeight={80} />
            </div>

            <div style={gridStyle(2, 10)}>
              <Field label="Key Levels"><textarea style={{ ...taStyle(), minHeight: 80, fontFamily: 'var(--font-mono)' }} value={f.keyLevels || ""} onChange={x => sf("keyLevels", x.target.value)} /></Field>
              <Field label="Red Folder News"><textarea style={{ ...taStyle(), minHeight: 80 }} value={f.newsCalendar || ""} onChange={x => sf("newsCalendar", x.target.value)} /></Field>
            </div>

            <MdEditor label="What to Watch this Week" value={f.watchThisWeek} onChange={v => sf("watchThisWeek", v)} minHeight={80} />
            <MdEditor label="Notes" value={f.notes} onChange={v => sf("notes", v)} minHeight={60} />
            
            <div style={{ marginTop: 14 }}>
              <MultiUrlInput urls={f.urls || []} onChange={u => sf("urls", u)} />
              <ImageUploader images={f.images || []} onChange={imgs => sf("images", imgs)} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--b2)' }}>
            <button style={btnStyle(false)} onClick={onClose}>Cancel</button>
            <button style={btnStyle(true)} onClick={() => onSave(f)}>Save Outlook</button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

export function TradeReviewModal({ review, onSave, onClose, categories }: { review: any; onSave: (rev: any) => void; onClose: () => void, categories: string[] }) {
  const [f, setF] = useState(review);
  const toggleMistake = (m: string) => setF((p: any) => ({ ...p, mistakes: (p.mistakes || []).includes(m) ? p.mistakes.filter((x: string) => x !== m) : [...(p.mistakes || []), m] }));

  const grading = [
    { g: "A", l: "Perfect", c: C.g },
    { g: "B", l: "Good", c: C.g },
    { g: "C", l: "Average", c: C.a },
    { g: "D", l: "Poor", c: C.r },
    { g: "F", l: "Violation", c: C.r }
  ];

  return (
    <ModalPortal>
      <div style={ovStyle()} onClick={onClose}>
        <div style={{ ...modalStyle(), width: "min(840px,94vw)" }} onClick={x => x.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div className="h2">Trade Review</div>
              <div style={{ fontSize: 11, color: "var(--t3)" }}>Analyze your execution and psychological state</div>
            </div>
            <button style={{ background: "none", border: "none", color: "var(--t3)", fontSize: 20, cursor: "pointer" }} onClick={onClose}>×</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 24 }}>
            {grading.map(item => (
              <button 
                key={item.g} 
                type="button"
                onClick={() => setF((p: any) => ({ ...p, grade: item.g }))} 
                style={{ 
                  ...btnStyle(), 
                  background: f.grade === item.g ? `${item.c}22` : "var(--s2)",
                  color: f.grade === item.g ? item.c : "var(--t1)",
                  borderColor: f.grade === item.g ? item.c : "var(--b1)",
                  height: 54,
                  flexDirection: 'column',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 800 }}>{item.g}</div>
                <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', opacity: 0.8 }}>{item.l}</div>
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gap: 14, maxHeight: "calc(80vh - 200px)", overflowY: "auto", paddingRight: 4 }}>
            <Field label="Execution — Did you follow the plan?">
              <textarea style={{ ...taStyle(), minHeight: 100 }} value={f.execution || ""} onChange={x => setF((p: any) => ({ ...p, execution: x.target.value }))} placeholder="Explain your entry, management and exit logic..." />
            </Field>
            <Field label="Emotional State — How did you feel?">
              <textarea style={{ ...taStyle(), minHeight: 80 }} value={f.emotion || ""} onChange={x => setF((p: any) => ({ ...p, emotion: x.target.value }))} placeholder="Wait, excitement, anxiety, calm, greed?" />
            </Field>
            <Field label="What I missed or would change">
              <textarea style={{ ...taStyle(), minHeight: 80 }} value={f.missed || ""} onChange={x => setF((p: any) => ({ ...p, missed: x.target.value }))} placeholder="Hindsight observations..." />
            </Field>
            <Field label="Key Lesson learned">
              <textarea style={{ ...taStyle(), minHeight: 80 }} value={f.lesson || ""} onChange={x => setF((p: any) => ({ ...p, lesson: x.target.value }))} placeholder="The single most important takeaway..." />
            </Field>

            <div style={{ marginTop: 10 }}>
              <label style={lblStyle()}>Mistakes on this trade</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px 16px", background: 'var(--s2)', padding: 16, borderRadius: 8, border: '1px solid var(--b1)' }}>
                {categories.map(m => (
                  <label key={m} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12, color: (f.mistakes || []).includes(m) ? C.r : "var(--t2)" }}>
                    <input type="checkbox" style={{ accentColor: C.r }} checked={(f.mistakes || []).includes(m)} onChange={() => toggleMistake(m)} />
                    {m}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--b1)' }}>
            <button style={btnStyle(false)} onClick={onClose}>Cancel</button>
            <button style={btnStyle(true)} onClick={() => onSave(f)}>Save Review</button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
