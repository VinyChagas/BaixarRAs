import { useState } from 'react';
import RaInput from '../components/RaInput';
import HeadlessToggle from '../components/HeadlessToggle';
import ResultsTable from '../components/ResultsTable';
import DetailModal from '../components/DetailModal';
import LogPanel from '../components/LogPanel';
import { testConnection, searchRas } from '../services/api';
import './ConsultaRaPage.css';

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

export default function ConsultaRaPage() {
  const [raInput, setRaInput] = useState('');
  const [headless, setHeadless] = useState(false);
  const [results, setResults] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);

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

  const handleSearch = async () => {
    const ras = parseRaInput(raInput);
    if (ras.length === 0) {
      addLog('Informe ao menos uma RA para consultar.', 'error');
      return;
    }

    setLoading(true);
    setResults([]);
    setLogs([]);
    addLog(`Iniciando consulta de ${ras.length} RA(s)...`, 'info');

    try {
      const data = await searchRas(ras, headless);
      if (data.success) {
        setResults(data.results);
        const successCount = data.results.filter((r) => r.success).length;
        addLog(`Concluído: ${successCount}/${data.results.length} RAs consultadas com sucesso.`, 'success');
      } else {
        addLog(`Falha: ${data.error}`, 'error');
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Erro na consulta';
      addLog(`Erro: ${msg}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="consulta-ra-page">
      <section className="input-section">
        <RaInput value={raInput} onChange={setRaInput} disabled={loading} />
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
              onClick={handleSearch}
              disabled={loading}
            >
              {loading ? 'Consultando...' : 'Consultar RAs'}
            </button>
          </div>
        </div>
      </section>

      <section className="results-section">
        <h2>Resultados</h2>
        <ResultsTable results={results} onRowClick={setSelectedDetail} loading={loading} />
      </section>

      <section className="log-section">
        <LogPanel logs={logs} />
      </section>

      {selectedDetail && (
        <DetailModal data={selectedDetail} onClose={() => setSelectedDetail(null)} />
      )}
    </div>
  );
}
