/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { QUOTES } from '../constants';
import { Trade } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const uid = () => Math.random().toString(36).slice(2, 10);

export const today = () => new Date().toISOString().split("T")[0];

export const fmt = (n: number | undefined | null) => {
  if (n === undefined || n === null || isNaN(n)) return "$0";
  const a = Math.abs(Number(n));
  const s = a >= 1000 ? `$${(a / 1000).toFixed(1)}k` : `$${a.toLocaleString("en", { minimumFractionDigits: 0, maximumFractionDigits: 1 })}`;
  return n < 0 ? `-${s}` : s;
};

export const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

export const tMins = (t: string | undefined) => {
  if (!t) return 0;
  const [h, m] = (t || "").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

export const tradeDur = (t: Partial<Trade>) => {
  if (t.timeEntry && t.timeClose) {
    return Math.abs(tMins(t.timeClose) - tMins(t.timeEntry));
  }
  return 0;
};

export const fmtDur = (m: number | undefined) => {
  if (!m || m <= 0) return "—";
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
};

export const getDQ = () => {
  const d = new Date();
  return QUOTES[(d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate()) % QUOTES.length];
};

export const computeMetrics = (trades: Trade[]) => {
  const empty = { 
    winRate: 0, 
    totalPnl: 0, 
    profitFactor: 0, 
    maxDD: 0, 
    totalTrades: 0, 
    wins: 0, 
    losses: 0, 
    recoveryFactor: 0, 
    avgWin: 0, 
    avgLoss: 0, 
    expectancy: 0, 
    avgRR: 0, 
    bestStreak: 0, 
    worstStreak: 0, 
    currentStreak: 0, 
    avgDuration: 0,
    largestWin: 0,
    largestLoss: 0,
    avgWinDuration: 0,
    avgLossDuration: 0,
    sqn: 0,
    sharpe: 0,
    stdDev: 0,
    payoffRatio: 0,
    beTrades: 0,
    avgDailyVolume: 0,
    bestMonth: { name: "", pnl: 0 },
    lowestMonth: { name: "", pnl: 0 },
    avgMonthlyPnl: 0
  };
  if (!trades.length) return empty;
  const s = [...trades].sort((a, b) => a.date.localeCompare(b.date));
  const ws = s.filter(t => t.pnl > 0), ls = s.filter(t => t.pnl < 0), bes = s.filter(t => t.pnl === 0);
  const tp = s.reduce((a, t) => a + t.pnl, 0);
  const gp = ws.reduce((a, t) => a + t.pnl, 0), gl = Math.abs(ls.reduce((a, t) => a + t.pnl, 0));
  const pf = gl > 0 ? gp / gl : gp > 0 ? 99 : 0;
  let peak = 0, maxDD = 0, cum = 0; s.forEach(t => { cum += t.pnl; if (cum > peak) peak = cum; const dd = peak - cum; if (dd > maxDD) maxDD = dd; });
  const aw = ws.length ? gp / ws.length : 0, al = ls.length ? gl / ls.length : 0;
  const wr = ws.length / s.length, ex = wr * aw - (1 - wr) * al;
  const ar = s.length ? s.reduce((a, t) => a + t.rr, 0) / s.length : 0;
  let best = 0, worst = 0, cur = 0; s.forEach(t => { if (t.pnl > 0) cur = cur > 0 ? cur + 1 : 1; else if (t.pnl < 0) cur = cur < 0 ? cur - 1 : -1; else cur = 0; if (cur > best) best = cur; if (Math.abs(cur) > worst && cur < 0) worst = Math.abs(cur); });
  const dt = s.filter(t => t.timeEntry && t.timeClose);
  const ad = dt.length ? Math.round(dt.reduce((a, t) => a + tradeDur(t), 0) / dt.length) : 0;
  
  const wdt = dt.filter(t => t.pnl > 0);
  const ldt = dt.filter(t => t.pnl < 0);
  const awd = wdt.length ? Math.round(wdt.reduce((a, t) => a + tradeDur(t), 0) / wdt.length) : 0;
  const ald = ldt.length ? Math.round(ldt.reduce((a, t) => a + tradeDur(t), 0) / ldt.length) : 0;

  const largestWin = ws.length ? Math.max(...ws.map(t => t.pnl)) : 0;
  const largestLoss = ls.length ? Math.min(...ls.map(t => t.pnl)) : 0;
  
  const avgPnl = tp / s.length;
  const variance = s.reduce((a, t) => a + Math.pow(t.pnl - avgPnl, 2), 0) / s.length;
  const stdDev = Math.sqrt(variance);
  const sqn = stdDev > 0 ? (avgPnl / stdDev) * Math.sqrt(s.length) : 0;
  const sharpe = stdDev > 0 ? avgPnl / stdDev : 0;

  // Monthly stats
  const months: Record<string, number> = {};
  s.forEach(t => {
    const m = t.date.slice(0, 7);
    months[m] = (months[m] || 0) + t.pnl;
  });
  const mList = Object.entries(months).map(([name, pnl]) => ({ name, pnl }));
  const bestM = mList.length ? mList.reduce((a, b) => b.pnl > a.pnl ? b : a) : { name: "", pnl: 0 };
  const worstM = mList.length ? mList.reduce((a, b) => b.pnl < a.pnl ? b : a) : { name: "", pnl: 0 };
  const avgMonthly = mList.length ? tp / mList.length : 0;

  // Daily Volume
  const daysCont = new Set(s.map(t => t.date)).size;
  const avgDailyVol = daysCont ? s.length / daysCont : 0;

  return { 
    ...empty, 
    winRate: wr, 
    totalPnl: tp, 
    profitFactor: Math.min(pf, 99), 
    maxDD, 
    totalTrades: s.length, 
    wins: ws.length, 
    losses: ls.length, 
    beTrades: bes.length,
    recoveryFactor: maxDD > 0 ? tp / maxDD : 0, 
    avgWin: aw, 
    avgLoss: al, 
    expectancy: ex, 
    avgRR: ar, 
    bestStreak: best, 
    worstStreak: worst, 
    currentStreak: cur, 
    avgDuration: ad,
    avgWinDuration: awd,
    avgLossDuration: ald,
    largestWin,
    largestLoss,
    sqn,
    sharpe,
    stdDev,
    payoffRatio: al > 0 ? aw / al : 0,
    avgDailyVolume: avgDailyVol,
    bestMonth: bestM,
    lowestMonth: worstM,
    avgMonthlyPnl: avgMonthly
  };
};

export const store = {
  get: (k: string) => {
    try {
      const v = localStorage.getItem('tj11_' + k);
      return v ? JSON.parse(v) : null;
    } catch {
      return null;
    }
  },
  set: (k: string, v: any) => {
    try {
      localStorage.setItem('tj11_' + k, JSON.stringify(v));
    } catch (err: any) {
      console.warn('localStorage cache write failed (quota):', k, err.message);
    }
  }
};

const escHtml = (s: string) => (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
export const renderMd = (text: string) => {
  if (!text) return "";
  const lines = escHtml(text).split("\n");
  const out = []; let inList = false;
  for (const line of lines) {
    if (/^\s*-\s+/.test(line)) { if (!inList) { out.push("<ul>"); inList = true; } out.push("<li>" + line.replace(/^\s*-\s+/, "") + "</li>"); continue; }
    if (inList) { out.push("</ul>"); inList = false; }
    if (/^###\s+/.test(line)) { out.push("<h3>" + line.replace(/^###\s+/, "") + "</h3>"); continue; }
    if (/^##\s+/.test(line)) { out.push("<h2>" + line.replace(/^##\s+/, "") + "</h2>"); continue; }
    if (/^#\s+/.test(line)) { out.push("<h1>" + line.replace(/^#\s+/, "") + "</h1>"); continue; }
    if (line.trim() === "") out.push("<br/>");
    else out.push("<p>" + line + "</p>");
  }
  if (inList) out.push("</ul>");
  return out.join("").replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>").replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, "<em>$1</em>");
};

export const draftKey = (name: string) => `draft_${name}`;
export const saveDraft = (name: string, data: any) => store.set(draftKey(name), data);
export const loadDraft = (name: string) => store.get(draftKey(name));
export const clearDraft = (name: string) => { try { localStorage.removeItem('tj11_' + draftKey(name)); } catch { } };
