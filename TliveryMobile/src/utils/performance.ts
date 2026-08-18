

type Perf = {
  now: () => number;
  mark?: (name: string) => void;
  measure?: (name: string, start?: string, end?: string) => void;
  getEntriesByName?: (name: string, type?: string) => {duration: number}[];
  clearMarks?: (name?: string) => void;
  clearMeasures?: (name?: string) => void;
};

const perf: Perf | undefined =
  typeof globalThis !== 'undefined'
    ? (globalThis as {performance?: Perf}).performance
    : undefined;

const now = (): number => (perf?.now ? perf.now() : Date.now());


export const mark = (name: string): void => {
  perf?.mark?.(name);
};


export const measure = (
  name: string,
  startMark: string,
  endMark?: string,
): number => {
  if (perf?.measure && perf.getEntriesByName) {
    try {
      perf.measure(name, startMark, endMark);
      const entries = perf.getEntriesByName(name, 'measure');
      const last = entries[entries.length - 1];
      if (last) {
        return Math.round(last.duration);
      }
    } catch {

    }
  }
  return 0;
};


export const timeSync = <T>(label: string, fn: () => T): {result: T; ms: number} => {
  const start = now();
  const result = fn();
  const ms = Math.round(now() - start);

  const startName = `${label}:start`;
  mark(startName);
  measure(label, startName);
  return {result, ms};
};

export const perfNow = now;
