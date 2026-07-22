import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpLink } from '@trpc/client';
import { trpc } from './lib/trpc';
import { router } from './router';
import { Toaster } from 'react-hot-toast';

// === CONFIGURACIÓN DE TRPC Y REACT QUERY ===
const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
const API_URL = isTauri ? 'http://127.0.0.1:3000/trpc' : (import.meta.env.VITE_API_URL || '/trpc');

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: API_URL,
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

// === RAÍZ DE LA APLICACIÓN ===
function App() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster position="top-right" />
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export default App;
