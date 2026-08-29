type RateEntry = { count: number; resetAt: number };

const entries = new Map<string, RateEntry>();

export function consumeRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = entries.get(key);
  if (!current || current.resetAt <= now) {
    entries.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }
  if (current.count >= limit) {
    return { allowed: false, retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  }
  current.count += 1;
  if (entries.size > 5000) {
    for (const [entryKey, entry] of entries) if (entry.resetAt <= now) entries.delete(entryKey);
  }
  return { allowed: true, retryAfter: 0 };
}
