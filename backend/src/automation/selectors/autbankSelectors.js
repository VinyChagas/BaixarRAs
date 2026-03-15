/**
 * Seletores centralizados para o portal Autbank
 * Ajuste aqui para alterar seletores quando o portal mudar
 *
 * Ordem de prioridade: id > css > xpath
 */

export const portalLinkSelectors = {
  css: 'a[href*="regatendimentoext"], a[href*="reindex"], a.portal-link, a[target="_blank"]',
  xpath:
    '//a[contains(@href, "regatendimentoext") or contains(@href, "reindex") or @target="_blank"]',
};

export const loginSelectors = {
  userField: {
    id: 'frmcaindex:NOME_USUARIO',
    css: '#frmcaindex\\:NOME_USUARIO',
    xpath: '//*[@id="frmcaindex:NOME_USUARIO"]',
  },
  passwordField: {
    id: 'frmcaindex:SENHA_ATUAL',
    css: '#frmcaindex\\:SENHA_ATUAL',
    xpath: '//*[@id="frmcaindex:SENHA_ATUAL"]',
  },
  loginButton: {
    id: 'frmcaindex:btnOk',
    css: '#frmcaindex\\:btnOk',
    xpath: '//*[@id="frmcaindex:btnOk"]',
  },
};

export const menuSelectors = {
  consultaRaMenu: {
    id: 'frmTopLayoutDoubleMenu:topmenu:t_2',
    css: '#frmTopLayoutDoubleMenu\\:topmenu\\:t_2',
    xpath: '//*[@id="frmTopLayoutDoubleMenu:topmenu:t_2"]',
  },
  consultaRaSubmenu: {
    id: 'frmTopLayoutDoubleMenu:page:t_2_1',
    css: '#frmTopLayoutDoubleMenu\\:page\\:t_2_1',
    xpath: '//*[@id="frmTopLayoutDoubleMenu:page:t_2_1"]',
  },
};

export const consultaSelectors = {
  numeroRaField: {
    id: 'page:frmre_consra_contato_r:numerora',
    css: '#page\\:frmre_consra_contato_r\\:numerora',
    xpath: '//*[@id="page:frmre_consra_contato_r:numerora"]',
  },
  dataDeField: {
    id: 'page:frmre_consra_contato_r:datade',
    css: '#page\\:frmre_consra_contato_r\\:datade',
    xpath: '//*[@id="page:frmre_consra_contato_r:datade"]',
  },
  searchButton: {
    id: 'page:frmre_consra_contato_r:re_btn_anexar',
    css: '#page\\:frmre_consra_contato_r\\:re_btn_anexar input',
    xpath: '//*[@id="page:frmre_consra_contato_r:re_btn_anexar"]/input',
  },
};

/** Formulário de pesquisa - Período de abertura e botão Pesquisar */
export const searchFormSelectors = {
  periodoAbertura: {
    id: 'page:frmre_consra_contato_r:datade',
    css: '#page\\:frmre_consra_contato_r\\:datade',
    xpath: '//*[@id="page:frmre_consra_contato_r:datade"]',
    xpathAbsolute: '/html/body/div[3]/div/form/div[3]/div[1]/div[3]/input',
  },
  pesquisarButton: {
    id: 'page:frmre_consra_contato_r:re_btn_anexar',
    css: '#page\\:frmre_consra_contato_r\\:re_btn_anexar input',
    xpath: '//*[@id="page:frmre_consra_contato_r:re_btn_anexar"]/input',
    xpathAbsolute: '/html/body/div[3]/div/form/div[3]/div[5]/div[2]/input',
  },
};

export const gridSelectors = {
  gridContainer: {
    id: 'page:frmre_consra_contato_r:ssBTORAGridContato0',
    css: '#page\\:frmre_consra_contato_r\\:ssBTORAGridContato0',
    xpath: '//*[@id="page:frmre_consra_contato_r:ssBTORAGridContato0"]',
  },
  detailButton: {
    css: 'td:nth-of-type(9) > input',
    xpath: '//*[@id="page:frmre_consra_contato_r:ssBTORAGridContato0"]/tbody/tr/td[9]/input',
  },
  firstRow: {
    css: '#page\\:frmre_consra_contato_r\\:ssBTORAGridContato0 tbody tr',
    xpath: '//*[@id="page:frmre_consra_contato_r:ssBTORAGridContato0"]/tbody/tr',
  },
};

/** Tela de detalhe da RA - botão Seta (expansão) e campos gerais */
export const detailSelectors = {
  setaButton: {
    id: 'page:frmre_consseqra_contato_r:re_btntoggler_consseqra_contato_r',
    css: '#page\\:frmre_consseqra_contato_r\\:re_btntoggler_consseqra_contato_r input',
    xpath: '//*[@id="page:frmre_consseqra_contato_r:re_btntoggler_consseqra_contato_r"]/input',
  },
  numeroRA: {
    id: 'page:frmre_consseqra_contato_r:numerora',
    css: '#page\\:frmre_consseqra_contato_r\\:numerora',
    xpath: '//*[@id="page:frmre_consseqra_contato_r:numerora"]',
  },
  sistemaOriginal: {
    id: 'page:frmre_consseqra_contato_r:descsistema',
    css: '#page\\:frmre_consseqra_contato_r\\:descsistema',
    xpath: '//*[@id="page:frmre_consseqra_contato_r:descsistema"]',
  },
  sistemaAtual: {
    id: 'page:frmre_consseqra_contato_r:sistemaatu',
    css: '#page\\:frmre_consseqra_contato_r\\:sistemaatu',
    xpath: '//*[@id="page:frmre_consseqra_contato_r:sistemaatu"]',
  },
  versao: {
    id: 'page:frmre_consseqra_contato_r:versaosistema',
    css: '#page\\:frmre_consseqra_contato_r\\:versaosistema',
    xpath: '//*[@id="page:frmre_consseqra_contato_r:versaosistema"]',
  },
  dataAbertura: {
    id: 'page:frmre_consseqra_contato_r:dataabertura',
    css: '#page\\:frmre_consseqra_contato_r\\:dataabertura',
    xpath: '//*[@id="page:frmre_consseqra_contato_r:dataabertura"]',
  },
  ambiente: {
    id: 'page:frmre_consseqra_contato_r:prioridadeambientelabel',
    css: '#page\\:frmre_consseqra_contato_r\\:prioridadeambientelabel',
    xpath: '//*[@id="page:frmre_consseqra_contato_r:prioridadeambientelabel"]',
  },
  assunto: {
    id: 'page:frmre_consseqra_contato_r:motivo',
    css: '#page\\:frmre_consseqra_contato_r\\:motivo',
    xpath: '//*[@id="page:frmre_consseqra_contato_r:motivo"]',
  },
  itemMenu: {
    id: 'page:frmre_consseqra_contato_r:item',
    css: '#page\\:frmre_consseqra_contato_r\\:item',
    xpath: '//*[@id="page:frmre_consseqra_contato_r:item"]',
  },
  contato: {
    id: 'page:frmre_consseqra_contato_r:contatoinicial',
    css: '#page\\:frmre_consseqra_contato_r\\:contatoinicial',
    xpath: '//*[@id="page:frmre_consseqra_contato_r:contatoinicial"]',
  },
  situacao: {
    id: 'page:frmre_consseqra_contato_r:situacaolabel',
    css: '#page\\:frmre_consseqra_contato_r\\:situacaolabel',
    xpath: '//*[@id="page:frmre_consseqra_contato_r:situacaolabel"]',
  },
  atendente: {
    id: 'page:frmre_consseqra_contato_r:nomeanalistaresponsavel',
    css: '#page\\:frmre_consseqra_contato_r\\:nomeanalistaresponsavel',
    xpath: '//*[@id="page:frmre_consseqra_contato_r:nomeanalistaresponsavel"]',
  },
};

/** Elemento de paginação do histórico (ex: "Página 1 de 6") */
export const timelinePaginationSelectors = {
  infoText: {
    xpath:
      '//*[@id="page:frmre_consseqra_contato_r:ssBTORESequenciaRA0"]/thead/tr[1]/th/span/table/tbody/tr/td[2]/span',
    xpathAbsolute: '/html/body/div[3]/div/form/div[3]/div/table/thead/tr[1]/th/span/table/tbody/tr/td[2]/span',
  },
};

/** Grid do histórico de sequências da RA */
export const timelineSelectors = {
  gridId: 'page:frmre_consseqra_contato_r:ssBTORESequenciaRA0',
  grid: {
    css: '#page\\:frmre_consseqra_contato_r\\:ssBTORESequenciaRA0',
    xpath: '//*[@id="page:frmre_consseqra_contato_r:ssBTORESequenciaRA0"]',
  },
  rows: {
    css: '#page\\:frmre_consseqra_contato_r\\:ssBTORESequenciaRA0 tbody tr',
    xpath: '//*[@id="page:frmre_consseqra_contato_r:ssBTORESequenciaRA0"]/tbody/tr',
  },
  buttonGoToStart: {
    id: 'page:frmre_consseqra_contato_r:ssBTORESequenciaRA0:ssBTORESequenciaRA0_scroll_3last',
    css: '#page\\:frmre_consseqra_contato_r\\:ssBTORESequenciaRA0\\:ssBTORESequenciaRA0_scroll_3last img',
    xpath: '//*[@id="page:frmre_consseqra_contato_r:ssBTORESequenciaRA0:ssBTORESequenciaRA0_scroll_3last"]/img',
    xpathAbsolute: '/html/body/div[3]/div/form/div[3]/div/table/thead/tr[1]/th/span/table/tbody/tr/td[3]/table/tbody/tr/td[2]/a/img',
  },
  buttonPreviousPage: {
    id: 'page:frmre_consseqra_contato_r:ssBTORESequenciaRA0:ssBTORESequenciaRA0_scroll_1previous',
    css: '#page\\:frmre_consseqra_contato_r\\:ssBTORESequenciaRA0\\:ssBTORESequenciaRA0_scroll_1previous img',
    xpath: '//*[@id="page:frmre_consseqra_contato_r:ssBTORESequenciaRA0:ssBTORESequenciaRA0_scroll_1previous"]/img',
    xpathAbsolute: '/html/body/div[3]/div/form/div[3]/div/table/thead/tr[1]/th/span/table/tbody/tr/td[1]/table/tbody/tr/td[2]/a/img',
  },
  /** Elemento clicável do botão avançar - id pode estar no <a> ou no container; parent::a como fallback */
  buttonPreviousPageAnchor: {
    id: 'page:frmre_consseqra_contato_r:ssBTORESequenciaRA0:ssBTORESequenciaRA0_scroll_1previous',
    xpath: '//*[@id="page:frmre_consseqra_contato_r:ssBTORESequenciaRA0:ssBTORESequenciaRA0_scroll_1previous"]/parent::a',
  },
  buttonNextPage: {
    id: 'page:frmre_consseqra_contato_r:ssBTORESequenciaRA0:ssBTORESequenciaRA0_scroll_2next',
    css: '#page\\:frmre_consseqra_contato_r\\:ssBTORESequenciaRA0\\:ssBTORESequenciaRA0_scroll_2next img',
    xpath: '//*[@id="page:frmre_consseqra_contato_r:ssBTORESequenciaRA0:ssBTORESequenciaRA0_scroll_2next"]/img',
  },
  buttonFirstPage: {
    css: '#page\\:frmre_consseqra_contato_r\\:ssBTORESequenciaRA0\\:ssBTORESequenciaRA0_scroll_0first img',
    xpath: '//*[contains(@id,"scroll_0first")]/img',
  },
  attachmentButtonInRow: {
    css: 'td:nth-child(8) input[type="image"]',
    xpath: './td[8]/input',
  },
};

/** Tela de anexos */
export const attachmentSelectors = {
  downloadButtons: {
    css: '#page\\:frmre_consulta_anexos\\:ssBTOREAnexosGrid0 tbody tr td:nth-child(2) input',
    xpath: '//*[@id="page:frmre_consulta_anexos:ssBTOREAnexosGrid0"]/tbody/tr/td[2]/input',
  },
  voltarButton: {
    id: 'page:frmre_consulta_anexos:re_btn_voltar',
    css: '#page\\:frmre_consulta_anexos\\:re_btn_voltar > input',
    cssAlt: '#page\\:frmre_consulta_anexos\\:re_btn_voltar input',
    xpath: '//*[@id="page:frmre_consulta_anexos:re_btn_voltar"]/input',
    xpathAbsolute: '/html/body/div[3]/div/form/div[6]/div[2]/input',
    xpathImg: '//input[@type="image" and contains(@src,"cmdvoltar")]',
  },
};
