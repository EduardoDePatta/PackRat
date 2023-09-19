import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from 'server/src/routes/trpcRouter';
import { api } from './constants/api';

console.log('api', api);

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${api}/trpc`,
      async headers() {
        const accessToken = localStorage.getItem('token') ?? '';
        return {
          authorization: accessToken ? `Bearer ${accessToken}` : '',
        };
      },
    }),
  ],
  transformer: undefined,
});
