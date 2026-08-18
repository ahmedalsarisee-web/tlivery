export function addMonths(d: Date, delta: number): Date {
  const x = new Date(d);
  x.setMonth(x.getMonth() + delta);
  return x;
}

export function toLocalIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseLocalIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function shortWeekdayLabels(localeTag: string): string[] {
  const labels: string[] = [];
  const ref = new Date(2023, 0, 1);
  for (let i = 0; i < 7; i++) {
    const x = new Date(ref);
    x.setDate(ref.getDate() + i);
    labels.push(x.toLocaleDateString(localeTag, {weekday: 'short'}).toUpperCase());
  }
  return labels;
}

export function monthYearTitle(d: Date, localeTag: string): string {
  return d.toLocaleDateString(localeTag, {month: 'long', year: 'numeric'});
}

export function formatChipDate(iso: string, localeTag: string): string {
  return parseLocalIsoDate(iso).toLocaleDateString(localeTag, {
    day: 'numeric',
    month: 'short',
  });
}

export function buildMonthGrid(
  year: number,
  monthIndex: number,
): (number | null)[] {
  const first = new Date(year, monthIndex, 1);
  const pad = first.getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < pad; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  return cells;
}

export function getCalendarGridCellSize(
  windowWidth: number,
  safeInsetLeft: number,
  safeInsetRight: number,
): number {
  const sheetHorizontalPad = 24 + safeInsetLeft + 24 + safeInsetRight;
  const bodyHorizontalPad = 4;
  const interCellGaps = 5 * 6;
  const innerWidth = windowWidth - sheetHorizontalPad - bodyHorizontalPad;
  return Math.max(34, Math.floor((innerWidth - interCellGaps) / 7));
}
