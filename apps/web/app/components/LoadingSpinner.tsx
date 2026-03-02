export default function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'width: 20px; height: 20px;',
    md: 'width: 32px; height: 32px;',
    lg: 'width: 48px; height: 48px;',
  };

  return (
    <div className="loading">
      <div className="spinner" style={{ ...Object.fromEntries(sizeClasses[size].split(';').filter(Boolean).map(s => s.split(':').map(v => v.trim()))) }} />
    </div>
  );
}
