import {QueryClient} from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: 'offlineFirst',
      retry: 2,
      staleTime: 30_000,
      gcTime: 10 * 60_000,
      refetchOnReconnect: true,
    },
    mutations: {
      networkMode: 'online',
      retry: 0,
    },
  },
});
