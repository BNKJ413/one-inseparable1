interface ProgressStepsProps {
  total: number;
  current: number;
}

export default function ProgressSteps({ total, current }: ProgressStepsProps) {
  return (
    <div className="progress-steps">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`progress-step ${
            i + 1 === current ? 'active' : i + 1 < current ? 'completed' : ''
          }`}
        />
      ))}
    </div>
  );
}
