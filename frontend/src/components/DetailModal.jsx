import './DetailModal.css';

export default function DetailModal({ data, onClose }) {
  if (!data) return null;

  const { ra, success, data: raData, error } = data;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Detalhes da RA {ra}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </div>
        <div className="modal-body">
          {success ? (
            <div className="detail-sections">
              {raData?.numero && (
                <section>
                  <h3>Número</h3>
                  <p>{raData.numero}</p>
                </section>
              )}
              {raData?.status && (
                <section>
                  <h3>Status</h3>
                  <p>{raData.status}</p>
                </section>
              )}
              {raData?.assunto && (
                <section>
                  <h3>Assunto</h3>
                  <p>{raData.assunto}</p>
                </section>
              )}
              {raData?.solicitante && (
                <section>
                  <h3>Solicitante</h3>
                  <p>{raData.solicitante}</p>
                </section>
              )}
              {(raData?.dataAbertura || raData?.dataFechamento) && (
                <section>
                  <h3>Datas</h3>
                  <p>
                    Abertura: {raData.dataAbertura ?? '-'} | Fechamento: {raData.dataFechamento ?? '-'}
                  </p>
                </section>
              )}
              {raData?.descricao && (
                <section>
                  <h3>Descrição</h3>
                  <p className="description">{raData.descricao}</p>
                </section>
              )}
              {raData?.camposExtras && Object.keys(raData.camposExtras).length > 0 && (
                <section>
                  <h3>Campos adicionais</h3>
                  <dl className="extra-fields">
                    {Object.entries(raData.camposExtras).map(([key, value]) => (
                      <div key={key}>
                        <dt>{key}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              )}
            </div>
          ) : (
            <div className="detail-error">
              <p className="error-message">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
