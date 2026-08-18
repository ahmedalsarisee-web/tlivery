import {RESET_VALUE} from "firebase-functions/v2/options";

/**
 * Options for list callables that hit on app open / primary tabs.
 * Use RESET_VALUE to explicitly clear any previously deployed minInstances.
 * This avoids always-on Cloud Run min-instance charges in me-central1.
 */
export const hotListCallableOptions = {
  minInstances: RESET_VALUE,
  maxInstances: 10,
} as const;
