import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Side = 'client' | 'merchant';

interface AuthPayload {
  id: string | number;
  name: string;
  side: Side;
  token: string;
}

interface User {
  id: string | number;
  name: string;
  side: Side;
}

interface UserState {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  side: Side;
  expiresAt: number | null;
  login: (payload: AuthPayload, remember?: boolean) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoggedIn: false,
      side: 'client',
      expiresAt: null,
      login: (payload, remember = false) => {
        const ttl = (remember ? 7 : 1) * 24 * 60 * 60 * 1000;
        set({
          user: { id: payload.id, name: payload.name, side: payload.side },
          token: payload.token,
          isLoggedIn: true,
          side: payload.side,
          expiresAt: Date.now() + ttl,
        });
      },
      logout: () => set({ user: null, token: null, isLoggedIn: false, expiresAt: null }),
    }),
    {
      name: 'evlp-user-storage',
    }
  )
);
