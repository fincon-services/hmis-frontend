import { useMemo, useState } from 'react';
import { Input, List, Button, Empty, Space, Tag } from 'antd';
import { Search, UserPlus, UserMinus, Star } from 'lucide-react';
import { LoadingState } from '@/components/feedback/LoadingState';
import { useFeedback } from '@/hooks/useFeedback';
import { useConfirm } from '@/hooks/useConfirm';
import { getErrorMessage } from '@/utils/errors';
import { useRoleUsers, useAssignUsersToRole, useUnassignUsersFromRole, useSetPrimaryRole } from '../hooks/useAcl';
import type { AclUser, Role } from '../types/acl.types';

interface RoleUsersPanelProps {
  role: Role;
}

export function RoleUsersPanel({ role }: RoleUsersPanelProps) {
  const { message } = useFeedback();
  const confirm = useConfirm();
  const query = useRoleUsers(role.id);
  const assign = useAssignUsersToRole(role.id);
  const unassign = useUnassignUsersFromRole(role.id);
  const setPrimary = useSetPrimaryRole();

  const [assignedSearch, setAssignedSearch] = useState('');
  const [unassignedSearch, setUnassignedSearch] = useState('');

  const filteredAssigned = useMemo(() => {
    const list = query.data?.assigned ?? [];
    const needle = assignedSearch.trim().toLowerCase();
    return needle ? list.filter((u) => matchesUser(u, needle)) : list;
  }, [query.data, assignedSearch]);

  const filteredUnassigned = useMemo(() => {
    const list = query.data?.unassigned ?? [];
    const needle = unassignedSearch.trim().toLowerCase();
    return needle ? list.filter((u) => matchesUser(u, needle)) : list;
  }, [query.data, unassignedSearch]);

  if (query.isLoading) return <LoadingState rows={4} />;

  const onAssign = (user: AclUser) => {
    assign.mutate([user.id], {
      onSuccess: () => message.success(`${user.username} assigned to "${role.name}".`),
      onError: (error) => message.error(getErrorMessage(error, 'Unable to assign user to role.')),
    });
  };

  const onUnassign = (user: AclUser) => {
    confirm({
      title: `Remove "${role.name}" from ${user.username}?`,
      okText: 'Remove',
      danger: true,
      onConfirm: () =>
        unassign.mutate([user.id], {
          onSuccess: () => message.success(`${role.name} removed from ${user.username}.`),
          onError: (error) => message.error(getErrorMessage(error, 'Unable to remove role from user.')),
        }),
    });
  };

  const onSetPrimary = (user: AclUser) => {
    setPrimary.mutate(
      { userId: user.id, roleId: role.id },
      {
        onSuccess: () => message.success(`"${role.name}" set as primary role for ${user.username}.`),
        onError: (error) => message.error(getErrorMessage(error, 'Unable to set primary role.')),
      },
    );
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <strong style={{ fontSize: 13 }}>Assigned ({query.data?.assigned.length ?? 0})</strong>
        </div>
        <Input allowClear prefix={<Search size={14} color="#8896a3" />} placeholder="Search assigned users…" value={assignedSearch} onChange={(e) => setAssignedSearch(e.target.value)} style={{ marginBottom: 10 }} />
        {filteredAssigned.length === 0 ? (
          <Empty description="No users hold this role yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <List
            size="small"
            bordered
            dataSource={filteredAssigned}
            renderItem={(user) => (
              <List.Item
                actions={[
                  !user.roles?.find((r) => r.id === role.id)?.is_primary && (
                    <Button key="primary" type="text" size="small" icon={<Star size={13} />} onClick={() => onSetPrimary(user)} title="Set as primary role">
                      Primary
                    </Button>
                  ),
                  <Button key="remove" type="text" danger size="small" icon={<UserMinus size={13} />} onClick={() => onUnassign(user)}>
                    Remove
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space size={6}>
                      {user.employee_name ?? user.username}
                      {user.roles?.find((r) => r.id === role.id)?.is_primary && <Tag color="gold">Primary</Tag>}
                      {!user.is_active && <Tag color="default">Inactive</Tag>}
                    </Space>
                  }
                  description={user.username}
                />
              </List.Item>
            )}
          />
        )}
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <strong style={{ fontSize: 13 }}>Not Assigned ({query.data?.unassigned.length ?? 0})</strong>
        </div>
        <Input allowClear prefix={<Search size={14} color="#8896a3" />} placeholder="Search users to add…" value={unassignedSearch} onChange={(e) => setUnassignedSearch(e.target.value)} style={{ marginBottom: 10 }} />
        {filteredUnassigned.length === 0 ? (
          <Empty description="Every active user already holds this role" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <List
            size="small"
            bordered
            dataSource={filteredUnassigned}
            renderItem={(user) => (
              <List.Item actions={[<Button key="add" type="text" size="small" icon={<UserPlus size={13} />} onClick={() => onAssign(user)}>Add</Button>]}>
                <List.Item.Meta title={user.employee_name ?? user.username} description={user.username} />
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );
}

function matchesUser(user: AclUser, needle: string): boolean {
  return user.username.toLowerCase().includes(needle) || (user.employee_name ?? '').toLowerCase().includes(needle) || (user.email ?? '').toLowerCase().includes(needle);
}
