import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../../../packages/back-end/src/router';

export const trpc = createTRPCReact<AppRouter>();
