import { create } from 'zustand';

export interface User {
  id: string;
  nombre: string;
  name: string;
  role: string;
  roles?: string[];
  permisosModulos?: { modulo: string, nivel: string }[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (userData: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('auth_token') || null,
  isAuthenticated: !!localStorage.getItem('auth_token'),

  login: (userData, token) => {
    localStorage.setItem('auth_token', token);
    set({ user: userData, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
