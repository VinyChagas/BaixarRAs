import ExportRaPage from './pages/ExportRaPage';
import './App.css';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Coletor de RAs - Autbank</h1>
        <p className="subtitle">Exportação completa para migração ServiceNow</p>
      </header>
      <main className="app-main">
        <ExportRaPage />
      </main>
    </div>
  );
}

export default App;
