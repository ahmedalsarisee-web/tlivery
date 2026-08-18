const DEFAULT_LANDING = (code: string) =>
  `https://me-central1-tlivery-87ad0.cloudfunctions.net/clientInviteLanding?inviteCode=${encodeURIComponent(code)}`;

/** App deep link for client registration invite. */
export function buildClientInviteDeepLink(code: string): string {
  return `tlivery://client-invite?inviteCode=${encodeURIComponent(code)}`;
}

/**
 * HTTPS registration URL for WhatsApp (must be https to be tappable).
 * Prefer production web origin; never share localhost with customers.
 */
export function buildClientInviteWebLink(
  code: string,
  origin = typeof window !== 'undefined' ? window.location.origin : '',
): string {
  const configured = String(
    import.meta.env.VITE_PUBLIC_WEB_ORIGIN || '',
  )
    .trim()
    .replace(/\/$/, '');
  if (configured && !/localhost|127\.0\.0\.1/i.test(configured)) {
    return `${configured}/invite/client/${encodeURIComponent(code)}`;
  }
  const base = origin.replace(/\/$/, '');
  if (base && !/localhost|127\.0\.0\.1/i.test(base)) {
    return `${base}/invite/client/${encodeURIComponent(code)}`;
  }
  return DEFAULT_LANDING(code);
}
