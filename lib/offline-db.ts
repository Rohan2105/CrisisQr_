import { openDB } from 'idb';

const DB_NAME = 'CrisisQR_Offline';
const STORE_NAME = 'sos_queue';

export async function initDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    },
  });
}

export async function queueOfflineSOS(data: {
  type: 'VOICE' | 'TEXT';
  audioBlob?: Blob;
  text?: string;
  lat: number;
  lng: number;
  timestamp: number;
}) {
  const db = await initDB();
  return db.add(STORE_NAME, data);
}

export async function getQueuedSOS() {
  const db = await initDB();
  return db.getAll(STORE_NAME);
}

export async function clearQueuedSOS(id: number) {
  const db = await initDB();
  return db.delete(STORE_NAME, id);
}
