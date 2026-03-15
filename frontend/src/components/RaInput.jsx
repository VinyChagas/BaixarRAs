import './RaInput.css';

export default function RaInput({ value, onChange, placeholder, disabled }) {
  const handleChange = (e) => {
    onChange(e.target.value);
  };

  return (
    <div className="ra-input">
      <label htmlFor="ra-input">RAs para consultar (uma por linha)</label>
      <textarea
        id="ra-input"
        value={value}
        onChange={handleChange}
        placeholder={placeholder || '10530\n10531\n10532'}
        disabled={disabled}
        rows={6}
      />
    </div>
  );
}
