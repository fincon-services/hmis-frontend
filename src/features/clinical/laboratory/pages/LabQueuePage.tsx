import { FlaskConical } from 'lucide-react';
import { ReferralQueuePage } from '@/lib/workflow/ReferralQueuePage';

export function LabQueuePage() {
  return (
    <ReferralQueuePage
      title="Laboratory Queue"
      breadcrumbs={[{ label: 'Clinical' }, { label: 'Laboratory' }, { label: 'Queue' }]}
      description="Patients referred to the lab, awaiting test processing."
      referredTo="Lab"
      actionLabel="Process"
      actionIcon={FlaskConical}
      buildPath={(entry) => `/laboratory/visit/${entry.opd_visit_id}`}
    />
  );
}
