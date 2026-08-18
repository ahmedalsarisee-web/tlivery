import {Timestamp} from "firebase-admin/firestore";
import {InputError, requiredString} from "../helpers";

export function requiredAlias(
  input: Record<string, unknown>,
  fields: string[],
  maxLength: number,
): string {
  for (const field of fields) {
    if (typeof input[field] === "string" && input[field].trim()) {
      return requiredString(input, field, maxLength);
    }
  }
  throw new InputError(fields[0], `${fields[0]} is required.`);
}

export function serializeTimestamp(value: unknown): string | null {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as {toDate: unknown}).toDate === "function"
  ) {
    return (value as {toDate: () => Date}).toDate().toISOString();
  }
  if (typeof value === "string") {
    return value;
  }
  return null;
}
