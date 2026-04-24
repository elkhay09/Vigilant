/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, Fragment } from 'react';
import { Premarket, SessionReview, TradeReview, Mistake, Trade, DeletedItem, WeeklyOutlook } from '../types';
import {
  cardStyle, badgeStyle, btnSmStyle, C, EmptyState, TradeImgRow, MdView, gridStyle, Field, ModalPortal, modalStyle, ovStyle, inpStyle, selStyle, btnStyle, PrivacyValue
} from './Common';
import { PREMARKET_ITEMS, BIAS_OPTS, MENTAL_STATES, MISTAKE_CATS } from '../constants';
import { fmt, today } from '../lib/utils';
import {
  MdEditor, MultiUrlInput, ImageUploader,
  PremarketModal, SessionReviewModal, MistakeModal, TradeReviewModal, WeeklyOutlookModal
} from './Modals';

export function Archive({ 
  premarkets, 
  setPremarkets, 
  reviews, 
  setReviews, 
  mistakes, 
  setMistakes, 
  tradeReviews, 
  setTradeReviews, 
  trades, 
  deletedItems, 
  setDeletedItems, 
  setTrades,
  outlooks,
  setOutlooks,
  privacyMode
}: { 
  premarkets: Premarket[]; 
  setPremarkets: React.Dispatch<React.SetStateAction<Premarket[]>>; 
  reviews: SessionReview[]; 
  setReviews: React.Dispatch<React.SetStateAction<SessionReview[]>>; 
  mistakes: Mistake[]; 
  setMistakes: React.Dispatch<React.SetStateAction<Mistake[]>>; 
  tradeReviews: TradeReview[]; 
  setTradeReviews: React.Dispatch<React.SetStateAction<TradeReview[]>>; 
  trades: Trade[]; 
  deletedItems: DeletedItem[]; 
  setDeletedItems: React.Dispatch<React.SetStateAction<DeletedItem[]>>; 
  setTrades: React.Dispatch<React.SetStateAction<Trade[]>>;
  outlooks: WeeklyOutlook[];
  setOutlooks: React.Dispatch<React.SetStateAction<WeeklyOutlook[]>>;
  privacyMode: boolean;
}) {
  const [sub, setSub] = useState("outlooks");
  const [filter, setFilter] = useState("");
  const [expanded, setExpanded] = useState(() => new Set<string>());
  const toggle = (id: string) => setExpanded(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const isOpen = (id: string) => expanded.has(id);
  const [editPm, setEditPm] = useState<any>(null);
  const [editRev, setEditRev] = useState<any>(null);
  const [editTrRev, setEditTrRev] = useState<any>(null);
  const [editMist, setEditMist] = useState<any>(null);
  const [editOut, setEditOut] = useState<any>(null);

  const savePmEdit = (en: any) => { setPremarkets(p => { const i = p.findIndex(x => x.id === en.id); if (i >= 0) { const n = [...p]; n[i] = en; return n; } return p; }); setEditPm(null); };
  const saveRevEdit = (en: any) => { setReviews(p => { const i = p.findIndex(x => x.id === en.id); if (i >= 0) { const n = [...p]; n[i] = en; return n; } return p; }); setEditRev(null); };
  const saveTrRevEdit = (en: any) => { setTradeReviews(p => { const i = p.findIndex(x => x.id === en.id); if (i >= 0) { const n = [...p]; n[i] = en; return n; } return p; }); setEditTrRev(null); };
  const saveMistEdit = (en: any) => { setMistakes(p => { const i = p.findIndex(x => x.id === en.id); if (i >= 0) { const n = [...p]; n[i] = en; return n; } return p; }); setEditMist(null); };
  const saveOutEdit = (en: any) => { setOutlooks(p => { const i = p.findIndex(x => x.id === en.id); if (i >= 0) { const n = [...p]; n[i] = en; return n; } return p; }); setEditOut(null); };

  const activeDeleted = (deletedItems || []).filter(d => { const age = (Date.now() - new Date(d.deletedAt).getTime()) / 86400000; return age <= 30; });
  const tabs = [
    { id: "outlooks", l: "Weekly Outlook", c: outlooks.filter(o => o.date !== today()).length, col: C.g },
    { id: "premarkets", l: "Pre-Session", c: premarkets.filter(p => p.date !== today()).length, col: C.a }, 
    { id: "tradeReviews", l: "Trade Review", c: tradeReviews.filter(r => r.date !== today()).length, col: "var(--am)" }, 
    { id: "reviews", l: "Session Review", c: reviews.filter(r => r.date !== today()).length, col: C.g }, 
    { id: "mistakes", l: "Mistake", c: mistakes.filter(m => m.date !== today()).length, col: C.r }, 
    { id: "deleted", l: "Trash", c: activeDeleted.length, col: "var(--t3)" }
  ];
  const f = filter.toLowerCase();
  const matchesText = (...fields: any[]) => !f || fields.some(x => (x || "").toLowerCase().includes(f));
  const sortByDate = (arr: any[]) => [...arr].sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  const renderPremarkets = () => {
    const items = sortByDate(premarkets).filter(p => p.date !== today() && matchesText(p.date, p.bias, p.keyLevels, p.newsToday, p.avoidToday, p.notes));
    if (items.length === 0) return <EmptyState icon="○" title="No archived pre-sessions" sub="Pre-sessions from previous days will appear here." />;
    return items.map(p => {
      const done = p.checklist.filter(Boolean).length, total = PREMARKET_ITEMS.length, pct2 = Math.round(done / total * 100);
      const biasC: Record<string, string> = { Bullish: C.g, Bearish: C.r, Neutral: C.a, "No Bias": "var(--t3)" };
      return (
        <div key={p.id} style={{ ...cardStyle(), marginBottom: 8, padding: isOpen(p.id) ? 14 : "10px 14px", borderLeft: `3px solid ${C.a}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", marginBottom: isOpen(p.id) ? 8 : 0 }} onClick={() => toggle(p.id)}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}><span style={{ fontSize: 11, color: "var(--t3)" }}>{isOpen(p.id) ? "▼" : "▶"}</span><span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>{p.date}</span><span style={badgeStyle(biasC[p.bias] || "var(--t3)", `${biasC[p.bias] || "var(--t3)"}15`)}>{p.bias}</span><span style={{ fontSize: 11, color: pct2 === 100 ? C.g : "var(--t2)" }}>{`${done}/${total}`}</span></div>
            <div style={{ display: "flex", gap: 4 }} onClick={ev => ev.stopPropagation()}>
              <button style={btnSmStyle()} onClick={() => setEditPm({ ...p })}>✏</button>
              <button style={btnSmStyle(C.r)} onClick={() => { 
                if (window.confirm("Delete checklist?")) {
                  setPremarkets(x => x.filter(i => i.id !== p.id));
                  setDeletedItems(prev => [...prev, { type: 'premarket', data: p, deletedAt: new Date().toISOString() }]);
                }
              }}>×</button>
            </div>
          </div>
          {isOpen(p.id) && (
            <Fragment>
              <div style={{ height: 3, background: "var(--s3)", borderRadius: 2, marginBottom: 10, overflow: "hidden" }}><div style={{ width: `${pct2}%`, height: "100%", background: pct2 === 100 ? C.g : C.a }} /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 12 }}>
                {p.keyLevels && <div><div className="h4" style={{ marginBottom: 3 }}>Key Levels</div><div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--t2)", lineHeight: 1.7 }}>{p.keyLevels}</div></div>}
              </div>
              {p.notes && <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--b1)" }}><div className="h4" style={{ marginBottom: 5 }}>Notes</div><MdView text={p.notes} style={{ color: "var(--t2)", fontSize: 12 }} /></div>}
            </Fragment>
          )}
        </div>
      );
    });
  };

  const renderReviews = () => {
    const items = sortByDate(reviews).filter(r => r.date !== today() && matchesText(r.date, r.type, r.overallMindset, r.wentWell, r.challenges, r.lessons, r.tomorrowPlan, r.marketConditions));
    if (items.length === 0) return <EmptyState icon="○" title="No archived session reviews" />;
    const tc: Record<string, string> = { Daily: C.a, Weekly: C.g, Monthly: "var(--am)", Quarterly: "var(--t2)" };
    return items.map(r => (
      <div key={r.id} style={{ ...cardStyle(), marginBottom: 8, padding: isOpen(r.id) ? 14 : "10px 14px", borderLeft: `3px solid ${tc[r.type] || C.g}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", marginBottom: isOpen(r.id) ? 10 : 0 }} onClick={() => toggle(r.id)}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "var(--t3)" }}>{isOpen(r.id) ? "▼" : "▶"}</span>
            <span style={badgeStyle(tc[r.type] || C.a, `${tc[r.type] || C.a}18`)}>{r.type}</span>
            <span className="mono" style={{ fontSize: 11, color: "var(--t3)" }}>{r.date}</span>
            {!isOpen(r.id) && r.overallMindset && <span style={{ fontSize: 11, color: "var(--t2)", marginLeft: 8, fontStyle: 'italic' }}>— {r.overallMindset}</span>}
          </div>
          <div style={{ display: "flex", gap: 4 }} onClick={ev => ev.stopPropagation()}>
            <button style={btnSmStyle()} onClick={() => setEditRev({ ...r })}>✏</button>
            <button style={btnSmStyle(C.r)} onClick={() => { 
              if (window.confirm("Delete session review?")) {
                setReviews(x => x.filter(i => i.id !== r.id));
                setDeletedItems(prev => [...prev, { type: 'sessionReview', data: r, deletedAt: new Date().toISOString() }]);
              }
            }}>×</button>
          </div>
        </div>
        {isOpen(r.id) && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontSize: 12, marginTop: 4 }}>
            <div>
              <div style={{ marginBottom: 12 }}>
                <div className="h4" style={{ marginBottom: 4, color: "var(--t3)", textTransform: 'uppercase', fontSize: 10 }}>Mindset</div>
                <div style={{ color: "var(--t1)" }}>{r.overallMindset || "N/A"}</div>
              </div>
              {r.wentWell && <div style={{ marginBottom: 12 }}><div className="h4" style={{ marginBottom: 4, color: C.g, textTransform: 'uppercase', fontSize: 10 }}>Went Well</div><p style={{ lineHeight: 1.5, color: "var(--t2)" }}>{r.wentWell}</p></div>}
              {r.challenges && <div style={{ marginBottom: 12 }}><div className="h4" style={{ marginBottom: 4, color: C.r, textTransform: 'uppercase', fontSize: 10 }}>Challenges</div><p style={{ lineHeight: 1.5, color: "var(--t2)" }}>{r.challenges}</p></div>}
            </div>
            <div>
              {r.lessons && <div style={{ marginBottom: 12 }}><div className="h4" style={{ marginBottom: 4, color: C.a, textTransform: 'uppercase', fontSize: 10 }}>Lessons</div><p style={{ lineHeight: 1.5, color: "var(--t2)" }}>{r.lessons}</p></div>}
              {r.tomorrowPlan && <div style={{ marginBottom: 12 }}><div className="h4" style={{ marginBottom: 4, color: "var(--am)", textTransform: 'uppercase', fontSize: 10 }}>Tomorrow's Plan</div><p style={{ lineHeight: 1.5, color: "var(--t2)" }}>{r.tomorrowPlan}</p></div>}
            </div>
          </div>
        )}
      </div>
    ));
  };

  const renderTradeReviews = () => {
    const items = sortByDate(tradeReviews).filter(r => r.date !== today() && matchesText(r.date, r.grade, r.execution, r.lesson));
    if (items.length === 0) return <EmptyState icon="○" title="No archived trade reviews" />;
    return items.map(r => (
      <div key={r.id} style={{ ...cardStyle(), marginBottom: 8, padding: isOpen(r.id) ? 14 : "10px 14px", borderLeft: "3px solid var(--am)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", marginBottom: isOpen(r.id) ? 10 : 0 }} onClick={() => toggle(r.id)}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "var(--t3)" }}>{isOpen(r.id) ? "▼" : "▶"}</span>
            <span style={badgeStyle("var(--am)", "var(--amBg)")}>{r.grade || "No Grade"}</span>
            <span className="mono" style={{ fontSize: 11, fontWeight: 600 }}>{r.date}</span>
            {!isOpen(r.id) && r.execution && <span style={{ fontSize: 11, color: "var(--t2)", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>— {r.execution.substring(0, 60)}...</span>}
          </div>
          <div style={{ display: "flex", gap: 4 }} onClick={ev => ev.stopPropagation()}>
            <button style={btnSmStyle()} onClick={() => setEditTrRev({ ...r })}>✏</button>
            <button style={btnSmStyle(C.r)} onClick={() => { 
                if (window.confirm("Delete trade review?")) {
                  setTradeReviews(x => x.filter(i => i.id !== r.id));
                  setDeletedItems(prev => [...prev, { type: 'tradeReview', data: r, deletedAt: new Date().toISOString() }]);
                }
              }}>×</button>
          </div>
        </div>
        {isOpen(r.id) && (
          <div style={{ fontSize: 12, marginTop: 10, display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 20 }}>
            <div>
              {r.execution && <div style={{ marginBottom: 12 }}><div className="h4" style={{ marginBottom: 4, color: "var(--t3)", textTransform: 'uppercase', fontSize: 10 }}>Execution Analysis</div><p style={{ lineHeight: 1.6, color: "var(--t1)" }}>{r.execution}</p></div>}
              {r.lesson && <div style={{ marginBottom: 12 }}><div className="h4" style={{ marginBottom: 4, color: C.a, textTransform: 'uppercase', fontSize: 10 }}>Key Lesson</div><p style={{ lineHeight: 1.6, color: "var(--t1)" }}>{r.lesson}</p></div>}
            </div>
            <div>
              {r.mistakes && r.mistakes.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div className="h4" style={{ marginBottom: 6, color: C.r, textTransform: 'uppercase', fontSize: 10 }}>Mistakes Flagged</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {r.mistakes.map((m, i) => <span key={i} style={badgeStyle(C.r, `${C.r}15`)}>{m}</span>)}
                  </div>
                </div>
              )}
              {r.images && r.images.length > 0 && (
                <div>
                   <div className="h4" style={{ marginBottom: 6, color: "var(--t3)", textTransform: 'uppercase', fontSize: 10 }}>Charts</div>
                   <TradeImgRow images={r.images} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    ));
  };

  const renderMistakes = () => {
    const items = sortByDate(mistakes).filter(m => m.date !== today() && matchesText(m.date, m.category, m.description));
    if (items.length === 0) return <EmptyState icon="○" title="No archived mistakes" />;
    return items.map(m => (
      <div key={m.id} style={{ ...cardStyle(), marginBottom: 8, padding: isOpen(m.id) ? 14 : "10px 14px", borderLeft: `3px solid ${C.r}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", marginBottom: isOpen(m.id) ? 10 : 0 }} onClick={() => toggle(m.id)}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "var(--t3)" }}>{isOpen(m.id) ? "▼" : "▶"}</span>
            <span style={badgeStyle(C.r, "var(--rBg)")}>{m.category}</span>
            <span className="mono" style={{ fontSize: 11, fontWeight: 600 }}>{m.date}</span>
            {!isOpen(m.id) && m.description && <span style={{ fontSize: 11, color: "var(--t2)", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 400 }}>— {m.description.substring(0, 80)}...</span>}
          </div>
          <div style={{ display: "flex", gap: 4 }} onClick={ev => ev.stopPropagation()}>
            <button style={btnSmStyle()} onClick={() => setEditMist({ ...m })}>✏</button>
            <button style={btnSmStyle(C.r)} onClick={() => { 
                if (window.confirm("Delete mistake entry?")) {
                  setMistakes(x => x.filter(i => i.id !== m.id));
                  setDeletedItems(prev => [...prev, { type: 'mistake', data: m, deletedAt: new Date().toISOString() }]);
                }
              }}>×</button>
          </div>
        </div>
        {isOpen(m.id) && (
          <div style={{ fontSize: 12, marginTop: 10 }}>
            <div className="h4" style={{ marginBottom: 6, color: C.r, textTransform: 'uppercase', fontSize: 10 }}>Description</div>
            <p style={{ lineHeight: 1.6, color: "var(--t1)", marginBottom: 12 }}>{m.description}</p>
            {m.mitigation && (
              <div>
                <div className="h4" style={{ marginBottom: 6, color: C.g, textTransform: 'uppercase', fontSize: 10 }}>Mitigation Strategy</div>
                <p style={{ lineHeight: 1.6, color: "var(--t2)" }}>{m.mitigation}</p>
              </div>
            )}
          </div>
        )}
      </div>
    ));
  };

  const renderOutlooks = () => {
    const items = sortByDate(outlooks).filter(o => o.date !== today() && matchesText(o.date, o.title, o.narrative, o.lastWeekBottomLine, o.watchThisWeek));
    if (items.length === 0) return <EmptyState icon="○" title="No archived outlooks" />;
    const biasC: Record<string, string> = { Bullish: C.g, Bearish: C.r, Neutral: C.a, Range: "var(--am)" };
    return items.map(o => (
      <div key={o.id} style={{ ...cardStyle(), marginBottom: 8, padding: isOpen(o.id) ? 14 : "10px 14px", borderLeft: `3px solid ${C.g}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", marginBottom: isOpen(o.id) ? 10 : 0 }} onClick={() => toggle(o.id)}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "var(--t3)" }}>{isOpen(o.id) ? "▼" : "▶"}</span>
            <span style={badgeStyle(C.g, `${C.g}18`)}>Weekly</span>
            <span className="mono" style={{ fontSize: 11, color: "var(--t3)" }}>{o.date}</span>
            {o.title && <span style={{ fontSize: 11, color: "var(--t1)", fontWeight: 600 }}>— {o.title}</span>}
            {o.bias && <span style={badgeStyle(biasC[o.bias] || "var(--t2)", `${biasC[o.bias] || "var(--t2)"}15`)}>{o.bias}</span>}
          </div>
          <div style={{ display: "flex", gap: 4 }} onClick={ev => ev.stopPropagation()}>
            <button style={btnSmStyle()} onClick={() => setEditOut({ ...o })}>✏</button>
            <button style={btnSmStyle(C.r)} onClick={() => { 
              if (window.confirm("Delete outlook?")) {
                setOutlooks(x => x.filter(i => i.id !== o.id));
                setDeletedItems(prev => [...prev, { type: 'weeklyOutlook', data: o, deletedAt: new Date().toISOString() }]);
              }
            }}>×</button>
          </div>
        </div>
        {isOpen(o.id) && (
          <div style={{ fontSize: 12, marginTop: 10 }}>
            {o.lastWeekBottomLine && <div style={{ marginBottom: 12 }}><div className="h4" style={{ marginBottom: 4, color: "var(--am)", textTransform: 'uppercase', fontSize: 10 }}>Recap</div><MdView text={o.lastWeekBottomLine} /></div>}
            {o.narrative && <div style={{ marginBottom: 12 }}><div className="h4" style={{ marginBottom: 4, color: C.a, textTransform: 'uppercase', fontSize: 10 }}>Narrative</div><MdView text={o.narrative} /></div>}
            {o.watchThisWeek && <div style={{ marginBottom: 12 }}><div className="h4" style={{ marginBottom: 4, color: C.g, textTransform: 'uppercase', fontSize: 10 }}>Watch List</div><MdView text={o.watchThisWeek} /></div>}
          </div>
        )}
      </div>
    ));
  };

  const renderDeleted = () => {
    if (!activeDeleted.length) return <EmptyState icon="○" title="No recently deleted items" />;
    const restoreItem = (item: DeletedItem) => {
      if (item.type === "trade") setTrades(p => [...p, item.data]);
      else if (item.type === "tradeReview") setTradeReviews(p => [...p, item.data]);
      else if (item.type === "sessionReview") setReviews(p => [...p, item.data]);
      else if (item.type === "mistake") setMistakes(p => [...p, item.data]);
      else if (item.type === "weeklyOutlook") setOutlooks(p => [...p, item.data]);
      else if (item.type === "premarket") setPremarkets(p => [...p, item.data]);
      setDeletedItems(p => p.filter(x => x !== item));
    };
    return activeDeleted.sort((a, b) => b.deletedAt.localeCompare(a.deletedAt)).map((item, i) => {
      const d = item.data; const age = Math.floor((Date.now() - new Date(item.deletedAt).getTime()) / 86400000);
      return (
        <div key={i} style={{ ...cardStyle(), marginBottom: 8, padding: 14, borderLeft: "3px solid var(--t3)", opacity: .8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span style={badgeStyle("var(--t3)", "var(--s3)")}>{item.type}</span>
              {item.type === "trade" && (
                <Fragment>
                  <span style={{ fontWeight: 700 }}>{`${d.symbol} ${d.direction}`}</span>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: d.pnl >= 0 ? 'var(--gBg)' : 'var(--rBg)', color: d.pnl >= 0 ? C.g : C.r, fontWeight: 700 }}>
                    <PrivacyValue value={d.pnl} privacyMode={privacyMode} />
                  </span>
                </Fragment>
              )}
              <span className="mono" style={{ fontSize: 11, color: "var(--t3)" }}>{d.date}</span>
              <span style={{ fontSize: 10, color: "var(--t3)" }}>{`deleted ${age}d ago`}</span>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <button style={btnSmStyle(C.g)} onClick={() => restoreItem(item)}>↩ Restore</button>
              <button style={btnSmStyle(C.r)} onClick={() => { if (window.confirm("Permanently delete?")) setDeletedItems(p => p.filter(x => x !== item)); }}>✕</button>
            </div>
          </div>
        </div>
      );
    });
  };

  const render = sub === "premarkets" ? renderPremarkets() : sub === "outlooks" ? renderOutlooks() : sub === "reviews" ? renderReviews() : sub === "tradeReviews" ? renderTradeReviews() : sub === "mistakes" ? renderMistakes() : sub === "deleted" ? renderDeleted() : <div>Coming soon...</div>;

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <div><div className="h1">Journal Archive</div><div style={{ fontSize: 12, color: "var(--t2)", marginTop: 2 }}>Browse everything you've logged</div></div>
        <input style={{ ...inpStyle(), width: 240 }} placeholder="Filter all entries..." value={filter} onChange={x => setFilter(x.target.value)} />
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 18, borderBottom: "1px solid var(--b1)", paddingBottom: 0, flexWrap: "wrap" }}>
        {tabs.map(t => <button key={t.id} onClick={() => setSub(t.id)} style={{ padding: "10px 16px", background: "none", border: "none", borderBottom: sub === t.id ? `2px solid ${t.col}` : "2px solid transparent", color: sub === t.id ? t.col : "var(--t3)", fontSize: 13, fontWeight: sub === t.id ? 700 : 500, cursor: "pointer", marginBottom: -1 }}>{`${t.l} (${t.c})`}</button>)}
      </div>
      {render}
      {editPm && <PremarketModal pm={editPm} onSave={savePmEdit} onClose={() => setEditPm(null)} items={PREMARKET_ITEMS} biasOpts={BIAS_OPTS} />}
      {editRev && <SessionReviewModal review={editRev} onSave={saveRevEdit} onClose={() => setEditRev(null)} />}
      {editTrRev && <TradeReviewModal review={editTrRev} onSave={saveTrRevEdit} onClose={() => setEditTrRev(null)} categories={MISTAKE_CATS} />}
      {editMist && <MistakeModal mistake={editMist} onSave={saveMistEdit} onClose={() => setEditMist(null)} categories={MISTAKE_CATS} />}
      {editOut && <WeeklyOutlookModal outlook={editOut} onSave={saveOutEdit} onClose={() => setEditOut(null)} biasOpts={BIAS_OPTS} />}
    </div>
  );
}
