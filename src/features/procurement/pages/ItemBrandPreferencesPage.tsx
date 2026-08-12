import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Select, Input, List } from 'antd';
import { Plus } from 'lucide-react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { LoadingState } from '@/components/feedback/LoadingState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { apiClient } from '@/api/client';
import { useFeedback } from '@/hooks/useFeedback';
import { getErrorMessage } from '@/utils/errors';
import { useWarehouseItems } from '@/features/warehouse/pages/ItemsPage';
import { useItemBrands } from '@/features/warehouse/pages/ItemBrandsPage';
import type { CollectionResponse } from '@/types/api';

const SCREEN = 'procurement.suppliers';

interface ItemBrandPreference {
  id: number;
  warehouse_item_id: number;
  warehouse_item_brand_id: number;
  brand_name: string | null;
  description: string | null;
}

function usePreferences() {
  return useQuery({
    queryKey: ['item-brand-preferences'],
    queryFn: () => apiClient.get<CollectionResponse<ItemBrandPreference>>('/procurement/item-brand-preferences', { screenKey: SCREEN }).then((r) => r.data.data),
  });
}

export function ItemBrandPreferencesPage() {
  const { message } = useFeedback();
  const query = usePreferences();
  const itemsQuery = useWarehouseItems({ per_page: 0 });
  const brandsQuery = useItemBrands({ per_page: 0 });
  const itemOptions = useMemo(() => (itemsQuery.data?.data ?? []).map((i) => ({ label: i.name, value: i.id })), [itemsQuery.data]);
  const brandOptions = useMemo(() => (brandsQuery.data?.data ?? []).map((b) => ({ label: b.name, value: b.id })), [brandsQuery.data]);

  const [itemId, setItemId] = useState<number>();
  const [brandId, setBrandId] = useState<number>();
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = () => {
    if (!itemId || !brandId) {
      message.error('Item and brand are required.');
      return;
    }
    setSubmitting(true);
    apiClient
      .post('/procurement/item-brand-preferences', { warehouse_item_id: itemId, warehouse_item_brand_id: brandId, description: description || undefined }, { screenKey: SCREEN })
      .then(() => {
        message.success('Brand preference saved.');
        query.refetch();
      })
      .catch((error) => message.error(getErrorMessage(error, 'Unable to save brand preference.')))
      .finally(() => setSubmitting(false));
  };

  return (
    <PageContainer>
      <PageHeader title="Item Brand Preferences" breadcrumbs={[{ label: 'Procurement' }, { label: 'Brand Preferences' }]} />

      <SectionCard title="Set Preferred Brand">
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <Select style={{ width: 220 }} placeholder="Item" options={itemOptions} value={itemId} onChange={setItemId} />
          <Select style={{ width: 200 }} placeholder="Preferred Brand" options={brandOptions} value={brandId} onChange={setBrandId} />
          <Input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} style={{ width: 220 }} />
          <Button type="primary" icon={<Plus size={14} />} onClick={onSubmit} loading={submitting}>
            Save
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Current Preferences">
        {query.isLoading ? (
          <LoadingState rows={2} />
        ) : (query.data?.length ?? 0) === 0 ? (
          <EmptyState title="No brand preferences set" />
        ) : (
          <List dataSource={query.data} renderItem={(p) => <List.Item>Item #{p.warehouse_item_id} → {p.brand_name}</List.Item>} />
        )}
      </SectionCard>
    </PageContainer>
  );
}
