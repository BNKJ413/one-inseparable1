"use client";

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
      <div style={{ fontSize: '64px', marginBottom: '16px' }}>😥</div>
      <h1 style={{ marginBottom: '8px' }}>Something went wrong</h1>
      <p style={{ color: 'var(--fg-muted)', marginBottom: '24px' }}>
        We're sorry, an unexpected error occurred.
      </p>
      <button
        onClick={() => reset()}
        style={{
          padding: '12px 24px',
          background: 'var(--fg-primary)',
          color: 'white',
          borderRadius: '12px',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Try Again
      </button>
    </main>
  );
}
