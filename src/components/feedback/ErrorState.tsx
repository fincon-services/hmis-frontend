import { Button, Result } from 'antd';
import { RotateCcw } from 'lucide-react';
import { getErrorMessage, isApiError } from '@/utils/errors';

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  const status = isApiError(error) ? error.status : 0;

  if (status === 403) {
    return (
      <Result
        status="403"
        title="Access denied"
        subTitle={getErrorMessage(error, 'You are not authorized to access this screen.')}
      />
    );
  }

  return (
    <Result
      status="error"
      title="Unable to load data"
      subTitle={getErrorMessage(error)}
      extra={
        onRetry && (
          <Button icon={<RotateCcw size={14} />} onClick={onRetry}>
            Retry
          </Button>
        )
      }
    />
  );
}
