import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface AppDB extends DBSchema {
  pending_messages: {
    key: string;
    value: {
      id: string; // temp id
      conversation_id: string;
      sender_id: string;
      content: string;
      created_at: string;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<AppDB>>;

export function initDB() {
  if (!dbPromise) {
    dbPromise = openDB<AppDB>('comunica-db', 1, {
      upgrade(db) {
        db.createObjectStore('pending_messages', { keyPath: 'id' });
      },
    });
  }
}

export async function addPendingMessage(message: AppDB['pending_messages']['value']) {
  const db = await dbPromise;
  await db.put('pending_messages', message);
}

export async function getPendingMessages() {
  const db = await dbPromise;
  return await db.getAll('pending_messages');
}

export async function removePendingMessage(id: string) {
  const db = await dbPromise;
  await db.delete('pending_messages', id);
}

// Inicializar banco ao carregar
initDB();
