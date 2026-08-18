import {useSyncExternalStore} from 'react';

const DEBOUNCE_MS = 280;

/** Nesting depth for concurrent API calls. */
let requestDepth = 0;
let overlayVisible = false;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach(listener => listener());
}

function scheduleShowOverlay(): void {
  if (debounceTimer !== null) {
    return;
  }
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    if (requestDepth > 0 && !overlayVisible) {
      overlayVisible = true;
      emit();
    }
  }, DEBOUNCE_MS);
}

function cancelPendingShow(): void {
  if (debounceTimer !== null) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
}

function hideOverlay(): void {
  cancelPendingShow();
  if (overlayVisible) {
    overlayVisible = false;
    emit();
  }
}

/** Call at the start of each tracked API request. */
export function onApiRequestEnter(): void {
  const isOuter = requestDepth === 0;
  requestDepth += 1;
  if (isOuter) {
    scheduleShowOverlay();
  }
}

/** Call in `finally` of each tracked API request. */
export function onApiRequestLeave(): void {
  requestDepth = Math.max(0, requestDepth - 1);
  if (requestDepth === 0) {
    hideOverlay();
  }
}

export async function withApiLoading<T>(fn: () => Promise<T>): Promise<T> {
  onApiRequestEnter();
  try {
    return await fn();
  } finally {
    onApiRequestLeave();
  }
}

export function subscribeApiLoadingOverlay(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getApiLoadingOverlayVisible(): boolean {
  return overlayVisible;
}

export function useApiLoadingOverlayVisible(): boolean {
  return useSyncExternalStore(
    subscribeApiLoadingOverlay,
    getApiLoadingOverlayVisible,
    getApiLoadingOverlayVisible,
  );
}
