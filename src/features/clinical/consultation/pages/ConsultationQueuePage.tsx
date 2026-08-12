import { Stethoscope } from 'lucide-react';
import { ReferralQueuePage } from '@/lib/workflow/ReferralQueuePage';

export function ConsultationQueuePage() {
  return (
    <ReferralQueuePage
      title="Consultation Queue"
      breadcrumbs={[{ label: 'Clinical' }, { label: 'Consultation' }, { label: 'Queue' }]}
      description="Patients referred to the doctor (MO), awaiting consultation."
      referredTo="MO"
      actionLabel="Consult"
      actionIcon={Stethoscope}
      buildPath={(entry) => `/consultation/visit/${entry.opd_visit_id}`}
    />
  );
}
