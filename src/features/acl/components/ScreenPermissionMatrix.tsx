import { useEffect, useMemo, useState } from 'react';
import { Checkbox, Input, Button, Space, Empty } from 'antd';
import { Search, Save } from 'lucide-react';
import { LoadingState } from '@/components/feedback/LoadingState';
import { useFeedback } from '@/hooks/useFeedback';
import { getErrorMessage } from '@/utils/errors';
import { useModuleTree, useScreens, useRoleScreenAssignment, useSaveRoleScreenAssignment } from '../hooks/useAcl';
import type { Module, Screen } from '../types/acl.types';

interface FlatModule {
  id: number;
  name: string;
  parentName: string | null;
  sort_order: number;
}

function flattenModules(modules: Module[], parentName: string | null = null): FlatModule[] {
  return modules.flatMap((m) => [
    { id: m.id, name: m.name, parentName, sort_order: m.sort_order },
    ...flattenModules(m.children ?? [], m.name),
  ]);
}

interface ScreenPermissionMatrixProps {
  roleId: number;
}

export function ScreenPermissionMatrix({ roleId }: ScreenPermissionMatrixProps) {
  const { message } = useFeedback();
  const moduleTreeQuery = useModuleTree();
  const screensQuery = useScreens();
  const assignmentQuery = useRoleScreenAssignment(roleId);
  const saveAssignment = useSaveRoleScreenAssignment(roleId);

  const [search, setSearch] = useState('');
  /** screen_id -> selected permission_ids. Presence of a key = the screen is included (screen_ids). */
  const [selection, setSelection] = useState<Map<number, Set<number>>>(new Map());
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!assignmentQuery.data) return;
    const next = new Map<number, Set<number>>();
    for (const row of assignmentQuery.data) {
      next.set(row.screen_id, new Set(row.permission_ids));
    }
    setSelection(next);
    setDirty(false);
  }, [assignmentQuery.data]);

  const flatModules = useMemo(() => flattenModules(moduleTreeQuery.data ?? []), [moduleTreeQuery.data]);
  const moduleNameById = useMemo(() => new Map(flatModules.map((m) => [m.id, m])), [flatModules]);

  const screensByModule = useMemo(() => {
    const groups = new Map<number, Screen[]>();
    for (const screen of screensQuery.data ?? []) {
      if (!groups.has(screen.module_id)) groups.set(screen.module_id, []);
      groups.get(screen.module_id)!.push(screen);
    }
    for (const list of groups.values()) list.sort((a, b) => a.sort_order - b.sort_order);
    return groups;
  }, [screensQuery.data]);

  const moduleGroups = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return [...screensByModule.entries()]
      .map(([moduleId, screens]) => {
        const filteredScreens = needle
          ? screens.filter((s) => s.name.toLowerCase().includes(needle) || (moduleNameById.get(moduleId)?.name ?? '').toLowerCase().includes(needle))
          : screens;
        return { moduleId, module: moduleNameById.get(moduleId), screens: filteredScreens };
      })
      .filter((g) => g.screens.length > 0)
      .sort((a, b) => (a.module?.sort_order ?? 0) - (b.module?.sort_order ?? 0));
  }, [screensByModule, moduleNameById, search]);

  const isLoading = moduleTreeQuery.isLoading || screensQuery.isLoading || assignmentQuery.isLoading;

  if (isLoading) return <LoadingState rows={6} />;

  if ((screensQuery.data?.length ?? 0) === 0) {
    return <Empty description="No screens have been configured yet" />;
  }

  const toggleScreen = (screen: Screen, included: boolean) => {
    setSelection((prev) => {
      const next = new Map(prev);
      if (included) {
        next.set(screen.id, next.get(screen.id) ?? new Set());
      } else {
        next.delete(screen.id);
      }
      return next;
    });
    setDirty(true);
  };

  const togglePermission = (screen: Screen, permissionId: number, checked: boolean) => {
    setSelection((prev) => {
      const next = new Map(prev);
      const current = new Set(next.get(screen.id) ?? []);
      if (checked) {
        current.add(permissionId);
        next.set(screen.id, current);
      } else {
        current.delete(permissionId);
        next.set(screen.id, current); // keep screen included even with 0 permissions selected
      }
      return next;
    });
    setDirty(true);
  };

  const toggleAllPermissionsForScreen = (screen: Screen, checked: boolean) => {
    setSelection((prev) => {
      const next = new Map(prev);
      next.set(screen.id, checked ? new Set((screen.permissions ?? []).map((p) => p.id)) : new Set());
      return next;
    });
    setDirty(true);
  };

  const toggleModule = (screens: Screen[], checked: boolean) => {
    setSelection((prev) => {
      const next = new Map(prev);
      for (const screen of screens) {
        if (checked) {
          next.set(screen.id, new Set((screen.permissions ?? []).map((p) => p.id)));
        } else {
          next.delete(screen.id);
        }
      }
      return next;
    });
    setDirty(true);
  };

  const selectAll = () => {
    setSelection(() => {
      const next = new Map<number, Set<number>>();
      for (const screen of screensQuery.data ?? []) {
        next.set(screen.id, new Set((screen.permissions ?? []).map((p) => p.id)));
      }
      return next;
    });
    setDirty(true);
  };

  const deselectAll = () => {
    setSelection(new Map());
    setDirty(true);
  };

  const totalScreensSelected = selection.size;
  const totalScreens = screensQuery.data?.length ?? 0;

  const onSave = () => {
    const screen_ids = [...selection.keys()];
    const screen_permissions: Record<number, number[]> = {};
    for (const [screenId, perms] of selection.entries()) {
      screen_permissions[screenId] = [...perms];
    }
    saveAssignment.mutate(
      { screen_ids, screen_permissions },
      {
        onSuccess: () => {
          message.success('Role screen access updated.');
          setDirty(false);
        },
        onError: (error) => message.error(getErrorMessage(error, 'Unable to update role screen access.')),
      },
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <Space>
          <Input
            allowClear
            prefix={<Search size={14} color="#8896a3" />}
            placeholder="Search modules or screens…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 280 }}
          />
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {totalScreensSelected} of {totalScreens} screens granted
          </span>
        </Space>
        <Space>
          <Button size="small" onClick={selectAll}>
            Select All
          </Button>
          <Button size="small" onClick={deselectAll}>
            Deselect All
          </Button>
          <Button type="primary" icon={<Save size={14} />} onClick={onSave} loading={saveAssignment.isPending} disabled={!dirty}>
            Save Changes
          </Button>
        </Space>
      </div>

      {moduleGroups.length === 0 ? (
        <Empty description="No modules or screens match your search" />
      ) : (
        moduleGroups.map(({ moduleId, module, screens }) => {
          const includedCount = screens.filter((s) => selection.has(s.id)).length;
          const moduleChecked = includedCount === screens.length && screens.length > 0;
          const moduleIndeterminate = includedCount > 0 && includedCount < screens.length;

          return (
            <div key={moduleId} style={{ border: '1px solid #d7dde3', borderRadius: 8, marginBottom: 16, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#f7f9fa', borderBottom: '1px solid #d7dde3' }}>
                <Checkbox checked={moduleChecked} indeterminate={moduleIndeterminate} onChange={(e) => toggleModule(screens, e.target.checked)} />
                <strong style={{ fontSize: 13 }}>{module?.parentName ? `${module.parentName} / ${module.name}` : module?.name ?? `Module #${moduleId}`}</strong>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  ({includedCount}/{screens.length})
                </span>
              </div>

              <div>
                {screens.map((screen) => {
                  const selected = selection.get(screen.id);
                  const included = selection.has(screen.id);
                  const permissions = screen.permissions ?? [];
                  const permCount = selected?.size ?? 0;
                  const allPermsChecked = included && permCount === permissions.length && permissions.length > 0;
                  const permsIndeterminate = included && permCount > 0 && permCount < permissions.length;

                  return (
                    <div
                      key={screen.id}
                      style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 14px', borderBottom: '1px solid #eef0f2', flexWrap: 'wrap' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 220 }}>
                        <Checkbox checked={included} onChange={(e) => toggleScreen(screen, e.target.checked)} />
                        <span style={{ fontSize: 13 }}>{screen.name}</span>
                        <code style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{screen.route_key}</code>
                      </div>

                      {permissions.length > 0 && (
                        <Space wrap size={12} style={{ opacity: included ? 1 : 0.4, pointerEvents: included ? 'auto' : 'none' }}>
                          <Checkbox checked={allPermsChecked} indeterminate={permsIndeterminate} onChange={(e) => toggleAllPermissionsForScreen(screen, e.target.checked)}>
                            <span style={{ fontSize: 12, fontWeight: 500 }}>All</span>
                          </Checkbox>
                          {permissions.map((perm) => (
                            <Checkbox
                              key={perm.id}
                              checked={selected?.has(perm.id) ?? false}
                              onChange={(e) => togglePermission(screen, perm.id, e.target.checked)}
                            >
                              <span style={{ fontSize: 12 }}>{perm.label ?? perm.name}</span>
                            </Checkbox>
                          ))}
                        </Space>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
