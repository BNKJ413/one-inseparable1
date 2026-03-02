interface LoadingCardProps {
  count?: number;
  showTitle?: boolean;
}

export default function LoadingCard({ count = 1, showTitle = true }: LoadingCardProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card" style={{ overflow: 'hidden' }}>
          {showTitle && <div className="skeleton skeleton-title" />}
          <div className="skeleton skeleton-text" style={{ width: '100%' }} />
          <div className="skeleton skeleton-text" style={{ width: '80%' }} />
          <div className="skeleton skeleton-text" style={{ width: '60%' }} />
        </div>
      ))}
    </>
  );
}
