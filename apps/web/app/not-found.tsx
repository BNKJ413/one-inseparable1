import Link from 'next/link';

export default function NotFound() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
      <div style={{ fontSize: '64px', marginBottom: '16px' }}>💫</div>
      <h1 style={{ marginBottom: '8px' }}>Page Not Found</h1>
      <p style={{ color: 'var(--fg-muted)', marginBottom: '24px' }}>
        Sorry, we couldn't find the page you're looking for.
      </p>
      <Link
        href="/"
        style={{
          padding: '12px 24px',
          background: 'var(--fg-primary)',
          color: 'white',
          borderRadius: '12px',
          textDecoration: 'none',
        }}
      >
        Go Home
      </Link>
    </main>
  );
}
