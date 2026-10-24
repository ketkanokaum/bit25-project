import 'server-only';

const store = {};
const refreshing = {};

const MAX_ENTRIES = 20;

function evictIfNeeded() { 
  const keys = Object.keys(store);
  if (keys.length <= MAX_ENTRIES) return;

  keys.sort((a, b) => store[a].usedAt - store[b].usedAt);
  const removeCount = keys.length - MAX_ENTRIES;
  for (let i = 0; i < removeCount; i++) {
    if (refreshing[keys[i]]) continue;
    delete store[keys[i]];
    delete refreshing[keys[i]];
  }
}

async function refreshInBackground(key, loader) {
  try {
    const data = await loader();
    const usedAt = store[key] ? store[key].usedAt : Date.now();
    store[key] = { data: data, savedAt: Date.now(), usedAt: usedAt };
  } catch {
  }
  refreshing[key] = false;
}

function effectiveMaxAge(data, maxAgeMs, options) {
  if (!options || typeof options.isIncomplete !== 'function') return maxAgeMs;
  if (!options.isIncomplete(data)) return maxAgeMs;
  return options.incompleteMaxAgeMs;
}

export async function getCached(key, maxAgeMs, loader, options) {
  const entry = store[key];

  if (entry) {
    entry.usedAt = Date.now();
    const age = Date.now() - entry.savedAt;

    if (age < effectiveMaxAge(entry.data, maxAgeMs, options)) {
      return entry.data;
    }

    if (!refreshing[key]) {
      refreshing[key] = true;
      refreshInBackground(key, loader);
    }

    return entry.data;
  }

  const data = await loader();
  const now = Date.now();
  store[key] = { data: data, savedAt: now, usedAt: now };
  evictIfNeeded();
  return data;
}

export function setCached(key, data) {
  const now = Date.now();
  const usedAt = store[key] ? store[key].usedAt : now;
  store[key] = { data: data, savedAt: now, usedAt: usedAt };
  evictIfNeeded();
}

export const TEN_MINUTES = 10 * 60 * 1000;
export const THIRTY_SECONDS = 30 * 1000;
