import { apiClient } from '@/api/client';
import type { MessageResponse } from '@/types/api';
import type {
  AclUser,
  AclUserFormValues,
  AssignRoleScreensRequest,
  Module,
  ModuleFormValues,
  Permission,
  PermissionFormValues,
  Role,
  RoleFormValues,
  RoleScreenAssignment,
  RoleUsersResponse,
  Screen,
  ScreenFormValues,
} from '../types/acl.types';

const ROLES_SCREEN = 'acl.roles';
const MODULES_SCREEN = 'acl.modules';
const SCREENS_SCREEN = 'acl.screens';
const PERMISSIONS_SCREEN = 'acl.permissions';
const ROLE_SCREENS_SCREEN = 'acl.role-screens';
const USERS_SCREEN = 'admin.users';

/**
 * The backend's SQL Server driver serializes non-primary-key integer columns
 * (foreign keys, sort_order, pivot ids) as JSON strings while primary-key `id`
 * columns come back as real numbers — confirmed by inspecting raw responses.
 * Every ACL id/foreign-key field is normalized to a real `number` here, at the
 * API boundary, so the rest of the frontend (Map/Set keys, `===` comparisons)
 * can rely on consistent numeric types without knowing about this quirk.
 */
const toNum = (v: number | string): number => (typeof v === 'string' ? parseInt(v, 10) : v);

function normalizePermission(p: Permission): Permission {
  return { ...p, id: toNum(p.id) };
}

function normalizeScreen(s: Screen): Screen {
  return {
    ...s,
    id: toNum(s.id),
    module_id: toNum(s.module_id),
    sort_order: toNum(s.sort_order),
    permissions: s.permissions?.map(normalizePermission),
  };
}

function normalizeModule(m: Module): Module {
  return {
    ...m,
    id: toNum(m.id),
    parent_id: m.parent_id == null ? null : toNum(m.parent_id),
    sort_order: toNum(m.sort_order),
    children: m.children?.map(normalizeModule),
    screens: m.screens?.map(normalizeScreen),
  };
}

function normalizeRole(r: Role): Role {
  return { ...r, id: toNum(r.id) };
}

function normalizeAclUser(u: AclUser): AclUser {
  return { ...u, id: toNum(u.id), employee_id: toNum(u.employee_id), roles: u.roles?.map(normalizeRole) };
}

function normalizeRoleScreenAssignment(a: RoleScreenAssignment): RoleScreenAssignment {
  return { ...a, screen_id: toNum(a.screen_id), permission_ids: (a.permission_ids ?? []).map(toNum) };
}

export const rolesApi = {
  list: () => apiClient.get<Role[]>('/acl/roles', { screenKey: ROLES_SCREEN }).then((r) => r.data.map(normalizeRole)),
  create: (payload: RoleFormValues) => apiClient.post<Role>('/acl/roles', payload, { screenKey: ROLES_SCREEN }).then((r) => normalizeRole(r.data)),
  update: (id: number, payload: RoleFormValues) =>
    apiClient.put<Role>(`/acl/roles/${id}`, payload, { screenKey: ROLES_SCREEN }).then((r) => normalizeRole(r.data)),
  remove: (id: number) => apiClient.delete<MessageResponse>(`/acl/roles/${id}`, { screenKey: ROLES_SCREEN }).then((r) => r.data),
  removeBulk: (ids: number[]) => apiClient.post<MessageResponse>('/acl/roles/delete-bulk', { ids }, { screenKey: ROLES_SCREEN }).then((r) => r.data),
  usersForRole: (roleId: number, departmentId?: number) =>
    apiClient
      .get<RoleUsersResponse>(`/acl/roles/${roleId}/users`, { params: { department_id: departmentId }, screenKey: ROLES_SCREEN })
      .then((r) => ({ assigned: r.data.assigned.map(normalizeAclUser), unassigned: r.data.unassigned.map(normalizeAclUser) })),
  assignUsers: (roleId: number, userIds: number[]) =>
    apiClient.post<MessageResponse>(`/acl/roles/${roleId}/users/assign`, { user_ids: userIds }, { screenKey: ROLES_SCREEN }).then((r) => r.data),
  unassignUsers: (roleId: number, userIds: number[]) =>
    apiClient.post<MessageResponse>(`/acl/roles/${roleId}/users/unassign`, { user_ids: userIds }, { screenKey: ROLES_SCREEN }).then((r) => r.data),
  setPrimaryRole: (userId: number, roleId: number) =>
    apiClient.post<MessageResponse>(`/acl/users/${userId}/primary-role`, { role_id: roleId }, { screenKey: ROLES_SCREEN }).then((r) => r.data),
};

export const roleScreensApi = {
  currentAssignment: (roleId: number) =>
    apiClient
      .get<RoleScreenAssignment[]>(`/acl/roles/${roleId}/screens`, { screenKey: ROLE_SCREENS_SCREEN })
      .then((r) => r.data.map(normalizeRoleScreenAssignment)),
  assign: (roleId: number, payload: AssignRoleScreensRequest) =>
    apiClient.post<MessageResponse>(`/acl/roles/${roleId}/screens`, payload, { screenKey: ROLE_SCREENS_SCREEN }).then((r) => r.data),
};

export const modulesApi = {
  /** Tree-shaped: top-level modules with nested children + screens. */
  tree: () => apiClient.get<Module[]>('/acl/modules', { screenKey: MODULES_SCREEN }).then((r) => r.data.map(normalizeModule)),
  create: (payload: ModuleFormValues) =>
    apiClient.post<Module>('/acl/modules', payload, { screenKey: MODULES_SCREEN }).then((r) => normalizeModule(r.data)),
  update: (id: number, payload: ModuleFormValues) =>
    apiClient.put<Module>(`/acl/modules/${id}`, payload, { screenKey: MODULES_SCREEN }).then((r) => normalizeModule(r.data)),
  remove: (id: number) => apiClient.delete<MessageResponse>(`/acl/modules/${id}`, { screenKey: MODULES_SCREEN }).then((r) => r.data),
  removeBulk: (ids: number[]) => apiClient.post<MessageResponse>('/acl/modules/delete-bulk', { ids }, { screenKey: MODULES_SCREEN }).then((r) => r.data),
};

export const screensApi = {
  list: () => apiClient.get<Screen[]>('/acl/screens', { screenKey: SCREENS_SCREEN }).then((r) => r.data.map(normalizeScreen)),
  create: (payload: ScreenFormValues) =>
    apiClient.post<Screen>('/acl/screens', payload, { screenKey: SCREENS_SCREEN }).then((r) => normalizeScreen(r.data)),
  update: (id: number, payload: ScreenFormValues) =>
    apiClient.put<Screen>(`/acl/screens/${id}`, payload, { screenKey: SCREENS_SCREEN }).then((r) => normalizeScreen(r.data)),
  remove: (id: number) => apiClient.delete<MessageResponse>(`/acl/screens/${id}`, { screenKey: SCREENS_SCREEN }).then((r) => r.data),
  removeBulk: (ids: number[]) => apiClient.post<MessageResponse>('/acl/screens/delete-bulk', { ids }, { screenKey: SCREENS_SCREEN }).then((r) => r.data),
};

export const permissionsApi = {
  list: () => apiClient.get<Permission[]>('/acl/permissions', { screenKey: PERMISSIONS_SCREEN }).then((r) => r.data.map(normalizePermission)),
  create: (payload: PermissionFormValues) =>
    apiClient.post<Permission>('/acl/permissions', payload, { screenKey: PERMISSIONS_SCREEN }).then((r) => normalizePermission(r.data)),
  update: (id: number, payload: PermissionFormValues) =>
    apiClient.put<Permission>(`/acl/permissions/${id}`, payload, { screenKey: PERMISSIONS_SCREEN }).then((r) => normalizePermission(r.data)),
  remove: (id: number) => apiClient.delete<MessageResponse>(`/acl/permissions/${id}`, { screenKey: PERMISSIONS_SCREEN }).then((r) => r.data),
  removeBulk: (ids: number[]) =>
    apiClient.post<MessageResponse>('/acl/permissions/delete-bulk', { ids }, { screenKey: PERMISSIONS_SCREEN }).then((r) => r.data),
};

export const aclUsersApi = {
  list: () => apiClient.get<AclUser[]>('/admin/users', { screenKey: USERS_SCREEN }).then((r) => r.data.map(normalizeAclUser)),
  get: (id: number) => apiClient.get<AclUser>(`/admin/users/${id}`, { screenKey: USERS_SCREEN }).then((r) => normalizeAclUser(r.data)),
  create: (payload: AclUserFormValues) =>
    apiClient.post<AclUser>('/admin/users', payload, { screenKey: USERS_SCREEN }).then((r) => normalizeAclUser(r.data)),
  update: (id: number, payload: AclUserFormValues) =>
    apiClient.put<AclUser>(`/admin/users/${id}`, payload, { screenKey: USERS_SCREEN }).then((r) => normalizeAclUser(r.data)),
  remove: (id: number) => apiClient.delete<MessageResponse>(`/admin/users/${id}`, { screenKey: USERS_SCREEN }).then((r) => r.data),
  removeBulk: (ids: number[]) => apiClient.post<MessageResponse>('/admin/users/delete-bulk', { ids }, { screenKey: USERS_SCREEN }).then((r) => r.data),
};
