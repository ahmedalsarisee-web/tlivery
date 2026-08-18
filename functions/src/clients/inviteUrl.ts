/** Public HTTPS invite URL (WhatsApp-clickable). Avoids wasel:// and localhost. */
export function buildPublicClientInviteUrl(code: string): string {
  const configured = (
    process.env.PUBLIC_WEB_APP_ORIGIN ||
    process.env.WEB_APP_ORIGIN ||
    ""
  ).trim();
  if (configured && !/localhost|127\.0\.0\.1/i.test(configured)) {
    return `${configured.replace(/\/$/, "")}/invite/client/${encodeURIComponent(code)}`;
  }
  const project =
    process.env.GCLOUD_PROJECT ||
    process.env.GCP_PROJECT ||
    "tlivery-87ad0";
  return `https://me-central1-${project}.cloudfunctions.net/clientInviteLanding?inviteCode=${encodeURIComponent(code)}`;
}
