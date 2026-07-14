import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import React, { useEffect } from 'react';
import { trpc } from '../lib/trpc';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, token, login, logout } = useAuthStore();

  const { data, isLoading, isError } = trpc.auth.me.useQuery(undefined, {
    enabled: isAuthenticated && !user, // Solo ejecutar si estamos autenticados pero perdimos el usuario en memoria (ej. reload)
    retry: false
  });

  useEffect(() => {
    if (data && token) {
      // @ts-ignore
      login(data, token);
    } else if (isError) {
      logout();
    }
  }, [data, isError, login, logout, token]);

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  if (isLoading && !user) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#f8fafc]">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return <>{children}</>;
}
