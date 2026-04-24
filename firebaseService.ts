/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db } from '../lib/firebase';
import { collection, doc, setDoc, getDocs, writeBatch, getDoc } from 'firebase/firestore';

export const syncToCloud = async (userId: string, data: any, options: { pruneOrphans?: boolean } = {}) => {
  try {
    const userRef = doc(db, 'users', userId);

    // Sync profile and riskSettings in the main user doc
    await setDoc(userRef, {
      profile: data.profile || {},
      riskSettings: data.riskSettings || {},
      updatedAt: new Date().toISOString()
    }, { merge: true });

    const collectionNames = ['trades', 'reviews', 'mistakes', 'outlooks', 'setups', 'tradeReviews', 'premarkets'];
    const collections = [
      { name: 'trades', items: data.trades },
      { name: 'reviews', items: data.reviews },
      { name: 'mistakes', items: data.mistakes },
      { name: 'outlooks', items: data.outlooks },
      { name: 'setups', items: data.setups },
      { name: 'tradeReviews', items: data.tradeReviews },
      { name: 'premarkets', items: data.premarkets }
    ];

    let currentBatch = writeBatch(db);
    let opCount = 0;

    // 1. Process Upserts
    for (const col of collections) {
      if (!col.items) continue;
      for (const item of col.items) {
        if (!item.id) continue;
        const ref = doc(db, 'users', userId, col.name, item.id);
        currentBatch.set(ref, item, { merge: true });
        opCount++;

        if (opCount >= 450) {
          await currentBatch.commit();
          currentBatch = writeBatch(db);
          opCount = 0;
        }
      }
    }

    // 2. Process Deletions (from the explicit log)
    if (data.deletedItems && Array.isArray(data.deletedItems)) {
      const typeMap: Record<string, string> = {
        trade: 'trades',
        tradeReview: 'tradeReviews',
        premarket: 'premarkets',
        sessionReview: 'reviews',
        mistake: 'mistakes'
      };

      for (const d of data.deletedItems) {
        const colName = typeMap[d.type];
        const itemId = d.data?.id;
        if (colName && itemId) {
          const ref = doc(db, 'users', userId, colName, itemId);
          currentBatch.delete(ref);
          opCount++;

          if (opCount >= 450) {
            await currentBatch.commit();
            currentBatch = writeBatch(db);
            opCount = 0;
          }
        }
      }
    }

    if (opCount > 0) {
      await currentBatch.commit();
    }
  } catch (error) {
    console.error("Cloud Sync Error:", error);
    throw error;
  }
};

export const fetchFromCloud = async (userId: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.exists() ? userSnap.data() : {};

    const collections = ['trades', 'reviews', 'mistakes', 'outlooks', 'setups', 'tradeReviews', 'premarkets'];
    const result: any = {
      profile: userData.profile || null,
      riskSettings: userData.riskSettings || null
    };

    for (const col of collections) {
      const q = collection(db, 'users', userId, col);
      const snap = await getDocs(q);
      result[col] = snap.docs.map(d => d.data());
    }

    return result;
  } catch (error) {
    console.error("Cloud Fetch Error:", error);
    throw error;
  }
};

export const checkAuthorization = async (email: string | null) => {
  if (!email) return false;
  
  const ownerEmail = 'elkhiraouia@gmail.com';
  if (email.toLowerCase() === ownerEmail.toLowerCase()) {
    console.log("System owner detected, bypassing authorization check.");
    return true;
  }

  try {
    const authRef = doc(db, 'authorized_users', email.toLowerCase());
    const authSnap = await getDoc(authRef);
    const isAuthorized = authSnap.exists() && authSnap.data()?.status === 'active';
    
    if (!isAuthorized) {
      console.warn(`User ${email} is not in the authorized_users whitelist.`);
    }
    
    return isAuthorized;
  } catch (error) {
    console.error("Auth Check Error:", error);
    // If the check fails (e.g. security rules), we deny access by default
    return false;
  }
};
