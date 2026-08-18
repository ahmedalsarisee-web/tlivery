import {Linking, Share} from 'react-native';

export function buildIssuedAccountCredentialsMessage(params: {
  roleLabel: string;
  username: string;
  password: string;
  companyName?: string;
}): string {
  const company = params.companyName?.trim();
  const header = company
    ? `Your ${params.roleLabel} login for ${company} on Tlivery (تليفري)`
    : `Your ${params.roleLabel} login on Tlivery (تليفري)`;
  return `${header}\n\nUsername: ${params.username}\nPassword: ${params.password}\n\nOpen the Tlivery Operations Gateway and sign in with this username and password.`;
}

export async function shareCredentialsText(message: string): Promise<void> {
  await Share.share({message});
}

export async function openWhatsAppCredentials(message: string): Promise<void> {
  const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
  await Linking.openURL(url);
}
