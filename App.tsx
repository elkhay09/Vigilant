/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Session } from './components/Session';
import { TradesDB } from './components/Trades';
import { Archive } from './components/Archive';
import { Psychology } from './components/Psychology';
import { Playbook } from './components/Playbook';
import { Risk } from './components/Risk';
import { Stats } from './components/Stats';
import { TheVoid } from './components/TheVoid';
import { Settings } from './components/Settings';
import { Outlook } from './components/Outlook';
import { TradeModal } from './components/Modals';
import { CommandBar } from './components/CommandBar';
import { Landing } from './components/Landing';
import { AccessDenied } from './components/AccessDenied';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { onSnapshot, doc, collection } from 'firebase/firestore';
import { syncToCloud, fetchFromCloud, checkAuthorization } from './services/firebaseService';
import { SESSIONS, DEFAULT_TRADES } from './constants';
import { idb } from './lib/idb';
import { store, computeMetrics, today, uid } from './lib/utils';
import { Trade, SessionReview, WeeklyOutlook, PlaybookSetup, Mistake, TradeReview, RiskSettings, Profile, DeletedItem } from './types';

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [trades, setTrades] = useState<Trade[]>(DEFAULT_TRADES as Trade[]);
  const [reviews, setReviews] = useState<SessionReview[]>([]);
  const [outlooks, setOutlooks] = useState<WeeklyOutlook[]>([]);
  const [setups, setSetups] = useState<PlaybookSetup[]>([]);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [tradeReviews, setTradeReviews] = useState<TradeReview[]>([]);
  const [premarkets, setPremarkets] = useState<any[]>([]);
  const [riskSettings, setRiskSettings] = useState<RiskSettings>({ 
    dailyLimit: 1000, 
    weeklyLimit: 3000, 
    maxTrades: 3,
    nonNegotiables: [
      { id: '1', text: 'Stop trading after 3 losses (Daily Cap).' },
      { id: '2', text: 'Max 3 trades per session.' },
      { id: '3', text: 'Walk away after reaching daily loss limit.' },
      { id: '4', text: 'No revenge trading under any circumstances.' },
      { id: '5', text: 'Follow your playbook setup rules.' },
      { id: '6', text: 'Wait for high-probability confirmation.' }
    ]
  });
  const [profile, setProfile] = useState<Profile>({ name: "Aya" });
  const [dark, setDark] = useState(() => localStorage.getItem('tj_theme') !== "light");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => store.get("sidebarCollapsed") || (typeof window !== "undefined" && window.innerWidth < 800));
  const [accountFilter, setAccountFilter] = useState(() => store.get("accountFilter") || "All");
  const [privacyMode, setPrivacyMode] = useState(() => store.get("privacyMode") || false);
  const [deletedItems, setDeletedItems] = useState<DeletedItem[]>([]);
  const [quickTradeModal, setQuickTradeModal] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  
  const saveTimer = useRef<any>(null);
  const idbLoaded = useRef(false);
  const initialSyncDone = useRef<Record<string, boolean>>({});
  const isDirty = useRef(false);

  const mergeData = (local: any[], cloud: any[]) => {
    if (!cloud) return local;
    // Track what we've explicitly deleted so we don't let it "respawn" from a stale cloud snapshot
    const deletedIds = new Set(deletedItems.map(d => d.data?.id).filter(Boolean));
    const map = new Map();
    
    // Seed with local state
    (local || []).forEach(i => { 
      if (i?.id && !deletedIds.has(i.id)) map.set(i.id, i); 
    });

    // Merge in cloud data
    (cloud || []).forEach(i => {
      if (!i?.id || deletedIds.has(i.id)) return;
      
      const existing = map.get(i.id);
      if (!existing) {
        map.set(i.id, i);
      } else {
        const lTime = new Date(existing.updatedAt || 0).getTime();
        const cTime = new Date(i.updatedAt || 0).getTime();
        if (cTime > lTime) map.set(i.id, i);
      }
    });

    return Array.from(map.values());
  };

  const forceSync = async () => {
    if (!user || !isAuthorized) return;
    setSyncing(true);
    setSaveError(null);
    try {
      const cloudData = await fetchFromCloud(user.uid);
      if (cloudData) {
        const m = mergeData;
        setTrades(p => m(p, cloudData.trades || []));
        setReviews(p => m(p, cloudData.reviews || []));
        setOutlooks(p => m(p, cloudData.outlooks || []));
        setSetups(p => m(p, cloudData.setups || []));
        setMistakes(p => m(p, cloudData.mistakes || []));
        setTradeReviews(p => m(p, cloudData.tradeReviews || []));
        setPremarkets(p => m(p, cloudData.premarkets || []));
        if (cloudData.riskSettings) setRiskSettings(cloudData.riskSettings);
        if (cloudData.profile) setProfile(p => ({ ...p, ...cloudData.profile }));
      }
      isDirty.current = true;
      setLastSaved(`Synced ${new Date().toLocaleTimeString()}`);
    } catch (e) {
      console.error("Force sync failed:", e);
      setSaveError("Force sync failed");
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    let unsubs: (() => void)[] = [];

    async function init() {
      // 1. Load from IDB first
      try {
        const data = await idb.get("journal");
        if (data) {
          // If the user has substantial data, use it. 
          // If they only have 1 trade and it's the "1000 pnl" one, we prefer our new defaults for the preview.
          const isPlaceholder = data.trades && data.trades.length === 1 && data.trades[0].pnl === 1000;
          
          if (data.trades && !isPlaceholder) setTrades(data.trades);
          if (data.reviews) setReviews(data.reviews);
          if (data.outlooks) setOutlooks(data.outlooks);
          if (data.setups) setSetups(data.setups);
          if (data.mistakes) setMistakes(data.mistakes);
          if (data.tradeReviews) setTradeReviews(data.tradeReviews);
          if (data.premarkets) setPremarkets(data.premarkets);
          if (data.riskSettings) setRiskSettings(data.riskSettings);
          if (data.profile) setProfile(data.profile);
          if (data.deletedItems) setDeletedItems(data.deletedItems);
        } else {
          // Initial seed if first time
          setTrades(DEFAULT_TRADES as Trade[]);
        }
      } catch (err) {
        console.warn("IDB init error", err);
      } finally {
        idbLoaded.current = true;
      }

        // 2. Auth listener
        onAuthStateChanged(auth, async (u) => {
          unsubs.forEach(fn => fn());
          unsubs = [];
          
          // Reset sync markers for new user session
          initialSyncDone.current = {};
          isDirty.current = false;
          
          setUser(u);

        if (!u) {
          setIsAuthorized(null);
          setAuthReady(true);
          return;
        }

        try {
          const authorized = await checkAuthorization(u.email);
          setIsAuthorized(authorized);
          if (!authorized) {
            setAuthReady(true);
            return;
          }
        } catch (e) {
          console.error("Auth check failed", e);
          setIsAuthorized(false);
          setAuthReady(true);
          return;
        }

        if (u.displayName && (profile.name === "Trader" || !profile.name)) {
          setProfile(p => ({ ...p, name: u.displayName?.split(' ')[0] || "Trader" }));
        }

        const uSnap = onSnapshot(doc(db, 'users', u.uid), (snap) => {
          if (!snap.exists() || snap.metadata.hasPendingWrites) return;
          const d = snap.data();
          if (d.profile) setProfile(p => ({ ...p, ...d.profile }));
          if (d.riskSettings) setRiskSettings(d.riskSettings);
        });
        unsubs.push(uSnap);

        const cols = ['trades', 'reviews', 'mistakes', 'outlooks', 'setups', 'tradeReviews', 'premarkets'];
        cols.forEach(col => {
          const unsub = onSnapshot(collection(db, 'users', u.uid, col), (snap) => {
            if (snap.metadata.hasPendingWrites) return;
            const cloudItems = snap.docs.map(doc => doc.data());

            // Always reconcile and merge. This ensures local deletions aren't resurrected
            // by stale cloud snapshots during the sync window.
            const reconcile = (local: any[]) => {
              const merged = mergeData(local, cloudItems);
              // If we find new stuff in the cloud that we didn't have locally (and wasn't deleted),
              // we don't necessarily need to mark as dirty, but we want the items.
              // However, if we HAVE items locally that aren't in the cloud yet, we ARE dirty.
              if (!initialSyncDone.current[col]) {
                if (merged.length > cloudItems.length) isDirty.current = true;
              }
              return merged;
            };

            if (col === 'trades') {
              const isPlaceholder = cloudItems.length === 1 && cloudItems[0].pnl === 1000;
              if (isPlaceholder) return; // Ignore the single trade placeholder from cloud
              setTrades(p => reconcile(p));
            }
            if (col === 'reviews') setReviews(p => reconcile(p));
            if (col === 'outlooks') setOutlooks(p => reconcile(p));
            if (col === 'setups') setSetups(p => reconcile(p));
            if (col === 'mistakes') setMistakes(p => reconcile(p));
            if (col === 'tradeReviews') setTradeReviews(p => reconcile(p));
            if (col === 'premarkets') setPremarkets(p => reconcile(p));
            
            initialSyncDone.current[col] = true;
          });
          unsubs.push(unsub);
        });

        setAuthReady(true);
      });
    }

    init();

    return () => unsubs.forEach(fn => fn());
  }, []);

  useEffect(() => {
    if (!idbLoaded.current) return;
    if (user && isAuthorized === false) return;

    // 1. Immediate local save to IDB (Reliability)
    if (!idbLoaded.current) return;
    
    // Core collections that MUST be synced before we consider the app "ready"
    const coreCols = ['trades', 'reviews', 'mistakes', 'outlooks', 'setups', 'tradeReviews', 'premarkets'];
    const allReady = user ? coreCols.every(c => initialSyncDone.current[c]) : true;
    
    // CRITICAL: Do not save back to IDB or Cloud if we haven't finished initial syncing.
    // This prevents overwriting existing data with a partial or empty state during startup.
    if (!allReady && !isDirty.current) return;

    const blob = { trades, reviews, outlooks, setups, mistakes, premarkets, tradeReviews, riskSettings, profile, deletedItems, savedAt: new Date().toISOString() };
    idb.set("journal", blob).then(() => {
      setLastSaved(new Date().toLocaleTimeString());
      setSaveError(null);
    }).catch(err => console.error("IDB Save Error:", err));

    store.set("trades", trades); store.set("reviews", reviews); store.set("outlooks", outlooks);
    store.set("setups", setups); store.set("mistakes", mistakes); store.set("premarkets", premarkets);
    store.set("tradeReviews", tradeReviews); store.set("riskSettings", riskSettings); store.set("profile", profile);

    // 2. Debounced Cloud Sync
    if (saveTimer.current) clearTimeout(saveTimer.current);
    
    if (user && allReady && isDirty.current) {
      saveTimer.current = setTimeout(() => {
        setSyncing(true);
        syncToCloud(user.uid, blob)
          .then(() => {
            isDirty.current = false;
            if (deletedItems.length > 0) {
              setDeletedItems(p => p.length === deletedItems.length ? [] : p);
            }
          })
          .catch(err => {
            console.error("Cloud Sync Error:", err);
            setSaveError("Sync failed! Check connection.");
          })
          .finally(() => setSyncing(false));
      }, 3000); // 3s debounce for cloud
    }

    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [trades, reviews, outlooks, setups, mistakes, premarkets, tradeReviews, riskSettings, profile, deletedItems, user]);

  useEffect(() => { store.set("accountFilter", accountFilter); }, [accountFilter]);
  useEffect(() => { store.set("sidebarCollapsed", sidebarCollapsed); }, [sidebarCollapsed]);
  useEffect(() => { store.set("privacyMode", privacyMode); }, [privacyMode]);
  useEffect(() => { document.body.className = dark ? "" : "light"; localStorage.setItem('tj_theme', dark ? "dark" : "light"); }, [dark]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const keyMap: Record<string, string> = {
        '1': 'dashboard', '2': 'outlook', '3': 'session', '4': 'trades',
        '5': 'archive', '6': 'psychology', '7': 'playbook', '8': 'risk', '9': 'stats', '0': 'settings',
        'v': 'void'
      };
      if (e.key === 'n' || e.key === 'N') { setTab("session"); setQuickTradeModal("new"); return; }
      if (keyMap[e.key] && !e.altKey && !e.ctrlKey && !e.metaKey) setTab(keyMap[e.key]);
      if (e.altKey) {
        const links = ["https://www.forexfactory.com/calendar", "https://www.google.com/search?q=earnings+calendar", "https://www.financialjuice.com", "https://www.tradingview.com"];
        const idx = parseInt(e.key) - 1;
        if (links[idx]) window.open(links[idx], '_blank');
      }
    };
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty.current) {
        const blob = { trades, reviews, outlooks, setups, mistakes, premarkets, tradeReviews, riskSettings, profile, deletedItems, savedAt: new Date().toISOString() };
        idb.set("journal", blob);
        e.preventDefault(); e.returnValue = '';
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [trades, reviews, outlooks, setups, mistakes, premarkets, tradeReviews, riskSettings, profile, deletedItems, dark]); // added dark to ensure shortcuts work everywhere

  const addTrade = (t: Trade, rev?: TradeReview) => {
    isDirty.current = true;
    const tWithTs = { ...t, updatedAt: new Date().toISOString() };
    setTrades(p => [...p, tWithTs]);
    if (rev) {
      const rWithTs = { ...rev, updatedAt: new Date().toISOString() };
      setTradeReviews(p => [...p, rWithTs]);
    }
  };

  const updateTrade = (t: Trade) => {
    isDirty.current = true;
    const tWithTs = { ...t, updatedAt: new Date().toISOString() };
    setTrades(p => p.map(i => i.id === t.id ? tWithTs : i));
  };

  const deleteTrade = (id: string) => {
    isDirty.current = true;
    const t = trades.find(i => i.id === id);
    if (t) setDeletedItems(p => [...p, { type: 'trade', data: t, deletedAt: new Date().toISOString() }]);
    setTrades(p => p.filter(i => i.id !== id));
  };

  // Wrapper for all state setters that should trigger a sync
  const setTradesDirty = (fn: (p: Trade[]) => Trade[]) => { isDirty.current = true; setTrades(fn); };
  const setReviewsDirty = (fn: (p: SessionReview[]) => SessionReview[]) => { isDirty.current = true; setReviews(fn); };
  const setMistakesDirty = (fn: (p: Mistake[]) => Mistake[]) => { isDirty.current = true; setMistakes(fn); };
  const setOutlooksDirty = (fn: (p: WeeklyOutlook[]) => WeeklyOutlook[]) => { isDirty.current = true; setOutlooks(fn); };
  const setSetupsDirty = (fn: (p: PlaybookSetup[]) => PlaybookSetup[]) => { isDirty.current = true; setSetups(fn); };
  const setTradeReviewsDirty = (fn: (p: TradeReview[]) => TradeReview[]) => { isDirty.current = true; setTradeReviews(fn); };
  const setPremarketsDirty = (fn: (p: any[]) => any[]) => { isDirty.current = true; setPremarkets(fn); };
  const setRiskSettingsDirty = (s: RiskSettings) => { isDirty.current = true; setRiskSettings(s); };
  const setProfileDirty = (p: Profile) => { isDirty.current = true; setProfile(p); };
  
  const accountList = useMemo(() => ["All", ...new Set(trades.map(t => t.account).filter(Boolean))], [trades]);
  const viewTrades = useMemo(() => accountFilter === "All" ? trades : trades.filter(t => t.account === accountFilter), [trades, accountFilter]);
  const metrics = useMemo(() => computeMetrics(viewTrades), [viewTrades]);

  const exportJSON = () => {
    const data = { trades, reviews, outlooks, setups, mistakes, premarkets, tradeReviews, riskSettings, profile, exportDate: new Date().toISOString() };
    const a = document.createElement("a");
    a.href = "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    a.download = `journal_${today()}.json`;
    a.click();
    setProfile(p => ({ ...p, lastBackup: new Date().toISOString() }));
  };

  const importJSON = () => {
    const input = document.createElement("input"); input.type = "file"; input.accept = ".json";
    input.onchange = (ev: any) => {
      const file = ev.target.files[0]; if (!file) return;
      const reader = new FileReader(); reader.onload = (e2: any) => {
        try {
          const d = JSON.parse(e2.target.result);
          if (window.confirm("Import will REPLACE current data. Safety backup will be downloaded. Proceed?")) {
            exportJSON();
            const now = new Date().toISOString();
            const stamp = (arr: any[]) => (arr || []).map(i => ({ ...i, updatedAt: now }));
            
            isDirty.current = true;
            setTimeout(() => {
              if (d.trades) setTrades(stamp(d.trades));
              if (d.reviews) setReviews(stamp(d.reviews));
              if (d.outlooks) setOutlooks(stamp(d.outlooks));
              if (d.setups) setSetups(stamp(d.setups));
              if (d.mistakes) setMistakes(stamp(d.mistakes));
              if (d.premarkets) setPremarkets(stamp(d.premarkets));
              if (d.tradeReviews) setTradeReviews(stamp(d.tradeReviews));
              if (d.riskSettings) setRiskSettings(d.riskSettings);
              if (d.profile) setProfile(d.profile);
            }, 600);
          }
        } catch { alert("Invalid JSON"); }
      }; reader.readAsText(file);
    }; input.click();
  };

  const importCSV = () => { alert("CSV import is being finalized for multiple broker formats. For now, please use the JSON backup/restore or log trades manually."); };

  const resetAll = () => {
    if (window.confirm("Permanently delete ALL data? This will clear cloud storage too.")) {
      exportJSON();
      
      const allDeletes: DeletedItem[] = [
        ...trades.map(t => ({ type: "trade" as const, data: t, deletedAt: new Date().toISOString() })),
        ...reviews.map(r => ({ type: "sessionReview" as const, data: r, deletedAt: new Date().toISOString() })),
        ...mistakes.map(m => ({ type: "mistake" as const, data: m, deletedAt: new Date().toISOString() })),
        ...tradeReviews.map(r => ({ type: "tradeReview" as const, data: r, deletedAt: new Date().toISOString() })),
        ...premarkets.map(p => ({ type: "premarket" as const, data: p, deletedAt: new Date().toISOString() })),
      ];

      setTrades([]); setReviews([]); setOutlooks([]); setSetups([]); setMistakes([]); setPremarkets([]); setTradeReviews([]);
      setDeletedItems(allDeletes);
      isDirty.current = true;
      setTab("dashboard");
      setLastSaved("Clearing storage...");
    }
  };

  // Show nothing while we're checking if the user is already logged in
  if (!authReady) {
    return (
      <div style={{ height: '100vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid var(--b1)', borderTopColor: 'var(--a)', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    return <Landing />;
  }

  if (isAuthorized === false) {
    return <AccessDenied email={user.email} />;
  }

  return (
    <div id="app" style={{ display: "flex", height: "100vh", width: "100%", overflow: "hidden", background: 'var(--bg)' }}>
      <Sidebar 
        tab={tab} 
        setTab={setTab} 
        dark={dark} 
        profile={profile} 
        metrics={metrics} 
        collapsed={sidebarCollapsed} 
        setCollapsed={setSidebarCollapsed} 
        accountFilter={accountFilter} 
        setAccountFilter={setAccountFilter} 
        accountList={accountList} 
        lastSaved={lastSaved} 
        saveError={saveError} 
        riskSettings={riskSettings}
        syncing={syncing}
        user={user}
        privacyMode={privacyMode}
        setPrivacyMode={setPrivacyMode}
      />
      <div id="main" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        <div id="content" style={{ 
          flex: 1, 
          overflowY: "auto", 
          padding: sidebarCollapsed ? "40px clamp(20px, 8vw, 100px)" : "40px clamp(20px, 5vw, 60px)",
          transition: 'padding 0.2s ease'
        }}>
          <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            {tab === "dashboard" && <Dashboard trades={viewTrades} metrics={metrics} profile={profile} riskSettings={riskSettings} dark={dark} syncing={syncing} privacyMode={privacyMode} setPrivacyMode={setPrivacyMode} />}
            {tab === "outlook" && <Outlook outlooks={outlooks} setOutlooks={setOutlooksDirty} />}
            {tab === "session" && <Session trades={trades} setTrades={setTradesDirty} tradeReviews={tradeReviews} setTradeReviews={setTradeReviewsDirty} premarkets={premarkets} setPremarkets={setPremarketsDirty} reviews={reviews} setReviews={setReviewsDirty} mistakes={mistakes} setMistakes={setMistakesDirty} setups={setups} setDeletedItems={(fn: any) => { isDirty.current = true; setDeletedItems(fn); }} />}
            {tab === "trades" && <TradesDB trades={viewTrades} setTrades={setTradesDirty} setups={setups} tradeReviews={tradeReviews} setTradeReviews={setTradeReviewsDirty} setDeletedItems={(fn: any) => { isDirty.current = true; setDeletedItems(fn); }} privacyMode={privacyMode} />}
            {tab === "archive" && <Archive premarkets={premarkets} setPremarkets={setPremarketsDirty} reviews={reviews} setReviews={setReviewsDirty} mistakes={mistakes} setMistakes={setMistakesDirty} tradeReviews={tradeReviews} setTradeReviews={setTradeReviewsDirty} trades={trades} outlooks={outlooks} setOutlooks={setOutlooksDirty} deletedItems={deletedItems} setDeletedItems={(fn: any) => { isDirty.current = true; setDeletedItems(fn); }} setTrades={setTradesDirty} privacyMode={privacyMode} />}
            {tab === "psychology" && <Psychology trades={viewTrades} />}
            {tab === "playbook" && <Playbook setups={setups} setSetups={setSetupsDirty} trades={viewTrades} privacyMode={privacyMode} />}
            {tab === "risk" && <Risk trades={trades} riskSettings={riskSettings} setRiskSettings={setRiskSettingsDirty} metrics={metrics} privacyMode={privacyMode} setPrivacyMode={setPrivacyMode} />}
            {tab === "stats" && <Stats trades={viewTrades} tradeReviews={tradeReviews} riskSettings={riskSettings} setRiskSettings={setRiskSettingsDirty} dark={dark} privacyMode={privacyMode} />}
            {tab === "void" && <TheVoid trades={viewTrades} tradeReviews={tradeReviews} riskSettings={riskSettings} efficiency={metrics.efficiency} />}
            {tab === "settings" && <Settings profile={profile} setProfile={setProfileDirty} dark={dark} setDark={setDark} onExport={exportJSON} onImport={importJSON} onReset={resetAll} onImportCSV={importCSV} onForceSync={forceSync} syncing={syncing} />}
          </div>
        </div>
      </div>
      <button onClick={() => { setTab("session"); setQuickTradeModal("new"); }} style={{ position: "fixed", right: 20, bottom: 20, width: 44, height: 44, borderRadius: "50%", border: "1px solid var(--gB)", background: "var(--gBg)", color: "var(--g)", fontSize: 26, cursor: "pointer", zIndex: 150, boxShadow: "0 10px 24px rgba(0,0,0,.25)" }}>+</button>
      {quickTradeModal && <TradeModal trade={null} reviews={tradeReviews} onSave={addTrade} onClose={() => setQuickTradeModal(null)} setups={setups} />}
      <CommandBar setTab={setTab} onQuickTrade={() => setQuickTradeModal("new")} dark={dark} setDark={setDark} />
    </div>
  );
}
