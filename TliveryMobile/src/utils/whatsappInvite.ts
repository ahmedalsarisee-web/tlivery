import {Linking, Share} from 'react-native';

export function phoneToWhatsAppDigits(phoneE164: string): string {
  return phoneE164.replace(/\D/g, '');
}

export function buildDriverInviteDeepLink(code: string): string {
  return `tlivery://driver-invite?inviteCode=${encodeURIComponent(code)}`;
}

export function buildWhatsAppInviteUrl(
  phoneE164: string,
  message: string,
): string {
  const digits = phoneToWhatsAppDigits(phoneE164);
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export async function openWhatsAppInvite(params: {
  phoneE164: string;
  message: string;
}): Promise<void> {
  const url = buildWhatsAppInviteUrl(params.phoneE164, params.message);
  await Linking.openURL(url);
}

export async function shareInviteCode(code: string): Promise<void> {
  await Share.share({message: code});
}
