

type ErrorUtilsHandler = (error: Error, isFatal?: boolean) => void;

let installed = false;

export const setupGlobalErrorHandler = (
  report?: (error: Error, isFatal: boolean) => void,
): void => {
  if (installed || typeof ErrorUtils === 'undefined') {
    return;
  }
  installed = true;

  const defaultHandler = ErrorUtils.getGlobalHandler();

  const handler: ErrorUtilsHandler = (error, isFatal) => {

    report?.(error, !!isFatal);

    if (__DEV__) {

      console.error('Global error:', error, {isFatal});
    }


    defaultHandler?.(error, isFatal);
  };

  ErrorUtils.setGlobalHandler(handler);
};
