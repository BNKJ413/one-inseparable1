interface ToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export default function Toggle({ label, description, checked, onChange }: ToggleProps) {
  return (
    <div className="toggle-container">
      <div>
        <div style={{ fontWeight: 500 }}>{label}</div>
        {description && <p className="text-small">{description}</p>}
      </div>
      <button
        type="button"
        className={`toggle ${checked ? 'active' : ''}`}
        onClick={() => onChange(!checked)}
        role="switch"
        aria-checked={checked}
      />
    </div>
  );
}
