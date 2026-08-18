type CloseFn = (() => void) | null;

let closeImmediate: CloseFn = null;

export function registerCustomDrawerCloseImmediate(fn: CloseFn): void {
  closeImmediate = fn;
}

export function closeCustomDrawerImmediate(): void {
  closeImmediate?.();
}
