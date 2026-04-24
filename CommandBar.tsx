/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { C } from './Common';

interface CommandBarProps {
  setTab: (t: string) => void;
  onQuickTrade: () => void;
  dark: boolean;
  setDark: (d: boolean) => void;
}

export function CommandBar({ setTab, onQuickTrade, dark, setDark }: CommandBarProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  if (!open) return null;

  return (
    <div 
      className="fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '15vh'
      }}
      onClick={() => setOpen(false)}
    >
      <div 
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(640px, 90vw)',
          background: 'var(--s1)',
          borderRadius: 12,
          border: '1px solid var(--b2)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
          overflow: 'hidden'
        }}
      >
        <Command label="Command Menu">
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--b1)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18, color: 'var(--t3)' }}>🔍</span>
            <Command.Input 
              autoFocus
              placeholder="Type a command or search..." 
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--t1)',
                fontSize: 15,
                width: '100%',
                outline: 'none'
              }}
            />
          </div>

          <Command.List style={{ padding: 8, maxHeight: 300, overflowY: 'auto' }}>
            <Command.Empty style={{ padding: '12px 16px', fontSize: 13, color: 'var(--t3)' }}>No results found.</Command.Empty>

            <Command.Group heading="Navigation" style={{ fontSize: 11, fontWeight: 700, color: 'var(--a)', textTransform: 'uppercase', padding: '12px 16px 8px' }}>
              <Item onSelect={() => { setTab('dashboard'); setOpen(false); }}>◈ Dashboard</Item>
              <Item onSelect={() => { setTab('session'); setOpen(false); }}>≡ Daily Log</Item>
              <Item onSelect={() => { setTab('trades'); setOpen(false); }}>↕ Trade Database</Item>
              <Item onSelect={() => { setTab('stats'); setOpen(false); }}>▦ Statistics</Item>
              <Item onSelect={() => { setTab('risk'); setOpen(false); }}>⬡ Risk Manager</Item>
            </Command.Group>

            <Command.Group heading="Quick Actions" style={{ fontSize: 11, fontWeight: 700, color: 'var(--a)', textTransform: 'uppercase', padding: '12px 16px 8px' }}>
              <Item onSelect={() => { onQuickTrade(); setOpen(false); }}>+ Log New Trade</Item>
              <Item onSelect={() => { setDark(!dark); setOpen(false); }}>◑ Toggle Dark/Light Mode</Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}

function Item({ children, onSelect }: { children: React.ReactNode; onSelect: () => void }) {
  return (
    <Command.Item
      onSelect={onSelect}
      style={{
        padding: '10px 16px',
        borderRadius: 8,
        cursor: 'pointer',
        fontSize: 14,
        color: 'var(--t2)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        userSelect: 'none'
      }}
      className="command-item"
    >
      {children}
    </Command.Item>
  );
}
