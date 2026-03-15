import './HeadlessToggle.css';

export default function HeadlessToggle({ checked, onChange, disabled }) {
  return (
    <label className="headless-toggle">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <span className="toggle-slider" />
      <span className="toggle-label">Modo headless (sem janela do navegador)</span>
    </label>
  );
}
