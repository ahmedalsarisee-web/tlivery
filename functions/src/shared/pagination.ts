import {InputError} from "../helpers";
import type {CursorPayload} from "./types";

export function encodeCursor(value: string, id: string): string {
  return Buffer.from(
    JSON.stringify({value, id} satisfies CursorPayload),
  ).toString("base64url");
}

export function decodeCursor(
  raw: unknown,
  field: string,
): CursorPayload | null {
  if (typeof raw !== "string" || !raw.trim()) {
    return null;
  }
  try {
    const parsed = JSON.parse(
      Buffer.from(raw, "base64url").toString("utf8"),
    ) as CursorPayload;
    if (
      !parsed ||
      typeof parsed.value !== "string" ||
      typeof parsed.id !== "string" ||
      !parsed.id
    ) {
      throw new Error("invalid");
    }
    return parsed;
  } catch {
    throw new InputError(field, `${field} must be a valid cursor.`);
  }
}

export function parsePageSize(
  input: Record<string, unknown>,
  fallback = 20,
  max = 50,
): number {
  const raw = Number(input.pageSize ?? fallback);
  if (!Number.isFinite(raw)) {
    return fallback;
  }
  return Math.min(max, Math.max(1, Math.floor(raw)));
}

export function parsePage(input: Record<string, unknown>): number {
  const raw = Number(input.page ?? 1);
  if (!Number.isFinite(raw)) {
    return 1;
  }
  return Math.max(1, Math.floor(raw));
}
