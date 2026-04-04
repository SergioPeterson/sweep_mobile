import { create } from 'zustand';
import type { PlatformRole } from '../auth/roles';

interface AuthState {
  role: PlatformRole | null;
  isRoleLoaded: boolean;
  setRole: (role: PlatformRole | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  role: null,
  isRoleLoaded: false,

  setRole: (role) => set({ role, isRoleLoaded: true }),
}));
