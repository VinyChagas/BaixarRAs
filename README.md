# Coletor de RAs - Portal Autbank

Sistema full stack para coleta completa de dados de atendimento (RAs) no portal da Autbank, com foco em migração futura para ServiceNow.

## Estrutura do Projeto

```
/backend
  /src
    /automation
      /selectors
        autbankSelectors.js
      AutbankDriver.js
      AutbankLoginFlow.js
      AutbankSearchFlow.js
      AutbankDetailsFlow.js
      AutbankTimelineCollector.js
      AutbankAttachmentDownloader.js
      windowUtils.js
    /config
    /controllers
    /routes
    /services
    /utils
    server.js
  .env.example
  package.json

/frontend
  /src
    /components
    /pages
    /services
  App.jsx
  main.jsx
  package.json
```

## Funcionalidades

- **Login automático** no portal Autbank
- **Consulta de RAs** por número
- **Coleta completa** de dados gerais (após clicar na Seta)
- **Histórico completo** com paginação em todas as páginas
- **Download de anexos** de todas as linhas da timeline
- **Exportação em disco** com estrutura organizada por RA

## Estrutura de Saída

Para cada RA exportada:

```
/pasta-destino/
  /10530/
    ra_10530_resumo.json      # Metadados e dados gerais
    ra_10530_historico.json   # Timeline completa
    /anexos/
      arquivo1.pdf
      arquivo2.docx
    execution.log             # Log da execução
```

## Pré-requisitos

- Node.js 18+
- Chrome ou Microsoft Edge
- Selenium 4 gerencia os drivers automaticamente

## Configuração

### Backend

```bash
cd backend
cp .env.example .env
```

Edite o `.env`:

```env
AUTBANK_BASE_URL=https://central.autbank.com.br/regatendimentoext/faces/reindex.jsp
AUTBANK_EMAIL=seu_email@empresa.com
AUTBANK_PASSWORD=sua_senha

AUTBANK_USE_WINDOW_SWITCH=false

BROWSER=chrome
HEADLESS=false
PORT=3001
```

```bash
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Acesse `http://localhost:5173`.

## Uso

1. Cole as RAs no textarea (uma por linha)
2. Informe o caminho absoluto da pasta de destino (ex: `C:\Users\SeuUsuario\Desktop\ExportacoesAutbank`)
3. Clique em **Testar conexão** para validar credenciais
4. Clique em **Exportar RAs** para iniciar a coleta completa

## API

### POST /api/auth/test

Testa credenciais e conexão.

### POST /api/ra/export

Exporta RAs completas para disco.

**Payload:**
```json
{
  "ras": ["10530", "10531"],
  "outputDir": "C:\\Users\\Vinicius\\Desktop\\ExportacoesAutbank",
  "headless": false
}
```

**Resposta:**
```json
{
  "success": true,
  "total": 2,
  "results": [
    {
      "ra": "10530",
      "success": true,
      "interacoesColetadas": 15,
      "anexosBaixados": 3,
      "pastaGerada": "C:\\...\\ExportacoesAutbank\\10530"
    }
  ]
}
```

### POST /api/ra/search

Consulta rápida (legado).

### GET /api/health

Status do serviço.

## Ajuste de Seletores

Todos os seletores estão centralizados em:

```
backend/src/automation/selectors/autbankSelectors.js
```

Inclui: login, menu, consulta, grid, botão Seta, campos gerais, timeline, paginação, anexos, botão Voltar.

## Estratégia de Coleta

**Fase 1:** Coleta todos os dados textuais e marca linhas com anexo.

**Fase 2:** Percorre apenas linhas com anexo, baixa arquivos, volta e reposiciona corretamente na timeline.

## Licença

Uso interno.
