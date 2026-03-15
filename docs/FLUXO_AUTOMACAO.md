# Documentação do Fluxo de Automação - Baixar RAs

Sistema de automação para coleta completa de dados de atendimento (RAs) no portal Autbank, utilizando Selenium WebDriver.

---

## Visão Geral

O fluxo é executado em **ordem sequencial** para cada RA informada. A automação controla um navegador (Chrome ou Edge) e realiza login, pesquisa, coleta de dados e download de anexos de forma automatizada.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        FLUXO GERAL DE EXPORTAÇÃO                         │
├─────────────────────────────────────────────────────────────────────────┤
│  1. Iniciar navegador (com pasta de download configurada)                │
│  2. Login no portal Autbank                                              │
│  3. Para cada RA:                                                       │
│     ├── Pesquisar e abrir chamado                                        │
│     ├── Extrair dados gerais (Seta)                                       │
│     ├── ETAPA 1: Coletar histórico completo (texto)                      │
│     ├── Salvar JSON/TXT                                                  │
│     └── ETAPA 2: Download de anexos (se houver)                          │
│  4. Encerrar navegador                                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Inicialização

**Arquivo:** `AutbankDriver.js`

- Cria instância do navegador (Chrome ou Edge)
- Configura timeouts (page load, elemento, implícito)
- Define pasta de download via preferências do Chrome (`download.default_directory`)
- Modo headless opcional

---

## 2. Login (AutbankLoginFlow)

**Arquivo:** `AutbankLoginFlow.js`

### 2.1 Acesso ao portal

| Modo | Descrição |
|------|-----------|
| **Com troca de janela** | Navega para landing, clica no link do portal, aguarda nova janela e alterna para ela |
| **Navegação direta** | Navega diretamente para a URL do portal (quando `useWindowSwitch=false`) |

### 2.2 Tela de login

- Aguarda: campo usuário/e-mail, campo senha, botão de login
- Valida que os elementos estão visíveis e habilitados

### 2.3 Execução do login

1. Preenche e-mail
2. Preenche senha
3. Clica no botão de login
4. Valida sucesso (verifica se menu "Consulta de RA" está visível)

---

## 3. Pesquisa e Abertura do Chamado (AutbankSearchFlow)

**Arquivo:** `AutbankSearchFlow.js`

### 3.1 Navegação ao menu

1. `switchToMainContent()` – garante contexto principal
2. Clica em **Consulta de RA** (menu principal)
3. Clica no **submenu** de consulta
4. Aguarda carregamento

### 3.2 Pesquisa da RA

1. `switchToConsultaFrame()` – entra no frame da consulta
2. Preenche o campo **Número da RA**
3. Limpa o campo **Período de abertura** (robusto: CTRL+A, BACKSPACE, JS)
4. Clica no botão **Pesquisar** (com fallbacks: click, Actions, JS)
5. Aguarda resultados da grid

### 3.3 Abertura do detalhe

1. Verifica se a RA foi encontrada (presença do botão de detalhe na grid)
2. Clica no botão da grid: `td[9]/input` (coluna de ações)
3. Aguarda a tela de detalhe carregar

---

## 4. Extração de Dados Gerais (AutbankDetailsFlow)

**Arquivo:** `AutbankDetailsFlow.js`

### 4.1 Expansão do painel (Seta)

1. `switchToConsultaFrame()`
2. Clica no botão **Seta** (`re_btntoggler_consseqra_contato_r`) para expandir
3. Aguarda a expansão

### 4.2 Campos extraídos

| Campo | Seletor |
|-------|---------|
| Número RA | `numerora` |
| Sistema Original | `descsistema` |
| Sistema Atual | `sistemaatu` |
| Versão | `versaosistema` |
| Data Abertura | `dataabertura` |
| Ambiente | `prioridadeambientelabel` |
| Assunto | `motivo` |
| Item do Menu | `item` |
| Contato | `contatoinicial` |
| Situação | `situacaolabel` |
| Atendente | `nomeanalistaresponsavel` |

---

## 5. ETAPA 1 – Coleta do Histórico (AutbankTimelineCollector)

**Arquivo:** `AutbankTimelineCollector.js`

### 5.1 Fluxo obrigatório da paginação

1. **Ir para a última página (início do chamado)**
   - Clica em **scroll_3last** antes de coletar
   - Esse botão leva ao início cronológico do chamado

2. **Contar páginas**
   - Lê o texto de paginação (ex.: "Página 2 de 2")
   - Usa `parsePaginationText()` para obter `currentPage` e `totalPages`

3. **Coletar da última para a primeira**
   - Itera da última página até a primeira
   - Usa **scroll_1previous** para avançar na sequência (última → primeira)

### 5.2 Botões de paginação

| Botão | ID | Função |
|-------|-----|--------|
| **scroll_3last** | `buttonGoToStart` | Ir para a última página (início do chamado) |
| **scroll_1previous** | `buttonPreviousPage` | Avançar na sequência (ex.: página 2 → 1) |

### 5.3 Dados coletados por linha

- Data/Hora
- Sistema
- Analista/Contato
- Situação
- Tipo Sequência
- Descrição
- `possuiAnexo` (boolean)

### 5.4 Salvamento

- **Salvamento parcial:** em caso de erro, salva o que já foi coletado (ex.: página 1)
- **Arquivos gerados:** `ra_XXXXX_historico.json`, `ra_XXXXX_historico.txt`

---

## 6. ETAPA 2 – Download de Anexos (AutbankAttachmentDownloader)

**Arquivo:** `AutbankAttachmentDownloader.js`

### 6.1 Preparação

- Cria pasta `outputDir/RA/anexos/`
- Configura o diretório de download
- Usa preferências do Chrome + CDP para garantir que os arquivos caiam na pasta correta

### 6.2 Fluxo por item com anexo

Para cada linha da timeline que possui anexo:

1. **Reposicionar na página**
   - `goToTimelinePage(item.pageNumber)` – vai para última página e navega até a página desejada

2. **Abrir painel de anexos**
   - Clica no ícone de anexo da linha: `td[8] input`

3. **Baixar todos os arquivos**
   - Localiza botões de download na grid de anexos
   - Clica em cada um
   - Aguarda `.crdownload` desaparecer
   - Move arquivos para `anexos/` se caírem em `outputDir`

4. **Voltar para a timeline**
   - Tenta múltiplos seletores e contextos (main content, frame)
   - Clica no botão **Voltar** (`re_btn_voltar`)

### 6.3 Seletores do botão Voltar

- `/html/body/div[3]/div/form/div[6]/div[2]/input`
- `//*[@id="page:frmre_consulta_anexos:re_btn_voltar"]/input`
- `#page\:frmre_consulta_anexos\:re_btn_voltar > input`
- `//input[@type="image" and contains(@src,"cmdvoltar")]`

### 6.4 Observação importante

Ao clicar em **Voltar**, o portal retorna para a **página 1** do histórico. Por isso a automação registra a posição de cada item com anexo e reposiciona corretamente antes de cada download.

---

## 7. Estrutura de Saída

```
/pasta-destino/
  /10530/
    ra_10530_resumo.json      # Metadados e dados gerais
    ra_10530_historico.json  # Timeline completa
    ra_10530_historico.txt    # Timeline em texto legível
    /anexos/
      arquivo1.pdf
      arquivo2.docx
    execution.log             # Log da execução
```

---

## 8. Diagrama de Sequência

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │    │   Backend   │    │   Driver    │    │   Portal    │    │   Disco     │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │                  │                  │
       │  POST /export    │                  │                  │                  │
       │  {ras, outputDir}│                  │                  │                  │
       │─────────────────>│                  │                  │                  │
       │                  │  start(outputDir)│                  │                  │
       │                  │────────────────>│                  │                  │
       │                  │                  │  navigate        │                  │
       │                  │                  │────────────────>│                  │
       │                  │                  │  login           │                  │
       │                  │                  │────────────────>│                  │
       │                  │                  │  menu + pesquisa │                  │
       │                  │                  │────────────────>│                  │
       │                  │                  │  abrir RA        │                  │
       │                  │                  │────────────────>│                  │
       │                  │                  │  seta + dados    │                  │
       │                  │                  │────────────────>│                  │
       │                  │                  │  scroll_3last     │                  │
       │                  │                  │────────────────>│                  │
       │                  │                  │  coletar páginas │                  │
       │                  │                  │<────────────────>│                  │
       │                  │  saveTimeline     │                  │                  │
       │                  │──────────────────────────────────────────────────────>│
       │                  │                  │  anexos (loop)   │                  │
       │                  │                  │<────────────────>│                  │
       │                  │                  │  download        │                  │
       │                  │                  │────────────────────────────────────>│
       │                  │                  │  Voltar          │                  │
       │                  │                  │────────────────>│                  │
       │  results         │                  │                  │                  │
       │<─────────────────│                  │                  │                  │
       │                  │  quit()          │                  │                  │
       │                  │────────────────>│                  │                  │
```

---

## 9. Arquivos Principais

| Arquivo | Responsabilidade |
|---------|------------------|
| `raExportService.js` | Orquestra o fluxo completo de exportação |
| `AutbankDriver.js` | Controle do navegador, waits, screenshots |
| `AutbankLoginFlow.js` | Login no portal |
| `AutbankSearchFlow.js` | Menu, pesquisa, abertura do chamado |
| `AutbankDetailsFlow.js` | Seta, extração de dados gerais |
| `AutbankTimelineCollector.js` | ETAPA 1: coleta do histórico com paginação |
| `AutbankAttachmentDownloader.js` | ETAPA 2: download de anexos |
| `autbankSelectors.js` | Seletores centralizados para o portal |
| `searchHelpers.js` | Helpers para pesquisa (limpar campo, clicar botão) |

---

## 10. Configurações de Tempo (após abrir o chamado)

| Etapa | Valor | Descrição |
|-------|-------|-----------|
| Seta (antes) | 300ms | Antes de clicar na Seta |
| Seta (depois) | 700ms | Após expandir |
| Paginação (getInfo) | 100ms | Entre leituras |
| goToLastPage | 300ms + 1000ms | Antes e após clique |
| goToPreviousInSequence | 200ms + 1200ms | Antes e após clique |
| openAttachmentByRow | 1000ms | Após abrir painel de anexos |
| Download (após clique) | 800ms | Após cada botão de download |
| Voltar | 300ms + 1000ms | Entre contextos e após clique |
| PAGINATION_POLL_MS | 300ms | Intervalo de polling |
| PAGINATION_WAIT_TIMEOUT | 25s | Timeout máximo |

---

## 11. Tratamento de Erros

- **Screenshot em erro:** `backend/screenshots/ra_XXXXX_erro_*.png`
- **Histórico parcial:** se a coleta falhar, salva o que foi coletado até o momento
- **Log de execução:** `execution.log` em cada pasta de RA

---

## 12. Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `AUTBANK_BASE_URL` | URL do portal |
| `AUTBANK_EMAIL` | E-mail de login |
| `AUTBANK_PASSWORD` | Senha |
| `AUTBANK_USE_WINDOW_SWITCH` | Usar troca de janela no login |
| `BROWSER` | `chrome` ou `edge` |
| `HEADLESS` | `true` ou `false` |

---

*Documentação gerada para o projeto BaixarRAs – Automação Portal Autbank.*
