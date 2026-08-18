const DEFAULT_PROJECT = 'tlivery-87ad0';
const DEFAULT_REGION = 'me-central1';

/** App deep link for client registration invite. */
export function buildClientInviteDeepLink(code: string): string {
  return `tlivery://client-invite?inviteCode=${encodeURIComponent(code)}`;
}

/** Always HTTPS so WhatsApp makes the link tappable. */
export function buildClientInviteWebLink(code: string): string {
  const configured = (
    process.env.WEB_APP_ORIGIN ||
    process.env.PUBLIC_WEB_APP_ORIGIN ||
    ''
  )
    .trim()
    .replace(/\/$/, '');
  if (configured && !/localhost|127\.0\.0\.1/i.test(configured)) {
    return `${configured}/invite/client/${encodeURIComponent(code)}`;
  }
  return `https://${DEFAULT_REGION}-${DEFAULT_PROJECT}.cloudfunctions.net/clientInviteLanding?inviteCode=${encodeURIComponent(code)}`;
}

export function buildClientInviteShareLinks(code: string): {
  appLink: string;
  webLink: string;
  primaryLink: string;
} {
  const appLink = buildClientInviteDeepLink(code);
  const webLink = buildClientInviteWebLink(code);
  return {
    appLink,
    webLink,
    primaryLink: webLink,
  };
}
