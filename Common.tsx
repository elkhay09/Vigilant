/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { fmt, fmtDur, renderMd, tradeDur, uid } from '../lib/utils';
import { Attachment, Trade, UrlReference } from '../types';

export const C = {
  get bg() { return 'var(--bg)'; },
  get s1() { return 'var(--s1)'; },
  get s2() { return 'var(--s2)'; },
  get s3() { return 'var(--s3)'; },
  get b1() { return 'var(--b1)'; },
  get b2() { return 'var(--b2)'; },
  get b3() { return 'var(--b3)'; },
  get t1() { return 'var(--t1)'; },
  get t2() { return 'var(--t2)'; },
  get t3() { return 'var(--t3)'; },
  get g() { return 'var(--g)'; },
  get gBg() { return 'var(--gBg)'; },
  get gB() { return 'var(--gB)'; },
  get r() { return 'var(--r)'; },
  get rBg() { return 'var(--rBg)'; },
  get rB() { return 'var(--rB)'; },
  get a() { return 'var(--a)'; },
  get aBg() { return 'var(--aBg)'; },
  get aB() { return 'var(--aB)'; },
  get am() { return 'var(--am)'; },
  get amBg() { return 'var(--amBg)'; },
};

export function Stat({ label, value, color, sub }: { label: string; value: string | number; color?: string; sub?: string }) {
  return (
    <div className="card-sm" style={{ background: "var(--s1)", borderRadius: 8, border: "1px solid var(--b1)", padding: "14px 16px", color: "var(--t1)" }}>
      <div className="h4" style={{ marginBottom: 6 }}>{label}</div>
      <div className="mono fade-in" style={{ fontSize: 22, fontWeight: 700, color: color || "var(--t1)", letterSpacing: "-.5px", lineHeight: 1.2 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export function MiniStat({ label, value, color, sub }: { label: string; value: string | number; color?: string; sub?: string }) {
  return (
    <div style={{ background: "var(--s1)", borderRadius: 8, border: "1px solid var(--b1)", padding: "10px 14px", color: "var(--t1)" }}>
      <div className="h4" style={{ marginBottom: 4 }}>{label}</div>
      <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: color || "var(--t1)" }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: "var(--t3)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 10, fontWeight: 600, color: "var(--t3)", marginBottom: 5, display: "block", textTransform: "uppercase", letterSpacing: ".7px" }}>{label}</label>
      {children}
    </div>
  );
}

export function EmptyState({ icon, title, sub }: { icon?: string; title: string; sub?: string }) {
  return (
    <div style={{ background: "var(--s1)", borderRadius: 8, padding: 60, textAlign: "center", border: "1px dashed var(--b2)" }}>
      <div style={{ fontSize: 32, marginBottom: 12, opacity: .3 }}>{icon || "○"}</div>
      <div className="h3" style={{ marginBottom: 6, color: "var(--t2)" }}>{title}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--t3)", maxWidth: 300, margin: "0 auto", lineHeight: 1.6 }}>{sub}</div>}
    </div>
  );
}

export function MdView({ text, style }: { text?: string; style?: React.CSSProperties }) {
  if (!text) return null;
  return (
    <div className="md-view" style={{ lineHeight: 1.6, ...style }} dangerouslySetInnerHTML={{ __html: renderMd(text) }} />
  );
}

export function ModalPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? createPortal(children, document.body) : null;
}

export function ImageLightbox({ img, onClose }: { img: Attachment; onClose: () => void }) {
  useEffect(() => {
    const h = (ev: KeyboardEvent) => { if (ev.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <ModalPortal>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.92)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, cursor: "zoom-out", backdropFilter: "blur(4px)" }}>
        <div style={{ position: "absolute", top: 16, right: 20, display: "flex", gap: 8 }}>
          <a href={img.data} download={img.name || "screenshot.png"} onClick={ev => ev.stopPropagation()} style={{ background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.2)", borderRadius: 6, padding: "6px 14px", color: "#fff", fontSize: 12, textDecoration: "none" }}>↓ Download</a>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.2)", borderRadius: 6, padding: "6px 14px", color: "#fff", fontSize: 12, cursor: "pointer" }}>× Close</button>
        </div>
        <img src={img.data} alt={img.name} onClick={ev => ev.stopPropagation()} style={{ maxWidth: "90vw", maxHeight: "82vh", objectFit: "contain", borderRadius: 8, boxShadow: "0 24px 80px rgba(0,0,0,.8)", cursor: "default" }} />
        <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)" }}>{img.name || "Screenshot"}</div>
      </div>
    </ModalPortal>
  );
}

export function TradeImgRow({ images }: { images: Attachment[] }) {
  const [lb, setLb] = useState<Attachment | null>(null);
  return (
    <div style={{ gridColumn: "1/-1" }}>
      <div className="h4" style={{ marginBottom: 8 }}>Screenshots</div>
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
        {images.map(img => (
          <img key={img.id} src={img.data} alt={img.name} title="Click to enlarge" onClick={() => setLb(img)} style={{ height: 76, borderRadius: 6, border: "1px solid var(--b1)", objectFit: "cover", cursor: "zoom-in" }} />
        ))}
      </div>
      {lb && <ImageLightbox img={lb} onClose={() => setLb(null)} />}
    </div>
  );
}

export const cardStyle = (): React.CSSProperties => ({ background: "var(--s1)", borderRadius: 8, border: "1px solid var(--b1)", padding: 20, color: "var(--t1)" });
export const cardSmStyle = (): React.CSSProperties => ({ background: "var(--s1)", borderRadius: 8, border: "1px solid var(--b1)", padding: "14px 16px", color: "var(--t1)" });
export const inpStyle = (): React.CSSProperties => ({ background: "var(--s2)", border: "1px solid var(--b1)", borderRadius: 6, padding: "8px 12px", color: "var(--t1)", fontSize: 13, outline: "none", width: "100%" });
export const selStyle = (): React.CSSProperties => ({ background: "var(--s2)", border: "1px solid var(--b1)", borderRadius: 6, padding: "8px 12px", color: "var(--t1)", fontSize: 13, outline: "none", width: "100%" });
export const taStyle = (): React.CSSProperties => ({ background: "var(--s2)", border: "1px solid var(--b1)", borderRadius: 6, padding: "10px 12px", color: "var(--t1)", fontSize: 13, outline: "none", width: "100%", minHeight: 64, resize: "vertical" as const, lineHeight: 1.5 });
export const btnStyle = (p?: boolean, d?: boolean): React.CSSProperties => {
  if (d) return { padding: "7px 16px", borderRadius: 6, border: "1px solid var(--rB)", cursor: "pointer", fontSize: 12, fontWeight: 600, background: "var(--rBg)", color: "var(--r)" };
  if (p) return { padding: "7px 16px", borderRadius: 6, border: "1px solid var(--gB)", cursor: "pointer", fontSize: 12, fontWeight: 600, background: "var(--gBg)", color: "var(--g)" };
  return { padding: "7px 16px", borderRadius: 6, border: "1px solid var(--b1)", cursor: "pointer", fontSize: 12, fontWeight: 600, background: "var(--s2)", color: "var(--t1)" };
};
export const btnSmStyle = (c?: string): React.CSSProperties => ({ padding: "4px 10px", borderRadius: 5, border: `1px solid ${c ? c + '33' : "var(--b1)"}`, cursor: "pointer", fontSize: 11, fontWeight: 500, background: c ? `${c}15` : "var(--s2)", color: c || "var(--t2)" });
export const badgeStyle = (c: string, bg: string): React.CSSProperties => ({ display: "inline-flex", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, color: c, background: bg, whiteSpace: "nowrap" });
export const lblStyle = (): React.CSSProperties => ({ fontSize: 10, fontWeight: 600, color: "var(--t3)", marginBottom: 5, display: "block", textTransform: "uppercase", letterSpacing: ".7px" });
export const thStyle = (): React.CSSProperties => ({ padding: "8px 12px", textAlign: "left" as const, fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: ".6px", color: "var(--t3)", borderBottom: "1px solid var(--b1)", background: "var(--s2)", whiteSpace: "nowrap" });
export const tdStyle = (): React.CSSProperties => ({ padding: "10px 12px", borderBottom: "1px solid var(--b1)", verticalAlign: "middle", color: "var(--t1)" });
export const ovStyle = (): React.CSSProperties => ({ position: "fixed", inset: 0, background: "rgba(3,10,18,.72)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, backdropFilter: "blur(3px)", padding: 22, overflow: "auto" });
export const modalStyle = (): React.CSSProperties => ({ background: "var(--s1)", borderRadius: 14, border: "1px solid var(--b2)", padding: 20, width: "min(1320px,92vw)", maxHeight: "92vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,.45)", color: "var(--t1)", margin: "0 auto" });
export const gridStyle = (cols: number, gap: number = 14): React.CSSProperties => ({ display: "grid", gridTemplateColumns: `repeat(${cols},1fr)`, gap });

export function PrivacyValue({ value, privacyMode, format = "fmt" }: { value: any; privacyMode: boolean; format?: "fmt" | "pct" | "none" }) {
  if (privacyMode) return <span style={{ opacity: 0.6, letterSpacing: 1.5, fontSize: "0.9em" }}>●●●</span>;
  if (format === "fmt" && typeof value === "number") return <span>{fmt(value)}</span>;
  if (format === "pct" && typeof value === "number") return <span>{(value * 100).toFixed(1)}%</span>;
  return <span>{value}</span>;
}
