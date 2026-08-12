import type { ReactNode } from 'react';
import { useAuthStore } from '@/stores/authStore';

/**
 * Centralized frontend authorization layer.
 *
 * Two tiers, matching what the backend actually enforces (see
 * useAuthorizationHydration for the full explanation):
 *
 * - Screen-level (`can(screen)` / `hasScreen`): always accurate. The
 *   backend's `screen:<route_key>` middleware is the real security
 *   boundary; the frontend renders optimistically and self-heals a screen
 *   out of the nav/UI the first time it 403s.
 * - Action-level (`can(screen, permission)`): best-effort. Populated only
 *   when the active role can self-resolve its own grants (effectively
 *   admin-tier roles today, since there's no self-service endpoint). When
 *   unresolved, an action is never treated as denied just because we lack
 *   data — only an explicit, fetched grant list can restrict it.
 *
 * The Laravel API remains the final authorization authority in every case.
 */
export function useAuthorization() {
  const deniedScreens = useAuthStore((s) => s.deniedScreens);
  const screenPermissions = useAuthStore((s) => s.screenPermissions);
  const permissionsResolved = useAuthStore((s) => s.permissionsResolved);
  const roles = useAuthStore((s) => s.roles);

  /** Screen-level: false only once we've actually observed a 403 for this screen this session. */
  function hasScreen(routeKey: string): boolean {
    return !deniedScreens.has(routeKey);
  }

  /**
   * `can(routeKey)` — screen-level only.
   * `can(routeKey, permission)` — screen-level AND (if resolved) action-level.
   */
  function can(routeKey: string, permission?: string): boolean {
    if (!hasScreen(routeKey)) return false;
    if (!permission) return true;

    const grantedForScreen = screenPermissions[routeKey];
    if (!grantedForScreen) return true; // unresolved — don't fabricate a restriction

    return grantedForScreen.includes(permission);
  }

  function canAny(checks: Array<[routeKey: string, permission?: string]>): boolean {
    return checks.some(([routeKey, permission]) => can(routeKey, permission));
  }

  function canAll(checks: Array<[routeKey: string, permission?: string]>): boolean {
    return checks.every(([routeKey, permission]) => can(routeKey, permission));
  }

  function hasRole(roleName: string): boolean {
    return roles.some((r) => r.name === roleName);
  }

  function hasAnyRole(roleNames: string[]): boolean {
    return roleNames.some((name) => hasRole(name));
  }

  function hasAllRoles(roleNames: string[]): boolean {
    return roleNames.every((name) => hasRole(name));
  }

  return { can, canAny, canAll, hasScreen, hasRole, hasAnyRole, hasAllRoles, permissionsResolved, roles };
}

/** @deprecated prefer `useAuthorization().hasScreen` — kept for the existing call sites. */
export function usePermission(routeKey: string): { denied: boolean } {
  const denied = useAuthStore((s) => s.deniedScreens.has(routeKey));
  return { denied };
}

interface CanProps {
  /** route_key this content requires screen-level access to. */
  screen: string;
  /** Optional action-level permission name (e.g. "create", "update", "delete") within that screen. */
  permission?: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function Can({ screen, permission, children, fallback = null }: CanProps) {
  const { can } = useAuthorization();
  return can(screen, permission) ? <>{children}</> : <>{fallback}</>;
}

interface CanAnyProps {
  checks: Array<[routeKey: string, permission?: string]>;
  children: ReactNode;
  fallback?: ReactNode;
}

export function CanAny({ checks, children, fallback = null }: CanAnyProps) {
  const { canAny } = useAuthorization();
  return canAny(checks) ? <>{children}</> : <>{fallback}</>;
}

interface RoleGateProps {
  role: string | string[];
  /** When `role` is an array: require all of them (default: any). */
  requireAll?: boolean;
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGate({ role, requireAll = false, children, fallback = null }: RoleGateProps) {
  const { hasRole, hasAnyRole, hasAllRoles } = useAuthorization();
  const roleNames = Array.isArray(role) ? role : [role];
  const allowed = Array.isArray(role) ? (requireAll ? hasAllRoles(roleNames) : hasAnyRole(roleNames)) : hasRole(role);
  return allowed ? <>{children}</> : <>{fallback}</>;
}
