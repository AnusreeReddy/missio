// jsonStore.js
//
// Minimal embedded document store used as the DEV/TEST driver behind the
// repository layer (see server/src/repositories/*). It intentionally
// exposes a tiny Mongo-ish surface (find/findOne/insert/updateOne/deleteOne)
// so that swapping in real Mongoose models against MongoDB Atlas later is a
// same-shaped change confined to server/src/repositories, not a rewrite of
// services or routes.
//
// Persistence: a single JSON file on disk, read into memory on boot and
// flushed (debounced) after each write. Good enough for single-instance dev
// and for this sandbox; not a substitute for a real DB under concurrent load.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { nanoid } from 'nanoid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

const COLLECTIONS = [
  'users',
  'progress',
  'dailyCheckIns',
  'contentItems',
  'missions',
  'plans',
];

function emptyState() {
  const state = {};
  for (const c of COLLECTIONS) state[c] = [];
  return state;
}

function loadState() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    const initial = emptyState();
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    for (const c of COLLECTIONS) if (!parsed[c]) parsed[c] = [];
    return parsed;
  } catch (err) {
    console.error('[jsonStore] failed to parse db.json, starting fresh:', err.message);
    return emptyState();
  }
}

const state = loadState();
let flushTimer = null;

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
  }, 50);
}

function matches(doc, query) {
  return Object.entries(query).every(([k, v]) => {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      // support simple operators: $gte, $lte, $in
      return Object.entries(v).every(([op, opVal]) => {
        if (op === '$gte') return doc[k] >= opVal;
        if (op === '$lte') return doc[k] <= opVal;
        if (op === '$in') return opVal.includes(doc[k]);
        return true;
      });
    }
    return doc[k] === v;
  });
}

export function collection(name) {
  if (!COLLECTIONS.includes(name)) {
    throw new Error(`[jsonStore] unknown collection: ${name}`);
  }

  return {
    find(query = {}) {
      return state[name].filter((doc) => matches(doc, query)).map((d) => ({ ...d }));
    },
    findOne(query = {}) {
      const doc = state[name].find((d) => matches(d, query));
      return doc ? { ...doc } : null;
    },
    findById(id) {
      const doc = state[name].find((d) => d._id === id);
      return doc ? { ...doc } : null;
    },
    insert(doc) {
      const record = { _id: doc._id || nanoid(12), createdAt: new Date().toISOString(), ...doc };
      // ensure _id/createdAt from doc (if provided) aren't clobbered by defaults above
      record._id = doc._id || record._id;
      record.createdAt = doc.createdAt || record.createdAt;
      state[name].push(record);
      scheduleFlush();
      return { ...record };
    },
    updateById(id, patch) {
      const idx = state[name].findIndex((d) => d._id === id);
      if (idx === -1) return null;
      state[name][idx] = { ...state[name][idx], ...patch, updatedAt: new Date().toISOString() };
      scheduleFlush();
      return { ...state[name][idx] };
    },
    deleteById(id) {
      const before = state[name].length;
      state[name] = state[name].filter((d) => d._id !== id);
      scheduleFlush();
      return state[name].length < before;
    },
    count(query = {}) {
      return state[name].filter((doc) => matches(doc, query)).length;
    },
  };
}

// Test/dev helper: wipe everything.
export function __resetAll() {
  for (const c of COLLECTIONS) state[c] = [];
  scheduleFlush();
}

export function __flushSync() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
}
