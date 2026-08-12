import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient } from '@/api/queryClient';
import { rolesApi, roleScreensApi, modulesApi, screensApi, permissionsApi, aclUsersApi } from '../api/aclApi';
import type { AclUserFormValues, AssignRoleScreensRequest, ModuleFormValues, PermissionFormValues, RoleFormValues, ScreenFormValues } from '../types/acl.types';

export const aclKeys = {
  roles: ['acl-roles'] as const,
  role: (id: number) => ['acl-roles', id] as const,
  roleUsers: (id: number) => ['acl-roles', id, 'users'] as const,
  roleScreens: (id: number) => ['acl-roles', id, 'screens'] as const,
  modules: ['acl-modules'] as const,
  screens: ['acl-screens'] as const,
  permissions: ['acl-permissions'] as const,
  users: ['acl-users'] as const,
  user: (id: number) => ['acl-users', id] as const,
};

// ---- Roles ----
export function useRoles() {
  return useQuery({ queryKey: aclKeys.roles, queryFn: rolesApi.list });
}
export function useCreateRole() {
  return useMutation({
    mutationFn: (payload: RoleFormValues) => rolesApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: aclKeys.roles }),
  });
}
export function useUpdateRole() {
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: RoleFormValues }) => rolesApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: aclKeys.roles }),
  });
}
export function useDeleteRole() {
  return useMutation({
    mutationFn: (id: number) => rolesApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: aclKeys.roles }),
  });
}
export function useDeleteRolesBulk() {
  return useMutation({
    mutationFn: (ids: number[]) => rolesApi.removeBulk(ids),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: aclKeys.roles }),
  });
}

// ---- Role <-> Users ----
export function useRoleUsers(roleId: number, departmentId?: number) {
  return useQuery({
    queryKey: [...aclKeys.roleUsers(roleId), departmentId],
    queryFn: () => rolesApi.usersForRole(roleId, departmentId),
    enabled: !!roleId,
  });
}
export function useAssignUsersToRole(roleId: number) {
  return useMutation({
    mutationFn: (userIds: number[]) => rolesApi.assignUsers(roleId, userIds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: aclKeys.roleUsers(roleId) }),
  });
}
export function useUnassignUsersFromRole(roleId: number) {
  return useMutation({
    mutationFn: (userIds: number[]) => rolesApi.unassignUsers(roleId, userIds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: aclKeys.roleUsers(roleId) }),
  });
}
export function useSetPrimaryRole() {
  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: number; roleId: number }) => rolesApi.setPrimaryRole(userId, roleId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: aclKeys.users }),
  });
}

// ---- Role <-> Screens/Permissions assignment ----
export function useRoleScreenAssignment(roleId: number) {
  return useQuery({
    queryKey: aclKeys.roleScreens(roleId),
    queryFn: () => roleScreensApi.currentAssignment(roleId),
    enabled: !!roleId,
  });
}
export function useSaveRoleScreenAssignment(roleId: number) {
  return useMutation({
    mutationFn: (payload: AssignRoleScreensRequest) => roleScreensApi.assign(roleId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: aclKeys.roleScreens(roleId) }),
  });
}

// ---- Modules ----
export function useModuleTree() {
  return useQuery({ queryKey: aclKeys.modules, queryFn: modulesApi.tree });
}
export function useCreateModule() {
  return useMutation({
    mutationFn: (payload: ModuleFormValues) => modulesApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: aclKeys.modules }),
  });
}
export function useUpdateModule() {
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ModuleFormValues }) => modulesApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: aclKeys.modules }),
  });
}
export function useDeleteModule() {
  return useMutation({
    mutationFn: (id: number) => modulesApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: aclKeys.modules }),
  });
}

// ---- Screens ----
export function useScreens() {
  return useQuery({ queryKey: aclKeys.screens, queryFn: screensApi.list });
}
export function useCreateScreen() {
  return useMutation({
    mutationFn: (payload: ScreenFormValues) => screensApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: aclKeys.screens }),
  });
}
export function useUpdateScreen() {
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ScreenFormValues }) => screensApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: aclKeys.screens }),
  });
}
export function useDeleteScreen() {
  return useMutation({
    mutationFn: (id: number) => screensApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: aclKeys.screens }),
  });
}
export function useDeleteScreensBulk() {
  return useMutation({
    mutationFn: (ids: number[]) => screensApi.removeBulk(ids),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: aclKeys.screens }),
  });
}

// ---- Permissions ----
export function usePermissionsCatalog() {
  return useQuery({ queryKey: aclKeys.permissions, queryFn: permissionsApi.list });
}
export function useCreatePermission() {
  return useMutation({
    mutationFn: (payload: PermissionFormValues) => permissionsApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: aclKeys.permissions }),
  });
}
export function useUpdatePermission() {
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: PermissionFormValues }) => permissionsApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: aclKeys.permissions }),
  });
}
export function useDeletePermission() {
  return useMutation({
    mutationFn: (id: number) => permissionsApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: aclKeys.permissions }),
  });
}

// ---- Users ----
export function useAclUsers() {
  return useQuery({ queryKey: aclKeys.users, queryFn: aclUsersApi.list });
}
export function useAclUser(id: number) {
  return useQuery({ queryKey: aclKeys.user(id), queryFn: () => aclUsersApi.get(id), enabled: !!id });
}
export function useCreateAclUser() {
  return useMutation({
    mutationFn: (payload: AclUserFormValues) => aclUsersApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: aclKeys.users }),
  });
}
export function useUpdateAclUser() {
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: AclUserFormValues }) => aclUsersApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: aclKeys.users }),
  });
}
export function useDeleteAclUser() {
  return useMutation({
    mutationFn: (id: number) => aclUsersApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: aclKeys.users }),
  });
}
