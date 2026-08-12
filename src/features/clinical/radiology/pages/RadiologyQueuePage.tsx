import { Radiation } from 'lucide-react';
import { ReferralQueuePage } from '@/lib/workflow/ReferralQueuePage';

export function RadiologyQueuePage() {
  return (
    <ReferralQueuePage
      title="Radiology Queue"
      breadcrumbs={[{ label: 'Clinical' }, { label: 'Radiology' }, { label: 'Queue' }]}
      description="Patients referred to radiology, awaiting imaging."
      referredTo="Radiology"
      actionLabel="Process"
      actionIcon={Radiation}
      buildPath={(entry) => `/radiology/visit/${entry.opd_visit_id}`}
    />
  );
}
