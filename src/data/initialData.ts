import { LpgPlanoAcao, ApiEndpointDoc } from '../types/culture';

/**
 * Dados estáticos do frontend.
 *
 * Auditoria v13: removidos daqui os conjuntos fixos de emendas (INITIAL_EMENDAS),
 * a série histórica de orçamento (BUDGET_CHRONOLOGY) e as notícias de reserva (INITIAL_NEWS).
 * Eles eram exibidos como "base auditada" sem fonte verificável (números de empenho/PROA e CNPJs
 * inválidos, valores redondos, links apontando só para a página inicial dos veículos).
 * Emendas e notícias agora vêm exclusivamente das APIs (/api/emendas e /api/news);
 * quando a fonte falha, a interface mostra a indisponibilidade em vez de dados substitutos.
 */

/**
 * Snapshot do Plano de Ação LPG de Viamão no Transferegov (programa 47), usado apenas quando
 * /api/lpg não responde. Código do plano e valor total conferidos manualmente no portal
 * Transferegov (DOU Seção 1, p. 2, 12/05/2023). A interface sinaliza "fallback_estatico".
 */
export const INITIAL_LPG_DATA: LpgPlanoAcao = {
  id_plano_acao: 10014,
  codigo_plano_acao: '30882120230006-010014',
  situacao: 'AUTORIZADO',
  valor_total_repasse: 2046951.79,
  data_inicio_vigencia: '2023-06-12',
  data_fim_vigencia: '2024-12-31',
  diagnostico: 'Recebimento de recurso, conforme previsão da Lei Complementar nº 195, de 08 de julho de 2022.',
  objetivos: 'Executar os artigos 6 (Audiovisual) e 8 (Demais Áreas da Cultura) da Lei Complementar nº 195/2022.',
  ente_recebedor: {
    cnpj: '88.000.914/0001-01',
    nome: 'MUNICIPIO DE VIAMAO',
    uf: 'RS',
    municipio: 'VIAMÃO',
    fundo_orgao: 'Secretaria Municipal da Cultura'
  },
  orgao_repassador: {
    sigla: 'MinC',
    nome: 'Ministério da Cultura',
    fundo: 'FUNDO NACIONAL DA CULTURA'
  },
  metas: [
    {
      id_meta_plano_acao: 24164,
      numero_meta_plano_acao: 'M1',
      nome_meta_plano_acao: 'Art. 6º, inciso I',
      descricao_meta_plano_acao: 'Apoio a Produções Audiovisuais (Longas, curtas, documentários e videoclipes)',
      valor_meta_plano_acao: 1084475.06
    },
    {
      id_meta_plano_acao: 24165,
      numero_meta_plano_acao: 'M2',
      nome_meta_plano_acao: 'Art. 6º, inciso II',
      descricao_meta_plano_acao: 'Apoio a Salas de Cinema (Públicas, comunitárias ou cineclubes)',
      valor_meta_plano_acao: 247885.86
    },
    {
      id_meta_plano_acao: 24166,
      numero_meta_plano_acao: 'M3',
      nome_meta_plano_acao: 'Art. 6º, inciso III',
      descricao_meta_plano_acao: 'Formação, Qualificação e Difusão Audiovisual e Festivais',
      valor_meta_plano_acao: 124454.67
    },
    {
      id_meta_plano_acao: 24167,
      numero_meta_plano_acao: 'M4',
      nome_meta_plano_acao: 'Art. 8º',
      descricao_meta_plano_acao: 'Demais Áreas da Cultura (Música, teatro, dança, artesanato, patrimônio e prêmios de trajetória)',
      valor_meta_plano_acao: 590136.20
    }
  ],
  dados_bancarios: [
    {
      id_plano_acao_dado_bancario: 10688,
      nome_banco_plano_acao_dado_bancario: 'Banco do Brasil',
      numero_agencia_plano_acao_dado_bancario: 628,
      dv_agencia_plano_acao_dado_bancario: '9',
      numero_conta_plano_acao_dado_bancario: 70018,
      dv_conta_plano_acao_dado_bancario: '5',
      nome_programa_agil_conta_plano_acao_dado_bancario: 'MINC-LPG-MUNI-AUD',
      situacao_conta_plano_acao_dado_bancario: 'Conta Ativa'
    },
    {
      id_plano_acao_dado_bancario: 10689,
      nome_banco_plano_acao_dado_bancario: 'Banco do Brasil',
      numero_agencia_plano_acao_dado_bancario: 628,
      dv_agencia_plano_acao_dado_bancario: '9',
      numero_conta_plano_acao_dado_bancario: 70019,
      dv_conta_plano_acao_dado_bancario: '3',
      nome_programa_agil_conta_plano_acao_dado_bancario: 'MINC-LPG-MUNI-OUTRAS',
      situacao_conta_plano_acao_dado_bancario: 'Conta Ativa'
    }
  ],
  base_legal: 'Lei Complementar nº 195/2022 e Decreto nº 11.525/2023',
  fonte_oficial: 'Plataforma Transferegov.br / Fundo a Fundo / Ministério da Cultura',
  fonte_dado: 'fallback_estatico'
};

export const API_DOCUMENTATION: ApiEndpointDoc[] = [
  {
    id: 'api-serverless-lpg',
    nome: 'Endpoint Serverless /api/lpg (Lei Paulo Gustavo / MinC)',
    esfera: 'Serverless Edge (Python 3.10+)',
    url: '/api/lpg',
    metodo: 'GET',
    descricao: 'Retorna a prestação pública oficial, metas orçamentárias (Art. 6º Audiovisual e Art. 8º Demais Áreas) e contas fiduciárias da Lei Paulo Gustavo em Viamão/RS via API Transferegov Fundo a Fundo.',
    parametros: [],
    exemploResposta: JSON.stringify({
      success: true,
      fonte: "API Pública Transferegov Fundo a Fundo (MinC)",
      base_legal: "Lei Complementar nº 195/2022 (Lei Paulo Gustavo)",
      municipio: "Viamão",
      uf: "RS",
      plano_acao: {
        codigo_plano_acao: "30882120230006-010014",
        situacao: "AUTORIZADO",
        valor_total_repasse: 2046951.79,
        metas: [
          { "numero_meta": "M1", "nome_meta": "Art. 6º, inciso I", "descricao": "Apoio a Produções Audiovisuais", "valor": 1084475.06 },
          { "numero_meta": "M2", "nome_meta": "Art. 6º, inciso II", "descricao": "Apoio a salas de cinema", "valor": 247885.86 },
          { "numero_meta": "M3", "nome_meta": "Art. 6º, inciso III", "descricao": "Formação, qualificação e difusão", "valor": 124454.67 },
          { "numero_meta": "M4", "nome_meta": "Art. 8º", "descricao": "Demais áreas da cultura", "valor": 590136.20 }
        ]
      }
    }, null, 2)
  },
  {
    id: 'api-serverless-news',
    nome: 'Endpoint Serverless /api/news (Notícias e Editais Verificados)',
    esfera: 'Serverless Edge (Python 3.10+)',
    url: '/api/news?q=cultura',
    metodo: 'GET',
    descricao: 'Consulta notícias, publicações de editais e notas oficiais sobre cultura em Viamão/RS via portais municipais, imprensa regional e órgãos oficiais com filtro contra desinformação.',
    parametros: [
      { nome: 'q', tipo: 'string', descricao: 'Termo de busca (ex: pnab, edital, viamao)', exemplo: 'pnab' }
    ],
    exemploResposta: JSON.stringify({
      success: true,
      termo_pesquisado: "cultura",
      total: 4,
      noticias: [
        {
          id: "noticia-viamao-pnab-prorrogada",
          titulo: "Prefeitura de Viamão prorroga Editais da PNAB (Literatura, Artesanato e Pareceristas)",
          resumo: "Inscrições prorrogadas para fazedores de cultura locais através da Secretaria Municipal de Cultura com recursos federais descentralizados.",
          link: "https://www.viamao.rs.gov.br/portal/noticias/0/3/9656/prorrogados-prazos-de-inscricao-dos-editais-pnab-2026---literatura-e-artesanato-com-nova-redacao",
          origem: "Municipal (Viamão)",
          veiculo_imprensa: "Secretaria Municipal da Cultura de Viamão",
          categoria_filtro: "editais",
          etiqueta: "Editais PNAB Viamão",
          data: "28/08/2026",
          imagem: "https://www.viamao.rs.gov.br/fotos/cc34e6a8eb6cbf1b106f93ec70fc206b.jpg",
          jurisdicao: "Municipal (Viamão)",
          fonte_confiavel: true
        }
      ],
      politica_integridade: "Zero fake news. Fontes estritamente limitadas a órgãos oficiais de Viamão, IFRS, SEDAC-RS e imprensa regional verificada.",
      data_consulta: "28/08/2026"
    }, null, 2)
  }
];

/**
 * Emendas candidatas a inclusão (aguardando confirmação oficial de valor e empenho no SAE/ALRS ou Portal da Transparência)
 * Conforme diretrizes de integridade, nunca incluir com valores estimados.
 */
export const EMENDAS_A_CONFIRMAR = [
  {
    id: 'cand-est-2025-01',
    ano: 2025,
    parlamentar: 'Deputada Estadual Bruna Rodrigues (PCdoB/RS)',
    partido: 'PCdoB/RS',
    esfera: 'Estadual (a confirmar)',
    evento: '1ª Semana do Hip Hop de Viamão (10 a 16 de novembro de 2025)',
    beneficiario: 'Associação da Cultura Hip Hop de Viamão',
    status: 'Candidata (aguardando número de emenda e empenho no SAE/ALRS)',
    fontes_noticiosas: [
      'https://www.brasildefators.com.br/2025/11/10/viamao-recebe-a-1-semana-do-hip-hop-com-oficinas-batalhas-e-shows-gratuitos',
      'https://rapdab.com.br/1-semana-do-hip-hop-de-viamao-celebra-a-cultura-urbana-e-cidadania/'
    ],
    observacao: 'Matérias jornalísticas citam apoio via emenda parlamentar, mas sem informar número do processo ou valor exato repassado.'
  }
];
