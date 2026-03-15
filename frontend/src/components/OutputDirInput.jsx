import './OutputDirInput.css';

export default function OutputDirInput({ value, onChange, placeholder, disabled }) {
  return (
    <div className="output-dir-input">
      <label htmlFor="output-dir">Pasta de destino (caminho absoluto)</label>
      <input
        id="output-dir"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || 'C:\\Users\\SeuUsuario\\Desktop\\ExportacoesAutbank'}
        disabled={disabled}
      />
    </div>
  );
}
