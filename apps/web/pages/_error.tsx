import { NextPageContext } from 'next';

interface ErrorProps {
  statusCode?: number;
}

function Error({ statusCode }: ErrorProps) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'system-ui, sans-serif',
      backgroundColor: '#FFF8F0',
      color: '#2D2A26',
    }}>
      <div style={{ fontSize: '64px', marginBottom: '16px' }}>
        {statusCode === 404 ? '💫' : '😥'}
      </div>
      <h1 style={{ marginBottom: '8px' }}>
        {statusCode === 404 ? 'Page Not Found' : 'Something Went Wrong'}
      </h1>
      <p style={{ color: '#8B8680', marginBottom: '24px' }}>
        {statusCode
          ? `An error ${statusCode} occurred on server`
          : 'An error occurred on client'}
      </p>
      <a
        href="/"
        style={{
          padding: '12px 24px',
          background: '#2D2A26',
          color: 'white',
          borderRadius: '12px',
          textDecoration: 'none',
        }}
      >
        Go Home
      </a>
    </div>
  );
}

Error.getInitialProps = ({ res, err }: NextPageContext): ErrorProps => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
