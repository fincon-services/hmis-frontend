import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Input } from 'antd';
import { Save } from 'lucide-react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { apiClient } from '@/api/client';
import { useFeedback } from '@/hooks/useFeedback';
import { getErrorMessage } from '@/utils/errors';

const SCREEN = 'procurement.purchase-orders';

interface InstructionSet {
  id: number;
  content: string;
}

function useInstructionSet() {
  return useQuery({
    queryKey: ['procurement-instruction-set'],
    queryFn: () => apiClient.get<InstructionSet>('/procurement/instruction-set', { screenKey: SCREEN }).then((r) => r.data),
  });
}

export function InstructionSetPage() {
  const { message } = useFeedback();
  const query = useInstructionSet();
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (query.data) setContent(query.data.content ?? '');
  }, [query.data]);

  if (query.isLoading) {
    return (
      <PageContainer>
        <LoadingState />
      </PageContainer>
    );
  }
  if (query.error) {
    return (
      <PageContainer>
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      </PageContainer>
    );
  }

  const onSave = () => {
    setSaving(true);
    apiClient
      .put('/procurement/instruction-set', { content }, { screenKey: SCREEN })
      .then(() => {
        message.success('Instruction set updated.');
        query.refetch();
      })
      .catch((error) => message.error(getErrorMessage(error, 'Unable to update instruction set.')))
      .finally(() => setSaving(false));
  };

  return (
    <PageContainer>
      <PageHeader title="Purchase Order Instructions" breadcrumbs={[{ label: 'Procurement' }, { label: 'Instruction Set' }]} />

      <SectionCard title="Global Instruction Set">
        <p style={{ marginTop: 0, color: 'var(--text-secondary)', fontSize: 13 }}>
          This text is printed on every purchase order document sent to suppliers.
        </p>
        <Input.TextArea rows={10} value={content} onChange={(e) => setContent(e.target.value)} />
        <Button type="primary" icon={<Save size={14} />} onClick={onSave} loading={saving} style={{ marginTop: 12 }}>
          Save
        </Button>
      </SectionCard>
    </PageContainer>
  );
}
