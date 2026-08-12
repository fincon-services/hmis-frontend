/** Global, extensible action catalog (e.g. view/create/update/delete/export/approve) — shared across every screen, not per-screen bespoke verbs. */
export interface Permission {
  id: number;
  name: string;
  label: string | null;
}

export interface Screen {
  id: number;
  module_id: number;
  name: string;
  route_key: string;
  sort_order: number;
  is_active: boolean;
  /** Only present when the API eager-loads it (GET /acl/screens). */
  permissions?: Permission[];
}

export interface Module {
  id: number;
  parent_id: number | null;
  name: string;
  slug: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  /** Only present on the tree-shaped GET /acl/modules response. */
  children?: Module[];
  screens?: Screen[];
}

export interface Role {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  /** Only present when returned alongside a user (pivot data). */
  is_primary?: boolean;
}

export interface AclUser {
  id: number;
  employee_id: number;
  employee_name: string | null;
  username: string;
  email: string | null;
  is_active: boolean;
  disabled_at: string | null;
  last_login_at: string | null;
  roles?: Role[];
}

export interface RoleUsersResponse {
  assigned: AclUser[];
  unassigned: AclUser[];
}

/** One row of GET /acl/roles/{role}/screens — the role's current grant for one screen. */
export interface RoleScreenAssignment {
  screen_id: number;
  screen_name: string | null;
  permission_ids: number[];
}

export interface AssignRoleScreensRequest {
  screen_ids: number[];
  screen_permissions: Record<number, number[]>;
}

export interface ModuleFormValues {
  parent_id?: number;
  name: string;
  slug: string;
  icon?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface ScreenFormValues {
  module_id: number;
  name: string;
  route_key: string;
  sort_order?: number;
  is_active?: boolean;
  permission_ids?: number[];
}

export interface PermissionFormValues {
  name: string;
  label?: string;
}

export interface RoleFormValues {
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface AclUserFormValues {
  /** Required when creating a user; immutable (and omitted) on update. */
  employee_id?: number;
  username: string;
  email?: string;
  password?: string;
  password_confirmation?: string;
  is_active?: boolean;
}
