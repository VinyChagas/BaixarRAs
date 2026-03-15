import './ExportResultsTable.css';

export default function ExportResultsTable({ results, loading }) {
  if (!results?.length && !loading) {
    return (
      <div className="export-results-empty">
        <p>Nenhum resultado ainda. Exporte as RAs para ver o progresso.</p>
      </div>
    );
  }

  return (
    <div className="export-results-wrapper">
      <table className="export-results-table">
        <thead>
          <tr>
            <th>RA</th>
            <th>Status</th>
            <th>Interações</th>
            <th>Anexos</th>
            <th>Pasta</th>
            <th>Erro</th>
          </tr>
        </thead>
        <tbody>
          {results.map((item, index) => (
            <tr key={`${item.ra}-${index}`} className={item.success ? 'success' : 'error'}>
              <td>{item.ra}</td>
              <td>
                <span className={`status-badge ${item.success ? 'success' : 'error'}`}>
                  {item.success ? 'Sucesso' : 'Erro'}
                </span>
              </td>
              <td>{item.interacoesColetadas ?? '-'}</td>
              <td>{item.anexosBaixados ?? '-'}</td>
              <td className="pasta-cell" title={item.pastaGerada}>
                {item.pastaGerada ? (
                  <code>{item.pastaGerada}</code>
                ) : (
                  '-'
                )}
              </td>
              <td className="error-cell">{item.error || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
