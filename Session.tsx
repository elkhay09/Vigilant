/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, Fragment } from 'react';
import { Trade, TradeReview, Premarket, SessionReview, Mistake, PlaybookSetup, DeletedItem } from '../types';
import {
  cardStyle, badgeStyle, btnStyle, btnSmStyle, gridStyle,
  C, Field, ModalPortal, modalStyle, ovStyle, taStyle, inpStyle, selStyle, lblStyle,
  TradeImgRow, MdView
} from './Common';
import { fmt, uid, today, tradeDur, fmtDur } from '../lib/utils';
import { PREMARKET_ITEMS, BIAS_OPTS, MENTAL_STATES, MISTAKE_CATS, SYMBOLS, SESSIONS, RULES } from '../constants';
import {
  TradeModal, MdEditor, ImageUploader, MultiUrlInput,
  PremarketModal, SessionReviewModal, MistakeModal, TradeReviewModal
} from './Modals';

export function Session({ trades, setTrades, tradeReviews, setTradeReviews, premarkets, setPremarkets, reviews, setReviews, mistakes, setMistakes, setups, setDeletedItems }: { trades: Trade[]; setTrades: React.Dispatch<React.SetStateAction<Trade[]>>; tradeReviews: TradeReview[]; setTradeReviews: React.Dispatch<React.SetStateAction<TradeReview[]>>; premarkets: Premarket[]; setPremarkets: React.Dispatch<React.SetStateAction<Premarket[]>>; reviews: SessionReview[]; setReviews: React.Dispatch<React.SetStateAction<SessionReview[]>>; mistakes: Mistake[]; setMistakes: React.Dispatch<React.SetStateAction<Mistake[]>>; setups: PlaybookSetup[]; setDeletedItems: React.Dispatch<React.SetStateAction<DeletedItem[]>> }) {
  const [pmModal, setPmModal] = useState(false); const [pmF, setPmF] = useState<any>(null);
  const [tradeModal, setTradeModal] = useState<any>(null);
  const [trRevModal, setTrRevModal] = useState<string | null>(null); const [trRevF, setTrRevF] = useState<any>(null);
  const [sesRevModal, setSesRevModal] = useState(false); const [sesRevF, setSesRevF] = useState<any>(null);
  const [mistModal, setMistModal] = useState(false); const [mistF, setMistF] = useState<any>(null);
  const td2 = today();
  const todayTrades = trades.filter(t => t.date === td2);
  const todayPm = premarkets.filter(p => p.date === td2);
  const todayRev = reviews.filter(r => r.date === td2);
  const todayMist = mistakes.filter(m => m.date === td2);
  const dayPnl = todayTrades.reduce((a, t) => a + t.pnl, 0);
  const dayWins = todayTrades.filter(t => t.pnl > 0).length;
  const pmDone = todayPm.length > 0 && todayPm[0]?.checklist.filter(Boolean).length === PREMARKET_ITEMS.length;
  const biasC: Record<string, string> = { Bullish: C.g, Bearish: C.r, Neutral: C.a, "No Bias": C.t3 };

  const saveTrade = (t: Trade, review?: TradeReview | null) => { 
    const tWithTs = { ...t, updatedAt: new Date().toISOString() };
    setTrades(p => { const i = p.findIndex(x => x.id === tWithTs.id); if (i >= 0) { const n = [...p]; n[i] = tWithTs; return n; } return [...p, tWithTs]; }); 
    if (review) {
      const rWithTs = { ...review, updatedAt: new Date().toISOString() };
      setTradeReviews(p => { const i = p.findIndex(x => x.tradeId === tWithTs.id); if (i >= 0) { const n = [...p]; n[i] = rWithTs; return n; } return [...p, rWithTs]; });
    }
    setTradeModal(null); 
  };
  const savePm = (en: any) => { 
    const final = { ...en, id: en.id || uid(), updatedAt: new Date().toISOString() }; 
    setPremarkets(p => { const i = p.findIndex(x => x.id === final.id); if (i >= 0) { const n = [...p]; n[i] = final; return n; } return [...p, final]; }); 
    setPmModal(false); 
  };
  const saveTrRev = (en: any) => { 
    const final = { ...en, id: en.id || uid(), updatedAt: new Date().toISOString() }; 
    setTradeReviews(p => { const i = p.findIndex(x => x.id === final.id); if (i >= 0) { const n = [...p]; n[i] = final; return n; } return [...p, final]; }); 
    setTrRevModal(null); setTrRevF(null); 
  };
  const saveSesRev = (en: any) => { 
    const final = { ...en, id: en.id || uid(), updatedAt: new Date().toISOString() }; 
    setReviews(p => { const i = p.findIndex(x => x.id === final.id); if (i >= 0) { const n = [...p]; n[i] = final; return n; } return [...p, final]; }); 
    setSesRevModal(false); 
  };
  const saveMist = (en: any) => { 
    const final = { ...en, id: en.id || uid(), impact: parseFloat(en.impact) || 0, recurrence: parseInt(en.recurrence) || 1, updatedAt: new Date().toISOString() }; 
    setMistakes(p => { const i = p.findIndex(x => x.id === final.id); if (i >= 0) { const n = [...p]; n[i] = final; return n; } return [...p, final]; }); 
    setMistModal(false); 
  };

  const steps = [{ done: pmDone, l: "Pre-Session" }, { done: todayTrades.length > 0, l: "Trades" }, { done: todayMist.length > 0 || (todayTrades.length > 0 && todayTrades.every(t => (tradeReviews || []).some(r => r.tradeId === t.id))), l: "Trade Reviews" }, { done: todayRev.length > 0, l: "Session Review" }];
  const nDone = steps.filter(s => s.done).length;

  const SH = (title: string, sub?: string, pill?: React.ReactNode, onAdd?: () => void, addLabel?: string) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, paddingBottom: 12, borderBottom: "1px solid var(--b1)" }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span className="h2" style={{ fontSize: 15 }}>{title}</span>{pill}</div>
        {sub && <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 2 }}>{sub}</div>}
      </div>
      {onAdd && <button style={btnStyle(true)} onClick={onAdd}>{addLabel || "+ Add"}</button>}
    </div>
  );

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div className="h1" style={{ marginBottom: 3 }}>Daily Log</div>
          <div style={{ fontSize: 12, color: "var(--t3)" }}>Pre-Session → Trades → Trade Reviews → Session Review</div>
        </div>
        {todayTrades.length > 0 && (
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ ...badgeStyle(dayPnl >= 0 ? C.g : C.r, dayPnl >= 0 ? "var(--gBg)" : "var(--rBg)"), padding: "6px 14px", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13 }}>{fmt(dayPnl)}</span>
            <span style={{ ...badgeStyle(C.a, "var(--aBg)"), padding: "5px 11px", fontSize: 12 }}>{`${todayTrades.length} trade${todayTrades.length !== 1 ? "s" : ""} today`}</span>
            {dayWins > 0 && <span style={{ ...badgeStyle(C.g, "var(--gBg)"), padding: "5px 9px", fontSize: 11 }}>{`${dayWins}W`}</span>}
            {(todayTrades.length - dayWins) > 0 && <span style={{ ...badgeStyle(C.r, "var(--rBg)"), padding: "5px 9px", fontSize: 11 }}>{`${todayTrades.length - dayWins}L`}</span>}
          </div>
        )}
      </div>

      <div style={{ background: "var(--s1)", borderRadius: 12, border: "1px solid var(--b1)", padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 0, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        {steps.map((s, i) => (
          <Fragment key={s.l}>
            <div style={{ display: "flex", flex: 1, flexDirection: "column", alignItems: "center", gap: 6, position: 'relative' }}>
              <div style={{ 
                width: 24, height: 24, borderRadius: "50%", 
                background: s.done ? "var(--gBg)" : "var(--s3)", 
                border: `1px solid ${s.done ? "var(--g)" : "var(--b2)"}`, 
                display: "flex", alignItems: "center", justifyContent: "center", 
                fontSize: 10, color: s.done ? "var(--g)" : "var(--t4)", fontWeight: 800,
                boxShadow: s.done ? '0 0 10px var(--gBg)' : 'none',
                transition: 'all .3s ease'
              }}>
                {s.done ? "✓" : i + 1}
              </div>
              <div style={{ 
                fontSize: 9, color: s.done ? "var(--t1)" : "var(--t3)", 
                fontWeight: 700, textTransform: "uppercase", 
                letterSpacing: ".8px", textAlign: "center" 
              }}>
                {s.l}
              </div>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1.5, height: 2, background: s.done ? "var(--g)" : "var(--b1)", opacity: s.done ? 0.6 : 0.2, borderRadius: 1, marginBottom: 15 }} />
            )}
          </Fragment>
        ))}
        <div style={{ marginLeft: 20, paddingLeft: 20, borderLeft: "1px solid var(--b1)", textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: nDone === 4 ? "var(--g)" : "var(--t1)", lineHeight:1 }}>{nDone}</div>
          <div style={{ fontSize: 9, color: "var(--t3)", textTransform: 'uppercase', fontWeight: 700 }}>of 4</div>
        </div>
      </div>

      <div style={{ ...cardStyle(), marginBottom: 14, padding: 20 }}>
        {SH("Pre-Session", "Complete before the session opens",
          pmDone && <span style={{ fontSize: 10, color: "var(--g)", background: "var(--gBg)", borderRadius: 10, padding: "1px 8px", fontWeight: 700 }}>✓ Done</span>,
          () => { setPmF({ id: null, date: td2, bias: "Neutral", keyLevels: "", newsToday: "", avoidToday: "", checklist: PREMARKET_ITEMS.map(() => false), notes: "", images: [], urls: [] }); setPmModal(true); }, "+ New Checklist"
        )}
        {todayPm.map(p => {
          const done = p.checklist.filter(Boolean).length, total = PREMARKET_ITEMS.length, pct2 = Math.round(done / total * 100);
          return (
            <div key={p.id} style={{ background: "var(--s2)", borderRadius: 8, padding: 14, marginBottom: 8, border: "1px solid var(--b1)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}><span className="mono" style={{ fontSize: 11, fontWeight: 600 }}>{p.date}</span><span style={badgeStyle(biasC[p.bias] || C.t3, `${biasC[p.bias] || C.t3}15`)}>{p.bias}</span><span style={{ fontSize: 10, color: pct2 === 100 ? C.g : C.t2 }}>{`${done}/${total}`}</span></div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button style={btnSmStyle()} onClick={() => { setPmF({ ...p }); setPmModal(true); }}>✏</button>
                  <button style={btnSmStyle(C.r)} onClick={() => { 
                    if (window.confirm("Delete this pre-session checklist?")) {
                      setPremarkets(x => x.filter(i => i.id !== p.id));
                      setDeletedItems(prev => [...prev, { type: 'premarket', data: p, deletedAt: new Date().toISOString() }]);
                    }
                  }}>×</button>
                </div>
              </div>
              <div style={{ height: 3, background: "var(--s3)", borderRadius: 2, marginBottom: 10, overflow: "hidden" }}><div style={{ width: `${pct2}%`, height: "100%", background: pct2 === 100 ? C.g : C.a, borderRadius: 2 }} /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 12 }}>
                <div>
                  <div className="h4" style={{ marginBottom: 6 }}>Checklist</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{PREMARKET_ITEMS.map((item, i) => <span key={i} style={{ ...badgeStyle(p.checklist[i] ? C.g : "var(--t3)", p.checklist[i] ? "var(--gBg)" : "var(--s3)"), fontSize: 10 }}>{`${p.checklist[i] ? "✓" : ""} ${item.split(" ").slice(0, 3).join(" ")}`}</span>)}</div>
                </div>
                <div>
                  {p.keyLevels && <div style={{ marginBottom: 6 }}><div className="h4" style={{ marginBottom: 3 }}>Key Levels</div><div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--t2)", lineHeight: 1.7 }}>{p.keyLevels}</div></div>}
                  {p.newsToday && <div style={{ marginBottom: 6 }}><div className="h4" style={{ marginBottom: 3, color: "var(--am)" }}>News</div><div style={{ fontSize: 11, color: "var(--t2)" }}>{p.newsToday}</div></div>}
                  {p.avoidToday && <div><div className="h4" style={{ marginBottom: 3, color: "var(--r)" }}>Avoid</div><div style={{ fontSize: 11, color: "var(--t2)" }}>{p.avoidToday}</div></div>}
                </div>
              </div>
              {p.notes && <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--b1)" }}><div className="h4" style={{ marginBottom: 5 }}>Notes & Game Plan</div><MdView text={p.notes} style={{ color: "var(--t2)", fontSize: 12 }} /></div>}
            </div>
          );
        })}
        {todayPm.length === 0 && <div style={{ padding: "20px", textAlign: "center", color: "var(--t3)", fontSize: 12, border: "1px dashed var(--b2)", borderRadius: 6 }}>No pre-session checklist for today — click + New Checklist to start.</div>}
      </div>

      <div style={{ ...cardStyle(), marginBottom: 14, padding: 20 }}>
        {SH("Trades", `${todayTrades.length} trade${todayTrades.length !== 1 ? "s" : ""} today · ${fmt(dayPnl)}`, null, () => setTradeModal("new"), "+ Log Trade")}
        {todayTrades.length === 0 && <div style={{ padding: "20px", textAlign: "center", color: "var(--t3)", fontSize: 12, border: "1px dashed var(--b2)", borderRadius: 6 }}>No trades logged today — click + Log Trade to begin.</div>}
        {todayTrades.map((t, ti) => {
          const trRev = (tradeReviews || []).find(r => r.tradeId === t.id);
          const rulesPct = t.followedRules.length / RULES.length;
          return (
            <div key={t.id} style={{ marginBottom: ti < todayTrades.length - 1 ? 14 : 0 }}>
              <div style={{ background: "var(--s2)", borderRadius: 8, border: `1px solid ${t.pnl >= 0 ? "var(--gB)" : "var(--rB)"}44`, borderLeft: `3px solid ${t.pnl >= 0 ? "var(--g)" : "var(--r)"}`, padding: "12px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{t.symbol}</span>
                    <span style={badgeStyle(t.direction === "Long" ? C.g : C.r, t.direction === "Long" ? "var(--gBg)" : "var(--rBg)")}>{t.direction}</span>
                    <span style={{ color: "var(--t3)", fontSize: 11 }}>{t.strategy}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14, color: t.pnl >= 0 ? C.g : C.r }}>{fmt(t.pnl)}</span>
                    <span style={{ fontFamily: "var(--font-mono)", color: t.rr >= 0 ? C.g : C.r, fontSize: 11 }}>{`${t.rr.toFixed(1)}R`}</span>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button style={btnSmStyle()} onClick={() => setTradeModal(t)}>✏</button>
                    <button style={btnSmStyle(C.r)} onClick={() => { 
                      if (window.confirm("Delete trade?")) {
                        setTrades(p => p.filter(x => x.id !== t.id));
                        if (setDeletedItems) setDeletedItems(prev => [...prev, { type: 'trade', data: t, deletedAt: new Date().toISOString() }]);
                      }
                    }}>×</button>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 11, color: "var(--t2)", flexWrap: "wrap", alignItems: "center" }}>
                  <span>Entry: <span style={{ fontFamily: "var(--font-mono)", color: "var(--t1)" }}>{t.entry}</span> → <span style={{ fontFamily: "var(--font-mono)", color: t.pnl >= 0 ? C.g : C.r }}>{t.exit}</span></span>
                  <span>SL: <span style={{ fontFamily: "var(--font-mono)" }}>{t.sl}</span></span>
                  <span>TP: <span style={{ fontFamily: "var(--font-mono)" }}>{t.tp}</span></span>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: "auto" }}>
                    <div style={{ width: 44, height: 3, borderRadius: 2, background: "var(--s3)", overflow: "hidden" }}><div style={{ width: `${rulesPct * 100}%`, height: "100%", background: rulesPct >= .7 ? C.g : "var(--am)", borderRadius: 2 }} /></div>
                    <span style={{ fontSize: 9, color: "var(--t3)" }}>{`${t.followedRules.length}/${RULES.length} rules`}</span>
                  </div>
                </div>
              </div>
              <div style={{ marginLeft: 0, marginTop: 12 }}>
                {trRev ? (
                  <div style={{ background: "var(--s1)", borderRadius: 10, border: "1px solid var(--b1)", padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <div style={{ 
                          background: trRev.grade ? { A: C.g, B: C.g, C: C.a, D: C.r, F: C.r }[trRev.grade as any] + '22' : 'var(--s3)',
                          color: trRev.grade ? { A: C.g, B: C.g, C: C.a, D: C.r, F: C.r }[trRev.grade as any] : 'var(--t1)',
                          width: 38, height: 38, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, border: `1px solid ${trRev.grade ? { A: C.g, B: C.g, C: C.a, D: C.r, F: C.r }[trRev.grade as any] + '44' : 'var(--b1)'}`
                        }}>
                          {trRev.grade || "?"}
                        </div>
                        <div>
                          <div className="h4" style={{ color: "var(--t1)", fontSize: 13 }}>Trade Review</div>
                          <div style={{ fontSize: 9, color: "var(--t3)", textTransform: "uppercase", letterSpacing: ".5px" }}>Performance Summary</div>
                        </div>
                      </div>
                      <button style={btnSmStyle()} onClick={() => { setTrRevF({ ...trRev }); setTrRevModal(t.id); }}>✏ Edit Review</button>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                      <div style={{ display: 'grid', gap: 10 }}>
                        <div>
                          <div style={{ fontSize: 8, fontWeight: 700, textTransform: "uppercase", color: "var(--t3)", marginBottom: 3 }}>Execution</div>
                          <div style={{ fontSize: 11, color: "var(--t2)", lineHeight: 1.4, whiteSpace: "pre-wrap" }}>{trRev.execution || "—"}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 8, fontWeight: 700, textTransform: "uppercase", color: "var(--t3)", marginBottom: 3 }}>Psychology</div>
                          <div style={{ fontSize: 11, color: "var(--t2)", lineHeight: 1.4, whiteSpace: "pre-wrap" }}>{trRev.emotion || "—"}</div>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gap: 10 }}>
                        <div>
                          <div style={{ fontSize: 8, fontWeight: 700, textTransform: "uppercase", color: "var(--t3)", marginBottom: 3 }}>Key Lesson</div>
                          <div style={{ fontSize: 11, color: "var(--t2)", lineHeight: 1.4, whiteSpace: "pre-wrap" }}>{trRev.lesson || "—"}</div>
                        </div>
                        {trRev.mistakes?.length > 0 && (
                          <div>
                            <div style={{ fontSize: 8, fontWeight: 700, textTransform: "uppercase", color: C.r, marginBottom: 4 }}>Mistakes</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                              {trRev.mistakes.map(m => <span key={m} style={badgeStyle(C.r, "var(--rBg)")}>{m}</span>)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "var(--s2)33", borderRadius: 8, cursor: "pointer", border: "1px dashed var(--b2)", transition: 'all .2s' }} onClick={() => { setTrRevF({ id: null, tradeId: t.id, date: t.date, grade: "", execution: "", missed: "", emotion: "", lesson: "", mistakes: [] }); setTrRevModal(t.id); }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--s3)", display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.a, fontSize: 18 }}>+</div>
                    <div>
                      <div style={{ fontSize: 12, color: "var(--t2)", fontWeight: 600 }}>Review this trade</div>
                      <div style={{ fontSize: 10, color: "var(--t3)" }}>Analyze your performance to improve faster</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ ...cardStyle(), marginBottom: 14, padding: 20 }}>
        {SH("Session Review", "Overall day psychology & performance", todayRev.length > 0 && <span style={{ fontSize: 10, color: "var(--g)", background: "var(--gBg)", borderRadius: 10, padding: "1px 8px", fontWeight: 700 }}>✓ Done</span>, () => { setSesRevF({ id: null, type: "Daily", date: td2, marketConditions: "", overallMindset: "Focused", mindsetOther: "", grade: "", energy: "", wentWell: "", challenges: "", lessons: "", rulesScore: "", tomorrowPlan: "", images: [], urls: [] }); setSesRevModal(true); }, "+ Write Review")}
        {todayRev.map(r => (
          <div key={r.id} style={{ background: "var(--s2)", borderRadius: 8, padding: 14, marginBottom: 8, border: "1px solid var(--b1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}><span style={badgeStyle(C.a, "var(--aBg)")}>{r.type}</span><span className="mono" style={{ fontSize: 11, color: "var(--t3)" }}>{r.date}</span>{r.grade && <span style={badgeStyle("var(--g)", "var(--gBg)")}>Grade {r.grade}</span>}</div>
              <button style={btnSmStyle()} onClick={() => { setSesRevF({ ...r }); setSesRevModal(true); }}>✏</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12 }}>
              {r.wentWell && <div><div className="h4" style={{ marginBottom: 3, color: "var(--g)" }}>Went Well</div><p style={{ lineHeight: 1.5, color: "var(--t2)" }}>{r.wentWell}</p></div>}
              {r.lessons && <div><div className="h4" style={{ marginBottom: 3, color: "var(--a)" }}>Lessons</div><p style={{ lineHeight: 1.5, color: "var(--t2)" }}>{r.lessons}</p></div>}
            </div>
          </div>
        ))}
      </div>

      <div style={{ ...cardStyle(), padding: 20 }}>
        {SH("Mistake Log", "Track recurring errors", null, () => { setMistF({ id: null, date: td2, category: MISTAKE_CATS[0], symbol: "ES", session: "New York", description: "", impact: 0, recurrence: 1 }); setMistModal(true); }, "+ Log Mistake")}
        {todayMist.map(m => (
          <div key={m.id} style={{ background: "var(--s2)", borderRadius: 8, padding: "10px 14px", marginBottom: 8, border: "1px solid var(--b1)", borderLeft: "3px solid var(--r)66" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}><span style={badgeStyle(C.r, "var(--rBg)")}>{m.category}</span><span style={{ fontSize: 11 }}>{m.description}</span></div>
              <button style={btnSmStyle()} onClick={() => { setMistF({ ...m }); setMistModal(true); }}>✏</button>
            </div>
          </div>
        ))}
      </div>

      {tradeModal && <TradeModal trade={tradeModal === "new" ? null : tradeModal} reviews={tradeReviews} onSave={saveTrade} onClose={() => setTradeModal(null)} setups={setups} />}
      {pmModal && pmF && <PremarketModal pm={pmF} onSave={savePm} onClose={() => setPmModal(false)} items={PREMARKET_ITEMS} biasOpts={BIAS_OPTS} />}
      {trRevModal && trRevF && <TradeReviewModal review={trRevF} onSave={saveTrRev} onClose={() => setTrRevModal(null)} categories={MISTAKE_CATS} />}
      {sesRevModal && sesRevF && <SessionReviewModal review={sesRevF} onSave={saveSesRev} onClose={() => setSesRevModal(false)} />}
      {mistModal && mistF && <MistakeModal mistake={mistF} onSave={saveMist} onClose={() => setMistModal(false)} categories={MISTAKE_CATS} />}
    </div>
  );
}
