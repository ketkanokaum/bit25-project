// Open-Meteo's free/keyless tier throttles sustained request volume with HTTP 429,
// and under heavy load can also drop the connection outright (fetch throws rather
// than resolving). Retry both cases with backoff (honoring Retry-After when present).
async function fetchWithRetry(url, { maxRetries = 6, baseDelayMs = 3000 } = {}) {
  let lastError = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    let res;
    try {
      res = await fetch(url);
    } catch (err) {
      lastError = err;
      if (attempt === maxRetries) throw err;
      await new Promise((resolve) => setTimeout(resolve, baseDelayMs * Math.pow(2, attempt)));
      continue;
    }

    if (res.status !== 429) return res;
    if (attempt === maxRetries) return res; // give up, let the caller report the failure

    const retryAfterHeader = res.headers.get("retry-after");
    let waitMs = baseDelayMs * Math.pow(2, attempt);
    if (retryAfterHeader) {
      const seconds = parseInt(retryAfterHeader, 10);
      if (!Number.isNaN(seconds)) waitMs = seconds * 1000;
    }
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
  throw lastError;
}

module.exports = { fetchWithRetry };
