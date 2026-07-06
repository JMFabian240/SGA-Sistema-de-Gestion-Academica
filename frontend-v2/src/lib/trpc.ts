import { createTRPCReact } from '@trpc/react-query';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../../packages/back-end/src/router';

export const trpc = createTRPCReact<AppRouter>();

export const trpcVanilla = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: import.meta.env.VITE_API_URL || '/trpc',
      headers() {
        const token = localStorage.getItem('auth_token');
        return {
          Authorization: token ? `Bearer ${token}` : undefined,
        };
      },
    }),
  ],
  transformer: undefined
});
