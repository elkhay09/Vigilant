/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { login } from '../lib/firebase';
import { C } from './Common';
import { motion } from 'motion/react';

export function Landing() {
  return (
    <div style={{ 
      height: '100vh', 
      width: '100%', 
      display: 'flex', 
      background: 'black',
      color: 'white',
      overflow: 'hidden'
    }}>
      {/* Left: Branding & Visuals */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        padding: 'clamp(40px, 10vw, 120px)',
        position: 'relative',
        zIndex: 2,
        background: 'linear-gradient(135deg, #050505 0%, #111111 100%)',
        borderRight: '1px solid #222'
      }}>
        {/* Subtle Background Pattern */}
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          opacity: 0.1, 
          backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', 
          backgroundSize: '40px 40px',
          zIndex: -1
        }} />

        <motion.div
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ duration: 0.8 }}
        >
          <div style={{ 
            fontSize: 12, 
            fontWeight: 700, 
            letterSpacing: '0.2em', 
            textTransform: 'uppercase', 
            color: C.a,
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <span style={{ width: 40, height: 1, background: C.a }}></span>
            Mission Critical Trading Journal
          </div>

          <h1 style={{ 
            fontSize: 'clamp(3rem, 10vw, 100px)', 
            fontWeight: 900, 
            lineHeight: 0.9, 
            letterSpacing: '-0.04em',
            marginBottom: 32,
            fontFamily: 'system-ui, sans-serif'
          }}>
            VIGILANT<br/>
            <span style={{ color: '#444' }}>TRADE JOURNAL.</span>
          </h1>

          <p style={{ 
            maxWidth: 500, 
            fontSize: 'clamp(16px, 2vw, 20px)', 
            lineHeight: 1.6, 
            color: '#888',
            marginBottom: 48
          }}>
            Protect your capital. Master your mindset. 
            The elite workstation for futures traders who demand discipline 
            and algorithmic precision in their process.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 40, maxWidth: 500 }}>
             <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#555', marginBottom: 8, textTransform: 'uppercase' }}>Precision</div>
                <div style={{ fontSize: 14, color: '#aaa', lineHeight: 1.4 }}>Cloud-synced execution logs with micro-second precision.</div>
             </div>
             <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#555', marginBottom: 8, textTransform: 'uppercase' }}>Performance</div>
                <div style={{ fontSize: 14, color: '#aaa', lineHeight: 1.4 }}>Behavioral analytics and performance coaching framework.</div>
             </div>
          </div>
        </motion.div>
      </div>

      {/* Right: Authentication */}
      <div style={{ 
        width: 'clamp(380px, 40vw, 600px)', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center',
        background: '#0a0a0a',
        padding: 40,
        textAlign: 'center',
        position: 'relative'
      }}>
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ duration: 0.5, delay: 0.3 }}
           style={{ width: '100%', maxWidth: 320 }}
        >
          <div style={{ 
             width: 64, 
             height: 64, 
             background: 'linear-gradient(to bottom, #222, #000)', 
             borderRadius: 16, 
             display: 'flex', 
             alignItems: 'center', 
             justifyContent: 'center',
             border: '1px solid #333',
             margin: '0 auto 40px',
             fontSize: 32
          }}>
             ◈
          </div>

          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Authorized Access Only</h2>
          <p style={{ fontSize: 14, color: '#666', marginBottom: 44, lineHeight: 1.5 }}>
            Membership is currently restricted to invited professional accounts only.
          </p>

          <button 
            onClick={login}
            style={{ 
              width: '100%',
              padding: '16px', 
              fontSize: 15, 
              fontWeight: 600,
              borderRadius: 12,
              background: 'white',
              color: 'black',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              transition: 'all 0.2s ease',
              marginBottom: 20
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 10px 20px rgba(255,255,255,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: 18, height: 18 }} />
            Access Dashboard
          </button>
          
          <div style={{ fontSize: 11, color: '#444', lineHeight: 1.6 }}>
            New accounts cannot be created directly.<br/>
            Contact us for membership inquiries.
          </div>
        </motion.div>
      </div>

      {/* Decorative vertical rail text */}
      <div style={{ 
        position: 'fixed', 
        right: 40, 
        top: '50%', 
        transform: 'translateY(-50%) rotate(90deg)', 
        fontSize: 10, 
        fontWeight: 700, 
        letterSpacing: '0.5em', 
        color: '#222', 
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        pointerEvents: 'none'
      }}>
        EST. 2024 — PRIVATE INFRASTRUCTURE — ACTIVE SECURITY
      </div>
    </div>
  );
}
