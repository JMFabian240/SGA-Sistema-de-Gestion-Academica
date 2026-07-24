import { createTRPCReact } from '@trpc/react-query';
import { createTRPCProxyClient, httpLink } from '@trpc/client';
import { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '../../../back-end/src/router';

export const trpc = createTRPCReact<AppRouter>();
export type RouterOutput = inferRouterOutputs<AppRouter>;

export const trpcVanilla = createTRPCProxyClient<AppRouter>({
  links: [
    httpLink({
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
