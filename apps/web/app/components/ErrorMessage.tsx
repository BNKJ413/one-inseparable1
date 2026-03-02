"use client";

import Button from './Button';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ title = 'Something went wrong', message, onRetry }: ErrorMessageProps) {
  return (
    <div className="empty-state" role="alert">
      <div className="empty-state-icon">😕</div>
      <h3 style={{ marginBottom: '8px' }}>{title}</h3>
      <p className="text-muted" style={{ marginBottom: '16px' }}>{message}</p>
      {onRetry && (
        <Button variant="primary" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}
