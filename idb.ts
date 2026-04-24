/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const IDB_NAME = 'tj_journal';
const IDB_STORE = 'data';
const IDB_VER = 1;

let dbInstance: IDBDatabase | null = null;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }
    const request = indexedDB.open(IDB_NAME, IDB_VER);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(IDB_STORE);
    };
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };
    request.onerror = () => reject(request.error);
  });
};

export const idb = {
  async get(key: string): Promise<any> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(IDB_STORE, 'readonly');
      const request = transaction.objectStore(IDB_STORE).get(key);
      request.onsuccess = () => resolve(request.result === undefined ? null : request.result);
      request.onerror = () => reject(request.error);
    });
  },
  async set(key: string, val: any): Promise<boolean> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(IDB_STORE, 'readwrite');
      transaction.objectStore(IDB_STORE).put(val, key);
      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => reject(transaction.error);
    });
  }
};
