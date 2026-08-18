import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;

export const appEnv = {
  envName: process.env.EXPO_PUBLIC_ENV_NAME ?? extra.envName ?? 'dev',
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? extra.apiUrl ?? '',
  apiTimeoutMs:
    Number(process.env.EXPO_PUBLIC_API_TIMEOUT_MS ?? extra.apiTimeoutMs ?? 15000) ||
    15000,
  googleMapsApiKey:
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? extra.googleMapsApiKey ?? '',
};

export function hasGoogleMapsKey(): boolean {
  return Boolean(appEnv.googleMapsApiKey.trim());
}
