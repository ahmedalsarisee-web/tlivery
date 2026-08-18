import {ErrorInfo, ReactNode} from 'react';

export interface ErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

export interface ErrorBoundaryState {
  error: Error | null;
}

export interface ErrorFallbackProps {
  error: Error | null;
  onReset: () => void;
}
