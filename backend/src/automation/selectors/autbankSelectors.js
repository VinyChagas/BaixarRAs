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

/** Tela de detalhe da RA - botão Seta (expansão) input type="image" e campos gerais */
export const detailSelectors = {
  /** input type="image" src="abToggleShow.gif" - expandir detalhes */
  setaButton: {
    id: 'page:frmre_consseqra_contato_r:re_btntoggler_consseqra_contato_r',
    css: '#page\\:frmre_consseqra_contato_r\\:re_btntoggler_consseqra_contato_r > input',
    cssAlt: '#page\\:frmre_consseqra_contato_r\\:re_btntoggler_consseqra_contato_r input',
    cssBySrc: 'input[type="image"][src*="abToggleShow"]',
    cssByClass: 'input.btnToggler[type="image"]',
    xpath: '//*[@id="page:frmre_consseqra_contato_r:re_btntoggler_consseqra_contato_r"]/input',
    xpathAbsolute: '/html/body/div[3]/div/form/div[4]/input',
    xpathBySrc: '//input[@type="image" and contains(@src,"abToggleShow")]',
  },
  numeroRA: {
    id: 'page:frmre_consseqra_contato_r:numerora',
    css: '#page\\:frmre_consseqra_contato_r\\:numerora',
    xpath: '//*[@id="page:frmre_consseqra_contato_r:numerora"]',
    xpathAbsolute: '/html/body/div[3]/div/form/div[5]/div[17]/input',
  },
  sistemaOriginal: {
    id: 'page:frmre_consseqra_contato_r:descsistema',
    css: '#page\\:frmre_consseqra_contato_r\\:descsistema',
    xpath: '//*[@id="page:frmre_consseqra_contato_r:descsistema"]',
    xpathAbsolute: '/html/body/div[3]/div/form/div[5]/div[13]/input',
  },
  sistemaAtual: {
    id: 'page:frmre_consseqra_contato_r:sistemaatu',
    css: '#page\\:frmre_consseqra_contato_r\\:sistemaatu',
    xpath: '//*[@id="page:frmre_consseqra_contato_r:sistemaatu"]',
    xpathAbsolute: '/html/body/div[3]/div/form/div[5]/div[15]/input',
  },
  versao: {
    id: 'page:frmre_consseqra_contato_r:versaosistema',
    css: '#page\\:frmre_consseqra_contato_r\\:versaosistema',
    xpath: '//*[@id="page:frmre_consseqra_contato_r:versaosistema"]',
    xpathAbsolute: '/html/body/div[3]/div/form/div[5]/div[11]/input',
  },
  dataAbertura: {
    id: 'page:frmre_consseqra_contato_r:dataabertura',
    css: '#page\\:frmre_consseqra_contato_r\\:dataabertura',
    xpath: '//*[@id="page:frmre_consseqra_contato_r:dataabertura"]',
    xpathAbsolute: '/html/body/div[3]/div/form/div[5]/div[1]/div[1]/input',
  },
  ambiente: {
    id: 'page:frmre_consseqra_contato_r:prioridadeambientelabel',
    css: '#page\\:frmre_consseqra_contato_r\\:prioridadeambientelabel',
    xpath: '//*[@id="page:frmre_consseqra_contato_r:prioridadeambientelabel"]',
    xpathAbsolute: '/html/body/div[3]/div/form/div[5]/div[5]/input',
  },
  assunto: {
    id: 'page:frmre_consseqra_contato_r:motivo',
    css: '#page\\:frmre_consseqra_contato_r\\:motivo',
    xpath: '//*[@id="page:frmre_consseqra_contato_r:motivo"]',
    xpathAbsolute: '/html/body/div[3]/div/form/div[5]/div[8]/div[1]/input',
  },
  itemMenu: {
    id: 'page:frmre_consseqra_contato_r:item',
    css: '#page\\:frmre_consseqra_contato_r\\:item',
    xpath: '//*[@id="page:frmre_consseqra_contato_r:item"]',
    xpathAbsolute: '/html/body/div[3]/div/form/div[5]/div[7]/div[1]/input',
  },
  contato: {
    id: 'page:frmre_consseqra_contato_r:contatoinicial',
    css: '#page\\:frmre_consseqra_contato_r\\:contatoinicial',
    xpath: '//*[@id="page:frmre_consseqra_contato_r:contatoinicial"]',
    xpathAbsolute: '/html/body/div[3]/div/form/div[5]/div[10]/div[1]/div[1]/input',
  },
  situacao: {
    id: 'page:frmre_consseqra_contato_r:situacaolabel',
    css: '#page\\:frmre_consseqra_contato_r\\:situacaolabel',
    xpath: '//*[@id="page:frmre_consseqra_contato_r:situacaolabel"]',
    xpathAbsolute: '/html/body/div[3]/div/form/div[5]/div[9]/div[2]/div[1]/input',
  },
  atendente: {
    id: 'page:frmre_consseqra_contato_r:nomeanalistaresponsavel',
    css: '#page\\:frmre_consseqra_contato_r\\:nomeanalistaresponsavel',
    xpath: '//*[@id="page:frmre_consseqra_contato_r:nomeanalistaresponsavel"]',
    xpathAbsolute: '/html/body/div[3]/div/form/div[5]/div[9]/div[1]/div[1]/input',
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

/** Tela de anexos - Consulta de Anexos */
export const attachmentSelectors = {
  /** Grid de anexos - linhas da tabela */
  grid: {
    css: '#page\\:frmre_consulta_anexos\\:ssBTOREAnexosGrid0',
    xpath: '//*[@id="page:frmre_consulta_anexos:ssBTOREAnexosGrid0"]',
  },
  rows: {
    css: '#page\\:frmre_consulta_anexos\\:ssBTOREAnexosGrid0 tbody tr',
    xpath: '//*[@id="page:frmre_consulta_anexos:ssBTOREAnexosGrid0"]/tbody/tr',
  },
  /** input type="image" - elemento real de download (Abrir/Salvar Anexo) */
  downloadImageInput: {
    css: '#page\\:frmre_consulta_anexos\\:ssBTOREAnexosGrid0 > tbody > tr > td:nth-child(2) > input[type="image"]',
    cssAlt: 'input[type="image"][alt="Abrir/Salvar Anexo"]',
    cssByAlt: 'input[alt="Abrir/Salvar Anexo"]',
    cssBySrc: 'input[type="image"][src*="gridvisualizaranexo"]',
    xpath: '//*[@id="page:frmre_consulta_anexos:ssBTOREAnexosGrid0"]/tbody/tr/td[2]/input',
    xpathAbsolute: '/html/body/div[3]/div/form/div[6]/div[1]/div/table/tbody/tr/td[2]/input',
    xpathByAlt: '//input[@type="image" and @alt="Abrir/Salvar Anexo"]',
    xpathBySrc: '//input[@type="image" and contains(@src,"gridvisualizaranexo")]',
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
