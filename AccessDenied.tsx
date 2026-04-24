/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { logout } from '../lib/firebase';
import { motion } from 'motion/react';

export function AccessDenied({ email }: { email: string | null }) {
  return (
    <div style={{ 
      height: '100vh', 
      width: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'black',
      color: 'white',
      textAlign: 'center',
      padding: 20
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ maxWidth: 450 }}
      >
        <div style={{ 
          fontSize: 48, 
          marginBottom: 24,
          color: '#ff4444' 
        }}>
          ✕
        </div>
        
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>Access Denied</h1>
        
        <p style={{ color: '#888', lineHeight: 1.6, marginBottom: 32 }}>
          The account <strong>{email}</strong> is not currently authorized to access the Vigilant Dashboard. 
          New account creation is disabled.
        </p>

        <div style={{ 
          background: '#111', 
          border: '1px solid #222', 
          padding: '24px', 
          borderRadius: 12,
          marginBottom: 32,
          textAlign: 'left'
        }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#555', marginBottom: 12, textTransform: 'uppercase' }}>Next Steps</h3>
          <ul style={{ fontSize: 13, color: '#aaa', paddingLeft: 20, margin: 0 }}>
             <li style={{ marginBottom: 8 }}>Contact the administrator to request an invitation.</li>
             <li>Ensure you are signed in with the correct professional email.</li>
          </ul>
        </div>

        <button 
          onClick={() => logout().then(() => window.location.reload())}
          style={{ 
            padding: '12px 32px', 
            borderRadius: 8, 
            background: '#222', 
            color: 'white', 
            border: 'none', 
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600
          }}
        >
          Sign Out & Return Home
        </button>
      </motion.div>
    </div>
  );
}
