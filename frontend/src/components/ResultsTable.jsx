import './ResultsTable.css';

export default function ResultsTable({ results, onRowClick, loading }) {
  if (!results?.length && !loading) {
    return (
      <div className="results-table-empty">
        <p>Nenhum resultado ainda. Consulte as RAs para ver os dados.</p>
      </div>
    );
  }

  return (
    <div className="results-table-wrapper">
      <table className="results-table">
        <thead>
          <tr>
            <th>RA</th>
            <th>Status Automação</th>
            <th>Status Ticket</th>
            <th>Assunto</th>
            <th>Data</th>
            <th>Ação</th>
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
              <td>{item.success ? (item.data?.status ?? '-') : '-'}</td>
              <td className="assunto-cell">
                {item.success ? (item.data?.assunto ?? '-') : item.error}
              </td>
              <td>{item.success ? (item.data?.dataAbertura ?? item.data?.datas?.abertura ?? '-') : '-'}</td>
              <td>
                {item.success ? (
                  <button
                    type="button"
                    className="btn-detail"
                    onClick={() => onRowClick(item)}
                  >
                    Ver detalhes
                  </button>
                ) : (
                  '-'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
