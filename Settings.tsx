/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Profile } from '../types';
import { cardStyle, btnStyle, btnSmStyle, C, inpStyle } from './Common';

import { login, logout, auth } from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

interface SettingsProps {
  profile: Profile;
  setProfile: React.Dispatch<React.SetStateAction<Profile>>;
  dark: boolean;
  setDark: React.Dispatch<React.SetStateAction<boolean>>;
  onExport: () => void;
  onImport: () => void;
  onReset: () => void;
  onImportCSV: () => void;
  onForceSync: () => void;
  syncing: boolean;
}

export function Settings({ profile, setProfile, dark, setDark, onExport, onImport, onReset, onImportCSV, onForceSync, syncing }: SettingsProps) {
  const [user, setUser] = React.useState<User | null>(auth.currentUser);
  const [editName, setEditName] = useState(false);

  React.useEffect(() => {
    return onAuthStateChanged(auth, u => setUser(u));
  }, []);

  const [tempName, setTempName] = useState(profile.name || "Trader");
  const [confirmReset, setConfirmReset] = useState(false);
  const daysSinceBackup = profile.lastBackup ? Math.floor((Date.now() - new Date(profile.lastBackup).getTime()) / 86400000) : null;
  const backupStale = daysSinceBackup === null || daysSinceBackup >= 7;

  return (
    <div className="fade-in">
      <div className="h1" style={{ marginBottom: 20 }}>Settings</div>
      
      <div style={{ ...cardStyle(), marginBottom: 12, padding: 24 }}>
        <div className="h4" style={{ marginBottom: 16 }}>Profile</div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {profile.avatar || user?.photoURL ? <img src={profile.avatar || user?.photoURL || ""} alt="avatar" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--b1)" }} /> : <div style={{ width: 64, height: 64, borderRadius: "50%", background: `linear-gradient(135deg,${C.g},${C.a})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 700, color: "#fff" }}>{(profile.name || "T").slice(0, 1).toUpperCase()}</div>}
          <div>
            {editName ? <div style={{ display: "flex", gap: 8 }}><input style={{ ...inpStyle(), width: 200 }} value={tempName} onChange={x => setTempName(x.target.value)} /><button style={btnStyle(true)} onClick={() => { setProfile(p => ({ ...p, name: tempName })); setEditName(false); }}>Save</button></div> : <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div className="h2">{profile.name}</div><button style={btnSmStyle()} onClick={() => setEditName(true)}>Edit</button></div>}
          </div>
        </div>
      </div>

      <div style={{ ...cardStyle(), marginBottom: 12, padding: 24 }}>
        <div className="h4" style={{ marginBottom: 16 }}>Sync Intelligence</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 13, color: "var(--t2)" }}>Status</div>
            <div style={{ fontSize: 11, color: C.g, fontWeight: 700 }}>● SECURE SYNC ACTIVE</div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 13, color: "var(--t2)" }}>Cloud Items Detected</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t1)" }}>{Object.keys(profile).length > 1 ? "Active" : "New Account"}</div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 12, color: "var(--t3)" }}>Account</div>
            <div style={{ fontSize: 12, color: C.a }}>{user?.email}</div>
          </div>
        </div>
        <button 
          style={{ ...btnStyle(), width: '100%', justifyContent: 'center', marginBottom: 8 }} 
          onClick={onForceSync} 
          disabled={syncing}
        >
          {syncing ? "Pulling latest data..." : "Force Sync from Cloud"}
        </button>
        <button style={{ ...btnSmStyle(), width: '100%', justifyContent: 'center' }} onClick={logout}>Sign Out</button>
      </div>
      <div style={{ ...cardStyle(), marginBottom: 12, padding: 24 }}>
        <div className="h4" style={{ marginBottom: 16 }}>Appearance</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><div className="h3">Dark Mode</div><div style={{ fontSize: 12, color: "var(--t3)" }}>Toggle theme</div></div>
          <div onClick={() => setDark(!dark)} style={{ width: 44, height: 24, borderRadius: 12, background: dark ? C.g : "var(--s3)", cursor: "pointer", position: "relative", border: "1px solid var(--b2)" }}><div style={{ position: "absolute", top: 2, left: dark ? 22 : 2, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left .2s" }} /></div>
        </div>
      </div>
      <div style={{ ...cardStyle(), padding: 24 }}>
        <div className="h4" style={{ marginBottom: 16 }}>Data</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div><div className="h3">Export JSON</div><div style={{ fontSize: 12, color: "var(--t3)" }}>Backup all data</div></div>
            <button style={btnStyle()} onClick={onExport}>Export</button>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div><div className="h3">Import JSON</div><div style={{ fontSize: 12, color: "var(--t3)" }}>Restore from backup</div></div>
            <button style={btnStyle()} onClick={onImport}>Import</button>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div><div className="h3">Import CSV</div><div style={{ fontSize: 12, color: "var(--t3)" }}>Historical trades</div></div>
            <button style={btnStyle()} onClick={onImportCSV}>Import CSV</button>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--b1)", paddingTop: 14 }}>
            <div><div className="h3" style={{ color: "var(--r)" }}>Reset Data</div><div style={{ fontSize: 12, color: "var(--t3)" }}>Delete everything</div></div>
            {confirmReset ? <button style={btnStyle(false, true)} onClick={onReset}>Confirm Reset</button> : <button style={btnStyle(false, true)} onClick={() => setConfirmReset(true)}>Reset</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
