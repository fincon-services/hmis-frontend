import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { Row, Col, Typography } from 'antd';
import { Users, Settings, KeyRound, Warehouse, ShoppingCart, Calculator, CheckSquare, LineChart, Activity, Stethoscope, FlaskConical, Radiation, Pill } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { SectionCard } from '@/components/common/SectionCard';
import { usePatients } from '@/features/patients/hooks/usePatients';
import { useVitalsQueue } from '@/features/clinical/vitals/hooks/useVitals';
import { usePatientQueue } from '@/features/patients/hooks/usePatientQueue';
import { usePendingDispense } from '@/features/clinical/pharmacy/hooks/usePharmacy';
import { usePendingApprovals } from '@/features/approvals/pages/ApprovalRequestsQueuePage';
import { useAuthStore } from '@/stores/authStore';
import { isPaginated } from '@/types/api';

const today = dayjs().format('YYYY-MM-DD');

export function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const patientsQuery = usePatients({ per_page: 1 });
  const totalPatients = patientsQuery.data && isPaginated(patientsQuery.data) ? patientsQuery.data.meta.total : undefined;

  const vitalsQueue = useVitalsQueue({ origin: 'OPD', date: today, per_page: 1 });
  const vitalsPending = vitalsQueue.data && isPaginated(vitalsQueue.data) ? vitalsQueue.data.meta.total : vitalsQueue.data?.data.length;
  const consultationQueue = usePatientQueue({ origin: 'OPD', referred_to: 'MO', date: today, per_page: 1 });
  const consultationPending = consultationQueue.data && isPaginated(consultationQueue.data) ? consultationQueue.data.meta.total : consultationQueue.data?.data.length;
  const labQueue = usePatientQueue({ origin: 'OPD', referred_to: 'Lab', date: today, per_page: 1 });
  const labPending = labQueue.data && isPaginated(labQueue.data) ? labQueue.data.meta.total : labQueue.data?.data.length;
  const radiologyQueue = usePatientQueue({ origin: 'OPD', referred_to: 'Radiology', date: today, per_page: 1 });
  const radiologyPending = radiologyQueue.data && isPaginated(radiologyQueue.data) ? radiologyQueue.data.meta.total : radiologyQueue.data?.data.length;
  const pendingDispense = usePendingDispense();
  const pendingApprovals = usePendingApprovals();

  return (
    <PageContainer>
      <PageHeader title={`Welcome, ${user?.username ?? ''}`} description={`HMIS operational overview · ${dayjs().format('dddd, D MMMM YYYY')}`} />

      <Row gutter={16} style={{ marginBottom: 8 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard label="Registered Patients" value={totalPatients} icon={Users} loading={patientsQuery.isLoading} onClick={() => navigate('/patients')} />
        </Col>
      </Row>

      <SectionCard title="Today's Operational Queues">
        <Typography.Paragraph type="secondary" style={{ marginTop: -8, marginBottom: 16, fontSize: 13 }}>
          What needs attention right now — click a tile to open that queue.
        </Typography.Paragraph>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <StatCard label="Vitals Pending" value={vitalsPending} icon={Activity} loading={vitalsQueue.isLoading} onClick={() => navigate('/vitals/queue')} />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <StatCard label="Consultation Pending" value={consultationPending} icon={Stethoscope} loading={consultationQueue.isLoading} onClick={() => navigate('/consultation/queue')} />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <StatCard label="Lab Pending" value={labPending} icon={FlaskConical} loading={labQueue.isLoading} onClick={() => navigate('/laboratory/queue')} />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <StatCard label="Radiology Pending" value={radiologyPending} icon={Radiation} loading={radiologyQueue.isLoading} onClick={() => navigate('/radiology/queue')} />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <StatCard label="Pharmacy Pending" value={pendingDispense.data?.length} icon={Pill} loading={pendingDispense.isLoading} onClick={() => navigate('/pharmacy/pending-dispense')} />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <StatCard label="Approvals Pending" value={pendingApprovals.data?.length} icon={CheckSquare} loading={pendingApprovals.isLoading} onClick={() => navigate('/approval/requests')} />
          </Col>
        </Row>
      </SectionCard>

      <SectionCard title="Quick Links">
        <Row gutter={16}>
          <Col xs={24} sm={12} lg={8}>
            <QuickLink icon={Users} label="Patients" onClick={() => navigate('/patients')} />
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <QuickLink icon={Warehouse} label="Warehouse" onClick={() => navigate('/warehouse/items')} />
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <QuickLink icon={ShoppingCart} label="Procurement" onClick={() => navigate('/procurement/purchase-requests')} />
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <QuickLink icon={Calculator} label="Finance" onClick={() => navigate('/finance/vouchers')} />
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <QuickLink icon={LineChart} label="Clinical Reports" onClick={() => navigate('/clinical-reports')} />
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <QuickLink icon={Settings} label="Administration" onClick={() => navigate('/administration/hr-setup/currencies')} />
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <QuickLink icon={KeyRound} label="Change Password" onClick={() => navigate('/settings/change-password')} />
          </Col>
        </Row>
      </SectionCard>
    </PageContainer>
  );
}

function QuickLink({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '14px 16px',
        border: '1px solid #d7dde3',
        borderRadius: 6,
        cursor: 'pointer',
        marginBottom: 12,
      }}
    >
      <Icon size={18} color="#0f5b78" />
      <span style={{ fontWeight: 500 }}>{label}</span>
    </div>
  );
}
