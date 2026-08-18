/** Thresholds (ms) for console speed tags — tune while profiling. */
const FAST_MS = 300;
const OK_MS = 800;
const SLOW_MS = 2000;

/** Dump ranked endpoint stats every N completed calls. */
const STATS_DUMP_EVERY = 10;

type SpeedLevel = 'FAST' | 'OK' | 'SLOW' | 'CRITICAL';

type EndpointStats = {
  key: string;
  method: string;
  path: string;
  count: number;
  totalMs: number;
  minMs: number;
  maxMs: number;
  lastMs: number;
  slowCount: number;
};

const endpointStats = new Map<string, EndpointStats>();
let completedCalls = 0;
let enabled = false;

export function setupApiPerfLogging(): void {
  if (!__DEV__ || enabled) {
    return;
  }
  enabled = true;

  console.log(
    `[API][PERF] enabled — FAST <${FAST_MS}ms | OK <${OK_MS}ms | SLOW <${SLOW_MS}ms | CRITICAL ≥${SLOW_MS}ms. Dump ranking: globalThis.__apiPerfStats()`,
  );

  (globalThis as {__apiPerfStats?: () => void}).__apiPerfStats = dumpApiPerfStats;
}

/**
 * Time any API/callable and log Synchro-style speed tags in __DEV__.
 * No-op timing cost when logging is disabled (still returns the result).
 */
export async function measureApiCall<T>(
  name: string,
  run: () => Promise<T>,
  options?: {
    method?: string;
    payload?: unknown;
  },
): Promise<T> {
  if (!enabled) {
    return run();
  }

  const method = options?.method ?? 'CALLABLE';
  const path = name.startsWith('functions.') ? name.slice('functions.'.length) : name;
  const requestId = createRequestId();
  const startedAt = Date.now();

  logBlock('REQ', {
    id: requestId,
    method,
    path,
    payload: sanitizePayload(options?.payload),
  });

  try {
    const result = await run();
    const durationMs = Date.now() - startedAt;
    recordTiming(method, path, durationMs);
    logTimingLine(method, path, durationMs, true);
    logBlock('RES', {
      id: requestId,
      method,
      path,
      ok: true,
      durationMs,
      speed: speedLabel(durationMs),
      needsEnhance: durationMs >= SLOW_MS,
      payload: sanitizePayload(result),
    });
    maybeDumpStats();
    return result;
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    recordTiming(method, path, durationMs);
    logTimingLine(method, path, durationMs, false);
    logBlock('ERR', {
      id: requestId,
      method,
      path,
      ok: false,
      durationMs,
      speed: speedLabel(durationMs),
      needsEnhance: durationMs >= SLOW_MS,
      error: sanitizeError(error),
    });
    maybeDumpStats();
    throw error;
  }
}

/** Ranked slowest endpoints — also available as `globalThis.__apiPerfStats()`. */
export function dumpApiPerfStats(): void {
  const rows = [...endpointStats.values()]
    .map(s => {
      const avgMs = Math.round(s.totalMs / s.count);
      return {
        endpoint: s.key,
        calls: s.count,
        avgMs,
        minMs: s.minMs,
        maxMs: s.maxMs,
        lastMs: s.lastMs,
        slowCount: s.slowCount,
        needsEnhance: s.maxMs >= SLOW_MS || avgMs >= OK_MS,
      };
    })
    .sort((a, b) => b.avgMs - a.avgMs || b.maxMs - a.maxMs);

  const enhance = rows.filter(r => r.needsEnhance);
  console.log(
    `\n========== [API][PERF SUMMARY] (${rows.length} endpoints, ${completedCalls} calls) ==========\n` +
      safeStringify({
        thresholdsMs: {fast: FAST_MS, ok: OK_MS, slow: SLOW_MS},
        rankedByAvgMs: rows,
        needsEnhance: enhance.length ? enhance : 'none yet',
      }) +
      '\n==============================================================================\n',
  );
}

function speedLevel(ms: number): SpeedLevel {
  if (ms < FAST_MS) {
    return 'FAST';
  }
  if (ms < OK_MS) {
    return 'OK';
  }
  if (ms < SLOW_MS) {
    return 'SLOW';
  }
  return 'CRITICAL';
}

function speedLabel(ms: number): string {
  return `${speedLevel(ms)} (${ms}ms)`;
}

function logTimingLine(
  method: string,
  path: string,
  durationMs: number,
  ok: boolean,
): void {
  const level = speedLevel(durationMs);
  const okPart = ok ? '' : ' FAIL';
  const hint =
    level === 'CRITICAL'
      ? ' ← NEEDS ENHANCE'
      : level === 'SLOW'
        ? ' ← REVIEW'
        : '';
  const line = `[API][PERF][${level}] ${method} ${path}${okPart} — ${durationMs}ms${hint}`;

  if (level === 'CRITICAL' || level === 'SLOW') {
    console.warn(line);
  } else {
    console.log(line);
  }
}

function statsKey(method: string, path: string): string {
  return `${method} ${path}`;
}

function recordTiming(method: string, path: string, durationMs: number): void {
  const key = statsKey(method, path);
  const existing = endpointStats.get(key);
  if (!existing) {
    endpointStats.set(key, {
      key,
      method,
      path,
      count: 1,
      totalMs: durationMs,
      minMs: durationMs,
      maxMs: durationMs,
      lastMs: durationMs,
      slowCount: durationMs >= SLOW_MS ? 1 : 0,
    });
    return;
  }
  existing.count += 1;
  existing.totalMs += durationMs;
  existing.minMs = Math.min(existing.minMs, durationMs);
  existing.maxMs = Math.max(existing.maxMs, durationMs);
  existing.lastMs = durationMs;
  if (durationMs >= SLOW_MS) {
    existing.slowCount += 1;
  }
}

function maybeDumpStats(): void {
  completedCalls += 1;
  if (completedCalls % STATS_DUMP_EVERY === 0) {
    dumpApiPerfStats();
  }
}

function logBlock(kind: 'REQ' | 'RES' | 'ERR', data: Record<string, unknown>): void {
  console.log(
    `\n========== [API][${kind}] ==========\n${safeStringify(data)}\n====================================\n`,
  );
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function createRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizeError(error: unknown): Record<string, unknown> {
  if (!error || typeof error !== 'object') {
    return {message: String(error)};
  }
  const value = error as {
    name?: unknown;
    code?: unknown;
    message?: unknown;
    details?: unknown;
  };
  return {
    name: typeof value.name === 'string' ? value.name : 'Error',
    code: typeof value.code === 'string' ? value.code : undefined,
    message: typeof value.message === 'string' ? value.message : 'Unknown error',
    details: sanitizePayload(value.details),
  };
}

function sanitizePayload(payload: unknown): unknown {
  if (Array.isArray(payload)) {
    if (payload.length > 20) {
      return {
        truncated: true,
        length: payload.length,
        sample: payload.slice(0, 5).map(item => sanitizePayload(item)),
      };
    }
    return payload.map(item => sanitizePayload(item));
  }
  if (!isRecord(payload)) {
    return payload;
  }

  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    const low = key.toLowerCase();
    if (
      low.includes('password') ||
      low.includes('token') ||
      low.includes('authorization') ||
      low.includes('secret')
    ) {
      next[key] = '***';
      continue;
    }
    next[key] = sanitizePayload(value);
  }
  return next;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
