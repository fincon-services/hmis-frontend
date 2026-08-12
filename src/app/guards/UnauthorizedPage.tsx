import { Button, Result } from 'antd';
import { ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Result
        icon={<ShieldAlert size={64} color="#a5680c" style={{ margin: '0 auto' }} />}
        status="403"
        title="Access Restricted"
        subTitle="You don't have permission to access this section of the HMIS. If you believe this is a mistake, contact your system administrator."
        extra={
          <Button type="primary" onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </Button>
        }
      />
    </div>
  );
}
