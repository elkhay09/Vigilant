/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User } from 'firebase/auth';
import { Profile, RiskSettings } from '../types';
import { btnSmStyle, C, selStyle } from './Common';

interface SidebarProps {
  tab: string;
  setTab: (t: string) => void;
  dark: boolean;
  profile: Profile;
  metrics: any;
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  accountFilter: string;
  setAccountFilter: (s: string) => void;
  accountList: string[];
  lastSaved: string | null;
  saveError: string | null;
  riskSettings: RiskSettings;
  syncing: boolean;
  user: User | null;
  privacyMode: boolean;
  setPrivacyMode: (p: boolean) => void;
}

export function Sidebar({ tab, setTab, dark, profile, collapsed, setCollapsed, accountFilter, setAccountFilter, accountList, lastSaved, saveError, riskSettings, syncing, user, privacyMode, setPrivacyMode }: SidebarProps) {
  const NAV = [
    { id: "dashboard", icon: "◈", l: "Dashboard" },
    { id: "outlook", icon: "◎", l: "Weekly Outlook" },
    { id: "session", icon: "≡", l: "Daily Log" },
    { id: "trades", icon: "↕", l: "Trades" },
    { id: "archive", icon: "⌘", l: "Journal Archive" },
    { id: "psychology", icon: "◑", l: "Psychology" },
    { id: "playbook", icon: "◆", l: "Playbook" },
    { id: "risk", icon: "⬡", l: "Risk" },
    { id: "stats", icon: "▦", l: "Stats" },
    { id: "void", icon: "∅", l: "The Void" }
  ];

  const QUICK_LINKS = [
    { name: "Forex Factory", url: "https://www.forexfactory.com/calendar" },
    { name: "Earnings Hub", url: "https://www.google.com/search?q=earnings+calendar" },
    { name: "Financial Juice", url: "https://www.financialjuice.com" },
    { name: "TradingView", url: "https://www.tradingview.com" }
  ];

  const BRAND = { name: "Vigilant", tagline: "Trade Journal" };

  return (
    <div style={{ 
      width: collapsed ? 70 : "220px", 
      background: "var(--sb)", 
      borderRight: `1px solid var(--sbBorder)`, 
      display: "flex", 
      flexDirection: "column", 
      height: "100%", 
      transition: "width .2s ease",
      position: 'relative',
      zIndex: 100
    }}>
      {/* Header */}
      <div style={{ padding: "20px 16px 12px", borderBottom: `1px solid var(--sbBorder)` }}>
        <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", marginBottom: collapsed ? 0 : 20 }}>
          <div 
            onClick={() => setTab("dashboard")} 
            style={{ 
              width: 38, 
              height: 38, 
              borderRadius: 10, 
              background: "var(--s3)", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              boxShadow: "0 8px 24px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.05)",
              cursor: 'pointer',
              position: 'relative'
            }}
          >
            {/* Geometric V Logo - Professional Psychologist Theme */}
            <svg width="28" height="28" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="vGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#10b981" />
                  <stop offset="1" stopColor="#3b82f6" />
                </linearGradient>
                <filter id="shadow" x="0" y="0" width="100%" height="100%">
                  <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.3"/>
                </filter>
              </defs>
              <rect width="40" height="40" rx="10" fill="var(--s1)" />
              <path 
                d="M12 12 L20 28 L28 12" 
                stroke="url(#vGrad)" 
                strokeWidth="4" 
                strokeLinecap="round"
                strokeLinejoin="round" 
                filter="url(#shadow)"
              />
              <circle cx="20" cy="20" r="16" stroke="var(--b1)" strokeWidth="1" strokeDasharray="2 3" opacity="0.3" />
            </svg>
          </div>
          
          {!collapsed && (
            <div style={{ flex: 1, marginLeft: 12 }}>
              <div style={{ 
                fontSize: 18, 
                fontWeight: 800, 
                color: "var(--sbT)", 
                letterSpacing: "-0.5px", 
                lineHeight: 1.1 
              }}>{BRAND.name}</div>
              <div onClick={() => setTab("dashboard")} style={{ fontSize: 11, color: "var(--sbT3)", cursor: 'pointer', marginTop: 2 }}>{BRAND.tagline}</div>
            </div>
          )}

          <button 
            onClick={() => setCollapsed(!collapsed)}
            style={{ 
              background: 'var(--s2)', 
              border: '1px solid var(--b1)', 
              borderRadius: 6, 
              padding: '4px 6px', 
              color: 'var(--t3)', 
              cursor: 'pointer',
              fontSize: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 4
            }}
          >
            {collapsed ? "»" : "«"}
          </button>
        </div>

        <div style={{ marginTop: 8, display: 'flex', gap: 6, justifyContent: collapsed ? 'center' : 'flex-end' }}>
        </div>

        {!collapsed && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6 }}>Account Filter</div>
            <select 
              value={accountFilter}
              onChange={e => setAccountFilter(e.target.value)}
              style={{ ...selStyle(), fontSize: 12, padding: '7px 10px', height: 'auto', background: 'var(--s1)' }}
            >
              <option value="All">All Accounts</option>
              {accountList.map(a => a !== "All" && <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav style={{ flex: 1, padding: "12px 0", overflowY: 'auto' }}>
        {NAV.map(item => (
          <button 
            key={item.id} 
            onClick={() => setTab(item.id)} 
            style={{ 
              display: "flex", 
              alignItems: "center", 
              justifyContent: collapsed ? "center" : "flex-start", 
              gap: 12, 
              width: "100%", 
              padding: collapsed ? "12px 8px" : "10px 16px", 
              background: tab === item.id ? "var(--sbActive)" : "none", 
              border: "none", 
              borderLeft: tab === item.id ? `3px solid var(--g)` : "3px solid transparent", 
              color: tab === item.id ? "var(--g)" : "var(--sbT2)", 
              fontSize: 13, 
              fontWeight: tab === item.id ? 700 : 500, 
              cursor: "pointer",
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ width: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: 16, opacity: tab === item.id ? 1 : 0.7 }}>{item.icon}</div>
            {!collapsed && <span>{item.l}</span>}
          </button>
        ))}

        {!collapsed && (
          <div style={{ marginTop: 24, padding: '0 16px' }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12, borderBottom: '1px solid var(--sbBorder)', paddingBottom: 6 }}>Quick Links</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {QUICK_LINKS.map((link, idx) => (
                <a 
                  key={link.name} 
                  href={link.url} 
                  target="_blank" 
                  rel="noreferrer noopener"
                  referrerPolicy="no-referrer"
                  style={{ 
                    fontSize: 12, 
                    color: 'var(--sbT2)', 
                    textDecoration: 'none', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8,
                    opacity: 0.8
                  }}
                  onMouseOver={e => e.currentTarget.style.color = 'var(--a)'}
                  onMouseOut={e => e.currentTarget.style.color = 'var(--sbT2)'}
                  title={`Alt + ${idx + 1}`}
                >
                  <span style={{ fontSize: 10 }}>↗</span> 
                  <span>{link.name}</span>
                  <span style={{ fontSize: 9, opacity: 0.5, marginLeft: 'auto', background: 'var(--s3)', padding: '0 4px', borderRadius: 3 }}>⌥{idx + 1}</span>
                </a>
              ))}
            </div>

            <div style={{ marginTop: 24, borderTop: '1px solid var(--sbBorder)', paddingTop: 16 }}>
              <button 
                onClick={() => setPrivacyMode(!privacyMode)}
                style={{ 
                  width: '100%',
                  background: privacyMode ? 'var(--a)15' : 'var(--s2)',
                  border: `1px solid ${privacyMode ? 'var(--a)30' : 'var(--b1)'}`,
                  padding: collapsed ? "8px" : "8px 12px",
                  borderRadius: 8,
                  fontSize: 10,
                  fontWeight: 700,
                  color: privacyMode ? 'var(--a)' : 'var(--t3)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.2s',
                  justifyContent: collapsed ? 'center' : 'flex-start'
                }}
              >
                <span>{privacyMode ? "🔒" : "🔓"}</span>
                {!collapsed && <span>{privacyMode ? "PRIVACY ON" : "PUBLIC VIEW"}</span>}
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div style={{ borderTop: `1px solid var(--sbBorder)`, padding: collapsed ? "12px 8px" : "12px 14px" }}>
        {!collapsed && (
          <div style={{ marginBottom: 12 }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: C.g, marginBottom: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.g }}></span>
                Saved {lastSaved ? lastSaved : '—'}
             </div>
             {user && (
               <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: syncing ? 'var(--a)' : C.g, marginBottom: 4 }}>
                 <span style={{ fontSize: 10 }}>{syncing ? '↻' : '☁'}</span> 
                 {syncing ? 'Cloud Syncing...' : 'Cloud Synced'}
               </div>
             )}
             <div style={{ fontSize: 10, color: 'var(--t3)', lineHeight: 1.4, padding: '8px', background: 'var(--s2)', borderRadius: 6 }}>
               Shortcuts: N new · 0-9 tabs · ⌥1-4 links
             </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between' }}>
          <div 
            onClick={() => setTab("settings")} 
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 10, 
              cursor: "pointer", 
              background: "none",
              flex: 1
            }}
          >
            {profile.avatar ? (
              <img src={profile.avatar} style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", border: '1px solid var(--b1)' }} />
            ) : (
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg,var(--g),var(--a))`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>
                {(profile.name || "T").slice(0, 1).toUpperCase()}
              </div>
            )}
            {!collapsed && (
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--sbT)" }}>{profile.name}</div>
                <div style={{ fontSize: 10, color: "var(--sbT3)" }}>{dark ? "Dark mode" : "Light mode"}</div>
              </div>
            )}
          </div>
          
          {!collapsed && (
            <button 
              onClick={() => setTab("settings")}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: 'var(--t4)', 
                cursor: 'pointer',
                fontSize: 14,
                padding: 4
              }}
            >
              ⚙
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
