import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthRole {
  id: number;
  name: string;
}

export interface AuthUser {
  id: number;
  username: string;
  email: string | null;
  is_active: boolean;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  roles: AuthRole[];
  activeRoleId: number | null;
  /**
   * Screens the active role has been denied (403) during this session.
   * Populated reactively by the axios interceptor since the API has no
   * self-service "my granted screens" endpoint (see MODULE_MAP.md gap
   * notes) — this lets the sidebar hide items the user can't reach
   * without needing to probe every screen up front. Session-only, not
   * persisted: it must reset on login/role switch since grants differ.
   */
  deniedScreens: Set<string>;
  /**
   * route_key -> granted permission names (e.g. "create", "update") for the
   * active role, best-effort self-fetched via GET /acl/roles/{id}/screens.
   * That endpoint (and the /acl/screens + /acl/permissions catalogs needed
   * to resolve it) require the acl.role-screens/acl.screens/acl.permissions
   * screens themselves, which ordinary non-admin roles won't hold — for
   * them this stays empty and action-level `can()` checks fall back to
   * permissive (unknown is never treated as "denied"; only an explicit,
   * resolved grant list can restrict). See useAuthorizationHydration.
   */
  screenPermissions: Record<string, string[]>;
  /** Whether the best-effort screenPermissions fetch has finished (success or graceful failure) for the current active role. */
  permissionsResolved: boolean;
  setSession: (session: { token: string; user: AuthUser; roles: AuthRole[]; activeRoleId: number }) => void;
  setActiveRoleId: (roleId: number) => void;
  denyScreen: (routeKey: string) => void;
  setScreenPermissions: (map: Record<string, string[]>) => void;
  markPermissionsResolved: () => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      roles: [],
      activeRoleId: null,
      deniedScreens: new Set(),
      screenPermissions: {},
      permissionsResolved: false,
      setSession: ({ token, user, roles, activeRoleId }) =>
        set({ token, user, roles, activeRoleId, deniedScreens: new Set(), screenPermissions: {}, permissionsResolved: false }),
      setActiveRoleId: (roleId) => set({ activeRoleId: roleId, deniedScreens: new Set(), screenPermissions: {}, permissionsResolved: false }),
      denyScreen: (routeKey) =>
        set((state) => ({ deniedScreens: new Set(state.deniedScreens).add(routeKey) })),
      setScreenPermissions: (map) => set({ screenPermissions: map }),
      markPermissionsResolved: () => set({ permissionsResolved: true }),
      clearSession: () =>
        set({ token: null, user: null, roles: [], activeRoleId: null, deniedScreens: new Set(), screenPermissions: {}, permissionsResolved: false }),
    }),
    {
      name: 'hmis-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        roles: state.roles,
        activeRoleId: state.activeRoleId,
      }),
    },
  ),
);
