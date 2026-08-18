/** Strip quotes/whitespace that break Maps JS when copied into `.env`. */
export function sanitizeGoogleMapsApiKey(raw: string | undefined): string {
  let value = (raw ?? '').trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1).trim();
  }
  return value;
}

/** App env from Vite (`VITE_*` in `.env`). */
export const appEnv = {
  googleMapsApiKey: sanitizeGoogleMapsApiKey(
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  ),
};

export function hasGoogleMapsKey(): boolean {
  return appEnv.googleMapsApiKey.length > 0;
}
