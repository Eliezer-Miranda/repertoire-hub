/**
 * Armazena arquivos de Pad por tom usando IndexedDB.
 * Chave: tom (ex: "C", "C#", "D"...). Valor: { name, type, blob }.
 */

const DB_NAME = "musiclib-pads";
const STORE = "pads";
const DB_VERSION = 1;

export const ALL_KEYS = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
] as const;
export type MusicalKey = typeof ALL_KEYS[number];

export type PadEntry = {
  key: MusicalKey;
  name: string;
  type: string;
  size: number;
  blob: Blob;
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function savePad(key: MusicalKey, file: File): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put({
      key,
      name: file.name,
      type: file.type || "audio/wav",
      size: file.size,
      blob: file,
    } as PadEntry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPad(key: MusicalKey): Promise<PadEntry | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve((req.result as PadEntry) ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function listPads(): Promise<Record<string, { name: string; size: number }>> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => {
      const out: Record<string, { name: string; size: number }> = {};
      for (const p of req.result as PadEntry[]) out[p.key] = { name: p.name, size: p.size };
      resolve(out);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deletePad(key: MusicalKey): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
