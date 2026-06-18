function createRateLimiter({ limit = 90, windowMs = 30_000, sweepMs = 60_000 } = {}) {
  const buckets = new Map();

  function allow(key) {
    const now = Date.now();
    const id = String(key || 'unknown');
    let bucket = buckets.get(id);

    if (!bucket || now - bucket.startedAt >= windowMs) {
      bucket = { count: 0, startedAt: now, lastSeenAt: now };
      buckets.set(id, bucket);
    }

    bucket.count += 1;
    bucket.lastSeenAt = now;
    return bucket.count <= limit;
  }

  function sweep() {
    const now = Date.now();
    for (const [key, bucket] of buckets.entries()) {
      if (now - bucket.lastSeenAt > Math.max(windowMs * 2, sweepMs)) buckets.delete(key);
    }
  }

  const timer = setInterval(sweep, sweepMs);
  timer.unref?.();

  return {
    allow,
    stop() {
      clearInterval(timer);
      buckets.clear();
    }
  };
}

module.exports = { createRateLimiter };
