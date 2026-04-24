/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, Fragment } from 'react';
import { Trade, PlaybookSetup, TradeReview, DeletedItem } from '../types';
import {
  cardStyle, thStyle, tdStyle, btnStyle, btnSmStyle, badgeStyle,
  gridStyle, TradeImgRow, C, cardSmStyle, PrivacyValue
} from './Common';
import { fmt, fmtDur, tradeDur, today, uid } from '../lib/utils';
import { TradeModal, MultiUrlInput } from './Modals';
import { RULES } from '../constants';

export function TradesDB({ 
  trades, 
  setTrades, 
  setups, 
  tradeReviews, 
  setTradeReviews, 
  setDeletedItems,
  privacyMode
}: { 
  trades: Trade[]; 
  setTrades: React.Dispatch<React.SetStateAction<Trade[]>>; 
  setups: PlaybookSetup[]; 
  tradeReviews: TradeReview[]; 
  setTradeReviews: React.Dispatch<React.SetStateAction<TradeReview[]>>; 
  setDeletedItems?: React.Dispatch<React.SetStateAction<DeletedItem[]>>;
  privacyMode: boolean;
}) {
  const [modal, setModal] = useState<Trade | null>(null);
  const [exp, setExp] = useState<string | null>(null);
  const [sort, setSort] = useState({ by: "date", dir: -1 });
  const [filter, setFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const sorted = useMemo(() => {
    let t = [...trades];
    if (dateFrom) t = t.filter(tr => tr.date >= dateFrom);
    if (dateTo) t = t.filter(tr => tr.date <= dateTo);
    if (filter) t = t.filter(tr => tr.symbol.toLowerCase().includes(filter) || tr.session.toLowerCase().includes(filter) || tr.strategy.toLowerCase().includes(filter) || tr.tags.some(tg => tg.toLowerCase().includes(filter)) || tr.date.includes(filter));
    t.sort((a, b) => {
      const dir = sort.dir;
      if (sort.by === "date") return dir * a.date.localeCompare(b.date);
      if (sort.by === "pnl") return dir * (a.pnl - b.pnl);
      if (sort.by === "rr") return dir * (a.rr - b.rr);
      if (sort.by === "dur") return dir * (tradeDur(a) - tradeDur(b));
      return 0;
    });
    return t;
  }, [trades, sort, filter, dateFrom, dateTo]);

  const save = (t: Trade, rev?: TradeReview | null) => {
    const tWithTs = { ...t, updatedAt: new Date().toISOString() };
    setTrades(p => {
      const i = p.findIndex(x => x.id === tWithTs.id);
      if (i >= 0) {
        const n = [...p];
        n[i] = tWithTs;
        return n;
      }
      return [...p, tWithTs];
    });
    if (rev) {
      const rWithTs = { ...rev, updatedAt: new Date().toISOString() };
      setTradeReviews(p => {
        const i = p.findIndex(x => x.tradeId === tWithTs.id);
        if (i >= 0) {
          const n = [...p];
          n[i] = rWithTs;
          return n;
        }
        return [...p, rWithTs];
      });
    }
    setModal(null);
  };

  const del = (id: string) => {
    const t = trades.find(x => x.id === id);
    if (!t) return;
    const detail = `${t.symbol} ${t.direction} on ${t.date}${t.timeEntry ? ` at ${t.timeEntry}` : ""} — P&L: ${fmt(t.pnl)}`;
    if (!window.confirm(`Delete this trade?\n\n${detail}\n\nYou can restore it from Journal Archive → Recently Deleted within 30 days.`)) return;

    const linkedReview = (tradeReviews || []).find(r => r.tradeId === t.id);
    if (linkedReview) {
      const alsoDel = window.confirm(`This trade has a linked review attached. Delete the review too?\n\nClick OK to delete both trade AND review.\nClick Cancel to delete only the trade.`);
      if (alsoDel) {
        setTradeReviews(p => p.filter(r => r.id !== linkedReview.id));
        if (setDeletedItems) setDeletedItems(p => [...p, { type: "tradeReview", data: linkedReview, deletedAt: new Date().toISOString() }]);
      }
    }
    setTrades(p => p.filter(x => x.id !== t.id));
    if (setDeletedItems) setDeletedItems(p => [...p, { type: "trade", data: t, deletedAt: new Date().toISOString() }]);
  };

  const ts = (by: string) => setSort(p => p.by === by ? { ...p, dir: p.dir * -1 } : { by, dir: -1 });
  const sa = (by: string) => sort.by === by ? (sort.dir > 0 ? " ↑" : " ↓") : "";

  const expCSV = () => {
    const h = ["Date", "Entry Time", "Close Time", "Duration", "Symbol", "Dir", "Session", "Strategy", "Entry", "SL", "TP", "Exit", "P&L", "R:R", "Lots", "Account", "Mental Pre", "Notes"];
    const rows = trades.map(t => [t.date, t.timeEntry || "", t.timeClose || "", fmtDur(tradeDur(t)), t.symbol, t.direction, t.session, t.strategy, t.entry, t.sl, t.tp, t.exit, t.pnl, t.rr, t.lots, t.account, t.mentalPre, `"${(t.notes || "").replace(/"/g, "'")}"`]);
    const csv = [h, ...rows].map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = `trades_${today()}.csv`;
    a.click();
  };

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="h1">Trades</div>
          <div style={{ fontSize: 12, color: "var(--t3)", marginTop: 2 }}>Log new trades in Daily Log · Edit any trade here</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input type="date" style={{ background: "var(--s2)", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--b1)", color: "var(--t1)", width: 130, fontSize: 11 }} value={dateFrom} onChange={x => setDateFrom(x.target.value)} title="From date" />
          <span style={{ color: "var(--t3)", fontSize: 11 }}>→</span>
          <input type="date" style={{ background: "var(--s2)", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--b1)", color: "var(--t1)", width: 130, fontSize: 11 }} value={dateTo} onChange={x => setDateTo(x.target.value)} title="To date" />
          <input style={{ background: "var(--s2)", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--b1)", color: "var(--t1)", width: 160, fontSize: 13 }} placeholder="Filter..." value={filter} onChange={x => setFilter(x.target.value.toLowerCase())} />
          <span style={{ fontSize: 11, color: "var(--t3)" }}>{`${sorted.length} trades`}</span>
          <button style={btnStyle(false)} onClick={expCSV}>↓ CSV</button>
        </div>
      </div>
      <div style={{ ...cardStyle(), padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr>
                <th style={thStyle()}></th>
                <th style={{ ...thStyle(), cursor: "pointer" }} onClick={() => ts("date")}>{`Date${sa("date")}`}</th>
                <th style={thStyle()}>Symbol</th>
                <th style={thStyle()}>Dir</th>
                <th style={thStyle()}>Session</th>
                <th style={thStyle()}>Strategy</th>
                <th style={{ ...thStyle(), cursor: "pointer" }} onClick={() => ts("pnl")}>{`P&L${sa("pnl")}`}</th>
                <th style={{ ...thStyle(), cursor: "pointer" }} onClick={() => ts("rr")}>{`R:R${sa("rr")}`}</th>
                <th style={{ ...thStyle(), cursor: "pointer" }} onClick={() => ts("dur")}>{`Duration${sa("dur")}`}</th>
                <th style={thStyle()}>Rules</th>
                <th style={thStyle()}>Review</th>
                <th style={thStyle()}></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(t => {
                const trRev = (tradeReviews || []).find(r => r.tradeId === t.id);
                return (
                  <Fragment key={t.id}>
                    <tr 
                      style={{ cursor: "pointer", background: "var(--s1)", transition: 'background 0.2s ease' }} 
                      onClick={() => setExp(exp === t.id ? null : t.id)}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--s2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'var(--s1)'}
                    >
                      <td style={tdStyle()}><span style={{ fontSize: 9, color: "var(--t3)" }}>{exp === t.id ? "▼" : "▶"}</span></td>
                      <td style={{ ...tdStyle(), fontFamily: "var(--font-mono)", fontSize: 11 }}>{t.date}</td>
                      <td style={{ ...tdStyle(), fontWeight: 700 }}>{t.symbol}</td>
                      <td style={tdStyle()}><span style={badgeStyle(t.direction === "Long" ? C.g : C.r, t.direction === "Long" ? "var(--gBg)" : "var(--rBg)")}>{t.direction}</span></td>
                      <td style={{ ...tdStyle(), color: "var(--t2)", fontSize: 11 }}>{t.session}</td>
                      <td style={{ ...tdStyle(), color: "var(--t2)", fontSize: 11 }}>{t.strategy}</td>
                      <td style={{ ...tdStyle(), fontFamily: "var(--font-mono)", fontWeight: 700, color: t.pnl >= 0 ? C.g : C.r }}>
                      <PrivacyValue value={t.pnl} privacyMode={privacyMode} />
                    </td>
                      <td style={{ ...tdStyle(), fontFamily: "var(--font-mono)", color: t.rr >= 0 ? C.g : C.r, fontSize: 11 }}>{`${t.rr.toFixed(1)}R`}</td>
                      <td style={{ ...tdStyle(), fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--t2)" }}>{fmtDur(tradeDur(t))}</td>
                      <td style={tdStyle()}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <div style={{ width: 34, height: 3, borderRadius: 2, background: "var(--s3)", overflow: "hidden" }}>
                            <div style={{ width: `${t.followedRules.length / RULES.length * 100}%`, height: "100%", background: t.followedRules.length >= RULES.length * .7 ? C.g : "var(--am)", borderRadius: 2 }} />
                          </div>
                          <span style={{ fontSize: 9, color: "var(--t3)" }}>{`${t.followedRules.length}/${RULES.length}`}</span>
                        </div>
                      </td>
                      <td style={tdStyle()}>
                        {trRev ? <span style={badgeStyle(trRev.grade ? { A: C.g, B: C.a, C: "var(--am)", D: C.r, F: C.r }[trRev.grade as any] || C.g : C.g, trRev.grade ? { A: "var(--gBg)", B: "var(--aBg)", C: "var(--amBg)", D: "var(--rBg)", F: "var(--rBg)" }[trRev.grade as any] || "var(--s2)" : "var(--s2)")}>{trRev.grade || "✓"}</span> : <span style={{ color: "var(--t4)", fontSize: 10 }}>Pending</span>}
                      </td>
                      <td style={tdStyle()}>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button style={btnSmStyle(C.a)} onClick={x => { x.stopPropagation(); setModal({ ...t, id: uid(), date: today() }); }} title="Duplicate trade">⊚</button>
                        <button style={btnSmStyle()} onClick={x => { x.stopPropagation(); setModal(t); }}>✏</button>
                        <button style={btnSmStyle(C.r)} onClick={x => { x.stopPropagation(); del(t.id); }}>×</button>
                      </div>
                    </td>
                  </tr>
                  {exp === t.id && (
                    <tr>
                      <td colSpan={11} style={{ padding: "0 14px 14px", borderBottom: "1px solid var(--b1)", background: "var(--s1)" }}>
                        <div style={{ background: "var(--s2)", borderRadius: 8, padding: 16, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, fontSize: 12, marginTop: 6 }}>
                          <div>
                            <div className="h4" style={{ marginBottom: 8 }}>Details</div>
                            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--t2)", lineHeight: 2 }}>
                              <div>Entry: <span style={{ color: "var(--t1)" }}>{t.entry}</span> → <span style={{ color: t.pnl >= 0 ? C.g : C.r }}>{t.exit}</span></div>
                              <div>{`SL: ${t.sl} | TP: ${t.tp}`}</div>
                              <div>{`Lots: ${t.lots} | ${t.entryWindow}`}</div>
                              {(t.mfe || t.mae) && <div>MFE: <span style={{ color: C.g }}>{fmt(t.mfe || 0)}</span> | MAE: <span style={{ color: C.r }}>{fmt(-Math.abs(t.mae || 0))}</span></div>}
                              {t.timeEntry && <div>{`${t.timeEntry} → ${t.timeClose || "?"} (${fmtDur(tradeDur(t))})`}</div>}
                            </div>
                            {t.tags.length > 0 && <div style={{ marginTop: 8, display: "flex", gap: 4, flexWrap: "wrap" }}>{t.tags.map(tg => <span key={tg} style={badgeStyle(C.a, "var(--aBg)")}>{tg}</span>)}</div>}
                          </div>
                          <div>
                            <div className="h4" style={{ marginBottom: 8 }}>Mental</div>
                            <div style={{ lineHeight: 2, color: "var(--t2)", fontSize: 12 }}>
                              <div>Pre: <span style={{ color: "var(--t1)" }}>{t.mentalPre}</span></div>
                              <div>During: <span style={{ color: "var(--t1)" }}>{t.mentalDuring}</span></div>
                              <div>Post: <span style={{ color: "var(--t1)" }}>{t.mentalPost}</span></div>
                            </div>
                          </div>
                          <div>
                            <div className="h4" style={{ marginBottom: 8 }}>Notes</div>
                            <div style={{ lineHeight: 1.6, color: "var(--t2)" }}>{t.notes || "—"}</div>
                            {t.urls && t.urls.filter(u => u.val).length > 0 && (
                              <div style={{ marginTop: 8, display: "flex", gap: 5, flexWrap: "wrap" }}>
                                {t.urls.filter(u => u.val).map((u, i) => <a key={u.id} href={u.val} target="_blank" rel="noreferrer noopener" referrerPolicy="no-referrer" style={{ color: C.a, fontSize: 11, textDecoration: "none", background: "var(--aBg)", padding: "2px 7px", borderRadius: 4 }}>{`${u.label || `Ref ${i + 1}`} ↗`}</a>)}
                              </div>
                            )}
                            {trRev && (
                              <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--b1)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <div style={{ 
                                      background: trRev.grade ? { A: C.g, B: C.g, C: C.a, D: C.r, F: C.r }[trRev.grade] + '22' : 'var(--s3)',
                                      color: trRev.grade ? { A: C.g, B: C.g, C: C.a, D: C.r, F: C.r }[trRev.grade] : 'var(--t3)',
                                      width: 44, height: 44, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, border: `1px solid ${trRev.grade ? { A: C.g, B: C.g, C: C.a, D: C.r, F: C.r }[trRev.grade] + '44' : 'var(--b1)'}`
                                    }}>
                                      {trRev.grade || "?"}
                                    </div>
                                    <div>
                                      <div className="h4" style={{ color: "var(--t1)", fontSize: 13 }}>Trade Review</div>
                                      <div style={{ fontSize: 10, color: "var(--t3)", textTransform: "uppercase", letterSpacing: ".5px" }}>Performance Analysis</div>
                                    </div>
                                  </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                  <div style={{ display: 'grid', gap: 12 }}>
                                    <div>
                                      <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: "var(--t3)", marginBottom: 4 }}>Execution Quality</div>
                                      <div style={{ fontSize: 12, color: "var(--t2)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{trRev.execution || "No execution details provided."}</div>
                                    </div>
                                    <div>
                                      <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: "var(--t3)", marginBottom: 4 }}>Lessons Learned</div>
                                      <div style={{ fontSize: 12, color: "var(--t2)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{trRev.lesson || "No lessons noted."}</div>
                                    </div>
                                  </div>
                                  <div style={{ display: 'grid', gap: 12 }}>
                                    <div>
                                      <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: "var(--t3)", marginBottom: 4 }}>Emotional State</div>
                                      <div style={{ fontSize: 12, color: "var(--t2)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{trRev.emotion || "—"}</div>
                                    </div>
                                    <div>
                                      <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: "var(--t3)", marginBottom: 4 }}>Hindsight Observations</div>
                                      <div style={{ fontSize: 12, color: "var(--t2)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{trRev.missed || "—"}</div>
                                    </div>
                                    {trRev.mistakes?.length > 0 && (
                                      <div>
                                        <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: C.r, marginBottom: 6 }}>Identified Mistakes</div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                          {trRev.mistakes.map(m => <span key={m} style={badgeStyle(C.r, "var(--rBg)")}>{m}</span>)}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          {t.images?.length > 0 && <TradeImgRow images={t.images} />}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
          </table>
        </div>
      </div>
      {modal && <TradeModal trade={modal} reviews={tradeReviews} onSave={save} onClose={() => setModal(null)} setups={setups} />}
    </div>
  );
}
