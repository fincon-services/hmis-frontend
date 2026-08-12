import { useEffect } from 'react';
import { apiClient } from '@/api/client';
import { useAuthStore } from '@/stores/authStore';
import type { Permission, RoleScreenAssignment, Screen } from '@/features/acl/types/acl.types';

/**
 * The backend serializes non-primary-key integer columns (foreign keys, pivot
 * ids) as JSON strings while primary-key `id` columns come back as real
 * numbers — see the matching comment in `features/acl/api/aclApi.ts`. Coerce
 * before using these as Map keys so lookups actually match.
 */
const toNum = (v: number | string): number => (typeof v === 'string' ? parseInt(v, 10) : v);

/**
 * Best-effort self-hydration of the active role's screen/permission grants.
 *
 * The API has no self-service "my permissions" endpoint (see MODULE_MAP.md):
 * resolving a full route_key -> permission[] map requires GET
 * /acl/roles/{id}/screens, /acl/screens, and /acl/permissions, all three of
 * which are themselves gated behind admin-only screens (acl.role-screens,
 * acl.screens, acl.permissions). For an ordinary clinical/HR role this will
 * 403 — that's expected, not an error condition. When it does, action-level
 * `can()` checks simply have no data to restrict on and stay permissive;
 * screen-level access (the real security boundary) is entirely unaffected
 * and keeps working via the existing deniedScreens self-healing mechanism.
 *
 * Mount once, high in the authenticated tree (AppShell), so it re-runs
 * whenever the active role changes.
 */
export function useAuthorizationHydration() {
  const activeRoleId = useAuthStore((s) => s.activeRoleId);
  const permissionsResolved = useAuthStore((s) => s.permissionsResolved);

  useEffect(() => {
    if (!activeRoleId || permissionsResolved) return;
    let cancelled = false;

    Promise.all([
      apiClient.get<RoleScreenAssignment[]>(`/acl/roles/${activeRoleId}/screens`, { screenKey: 'acl.role-screens' }),
      apiClient.get<Screen[]>('/acl/screens', { screenKey: 'acl.screens' }),
      apiClient.get<Permission[]>('/acl/permissions', { screenKey: 'acl.permissions' }),
    ])
      .then(([assignmentRes, screensRes, permissionsRes]) => {
        if (cancelled) return;

        const screenIdToRouteKey = new Map(screensRes.data.map((s) => [toNum(s.id), s.route_key]));
        const permissionIdToName = new Map(permissionsRes.data.map((p) => [toNum(p.id), p.name]));

        const map: Record<string, string[]> = {};
        for (const row of assignmentRes.data) {
          const routeKey = screenIdToRouteKey.get(toNum(row.screen_id));
          if (!routeKey) continue;
          map[routeKey] = row.permission_ids.map((id) => permissionIdToName.get(toNum(id))).filter((name): name is string => !!name);
        }

        useAuthStore.getState().setScreenPermissions(map);
      })
      .catch(() => {
        // Ordinary role without acl.* access — expected, not an error. Leave screenPermissions empty.
      })
      .finally(() => {
        if (!cancelled) useAuthStore.getState().markPermissionsResolved();
      });

    return () => {
      cancelled = true;
    };
  }, [activeRoleId, permissionsResolved]);
}
