import { useState } from 'react';
import RaInput from '../components/RaInput';
import OutputDirInput from '../components/OutputDirInput';
import HeadlessToggle from '../components/HeadlessToggle';
import ExportResultsTable from '../components/ExportResultsTable';
import LogPanel from '../components/LogPanel';
import { testConnection, exportRas } from '../services/api';
import './ExportRaPage.css';

function parseRaInput(value) {
  return value
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function formatTime() {
  return new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function ExportRaPage() {
  const [raInput, setRaInput] = useState('');
  const [outputDir, setOutputDir] = useState('');
  const [headless, setHeadless] = useState(false);
  const [results, setResults] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const addLog = (message, type = 'info') => {
    setLogs((prev) => [...prev, { time: formatTime(), message, type }]);
  };

  const handleTestConnection = async () => {
    setLoading(true);
    setLogs([]);
    addLog('Testando conexão com o portal...', 'info');

    try {
      const data = await testConnection(headless);
      if (data.success) {
        addLog('Conexão OK! Credenciais válidas.', 'success');
      } else {
        addLog(`Falha: ${data.error}`, 'error');
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Erro ao conectar';
      addLog(`Erro: ${msg}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    const ras = parseRaInput(raInput);
    if (ras.length === 0) {
      addLog('Informe ao menos uma RA para exportar.', 'error');
      return;
    }

    if (!outputDir.trim()) {
      addLog('Informe a pasta de destino.', 'error');
      return;
    }

    setLoading(true);
    setResults([]);
    setLogs([]);
    addLog(`Iniciando exportação de ${ras.length} RA(s)...`, 'info');
    addLog(`Pasta de destino: ${outputDir}`, 'info');

    try {
      const data = await exportRas(ras, outputDir.trim(), headless);
      if (data.success) {
        setResults(data.results);
        const successCount = data.results.filter((r) => r.success).length;
        addLog(
          `Concluído: ${successCount}/${data.results.length} RAs exportadas com sucesso.`,
          'success'
        );
      } else {
        addLog(`Falha: ${data.error}`, 'error');
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Erro na exportação';
      addLog(`Erro: ${msg}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="export-ra-page">
      <section className="input-section">
        <RaInput value={raInput} onChange={setRaInput} disabled={loading} />
        <OutputDirInput
          value={outputDir}
          onChange={setOutputDir}
          placeholder="C:\Users\SeuUsuario\Desktop\ExportacoesAutbank"
          disabled={loading}
        />
        <div className="controls">
          <HeadlessToggle checked={headless} onChange={setHeadless} disabled={loading} />
          <div className="buttons">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleTestConnection}
              disabled={loading}
            >
              Testar conexão
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleExport}
              disabled={loading}
            >
              {loading ? 'Exportando...' : 'Exportar RAs'}
            </button>
          </div>
        </div>
      </section>

      <section className="results-section">
        <h2>Progresso por RA</h2>
        <ExportResultsTable results={results} loading={loading} />
      </section>

      <section className="log-section">
        <LogPanel logs={logs} />
      </section>
    </div>
  );
}
