import 'server-only';


const store = {};

export async function getCached(key, maxAgeMs, loader) {
  const entry = store[key];
  if (entry && Date.now() - entry.savedAt < maxAgeMs) {
    return entry.data;
  }

  const data = await loader();
  store[key] = { data: data, savedAt: Date.now() };
  return data;
}

export const TEN_MINUTES = 10 * 60 * 1000;
