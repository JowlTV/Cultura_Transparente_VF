/**
 * =============================================================================
 * CULTURA TRANSPARENTE - SERVIÇO DE IA PARA PROJETOS CULTURAIS
 * Módulo: src/services/culturalAiService.ts
 * =============================================================================
 * Comunica com o endpoint /api/chat que conduz o proponente pelas 11 etapas
 * oficiais da elaboração de projetos culturais, com base exclusivamente em
 * documentos legais e dados reais do sistema, sem valores inventados.
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  etapaAtual?: number;
  secoesAtualizadas?: Record<string, string>;
  fontesCitadas?: Array<{ documento: string; trecho: string }>;
  pendencias?: string[];
  isError?: boolean;
}

export interface EtapaConfig {
  etapa: number;
  chave: string;
  nome: string;
  descricao: string;
  perguntaPadrao: string;
  sugestoes: string[];
}

export const ROTEIRO_ETAPAS: EtapaConfig[] = [
  {
    etapa: 1,
    chave: 'edital_politica',
    nome: 'Edital ou Política',
    descricao: 'Escolha do instrumento: PNAB, LPG, Emendas ou Edital Municipal',
    perguntaPadrao: 'Para qual edital ou política cultural você deseja preparar seu projeto (PNAB, Lei Paulo Gustavo, emenda parlamentar ou edital municipal de Viamão)?',
    sugestoes: ['PNAB Viamão (Lei 14.399/2022)', 'Lei Paulo Gustavo (LPG)', 'Emenda Parlamentar', 'Edital Municipal de Viamão'],
  },
  {
    etapa: 2,
    chave: 'ideia_projeto',
    nome: 'Ideia do Projeto',
    descricao: 'Ideia central e formato da proposta artística',
    perguntaPadrao: 'Qual é a ideia central do seu projeto cultural em poucas palavras?',
    sugestoes: ['Oficinas de música e hip-hop', 'Mostra audiovisual comunitária', 'Circulação teatral em escolas', 'Exposição fotográfica e memória'],
  },
  {
    etapa: 3,
    chave: 'tipo_proponente',
    nome: 'Tipo de Proponente',
    descricao: 'Pessoa física, coletivo informal, MEI ou organização/associação',
    perguntaPadrao: 'Você vai inscrever o projeto como pessoa física, coletivo sem CNPJ, MEI ou organização/associação?',
    sugestoes: ['Pessoa Física', 'Coletivo Cultural (sem CNPJ)', 'MEI Cultural', 'Associação / OSC (com CNPJ)'],
  },
  {
    etapa: 4,
    chave: 'objetivo_principal',
    nome: 'Objetivo Principal',
    descricao: 'Objetivo geral e impacto cultural para a comunidade',
    perguntaPadrao: 'Qual é o objetivo principal que o seu projeto quer alcançar em Viamão?',
    sugestoes: ['Capacitar jovens em linguagens artísticas', 'Difundir a cultura popular nas periferias', 'Preservar a memória histórica local'],
  },
  {
    etapa: 5,
    chave: 'publico_territorio',
    nome: 'Público e Território',
    descricao: 'Público-alvo prioritário e território de Viamão',
    perguntaPadrao: 'Quem é o público-alvo prioritário e em qual bairro ou região de Viamão a ação será realizada?',
    sugestoes: ['Vila Santa Isabel', 'Vila Elza / Tarumã', 'Itapuã / Zona Rural', 'Centro de Viamão'],
  },
  {
    etapa: 6,
    chave: 'atividades_metodologia',
    nome: 'Atividades e Execução',
    descricao: 'Atividades práticas e metodologia de trabalho',
    perguntaPadrao: 'Quais são as principais atividades do projeto e como elas serão realizadas na prática?',
    sugestoes: ['Oficinas práticas semanais', 'Ensaios e apresentação aberta', 'Gravação, edição e exibição'],
  },
  {
    etapa: 7,
    chave: 'acessibilidade',
    nome: 'Medidas de Acessibilidade',
    descricao: 'Acessibilidade física, comunicacional (Libras/Audiodescrição) e atitudinal',
    perguntaPadrao: 'Quais medidas de acessibilidade física ou comunicacional (como Libras ou audiodescrição) serão adotadas no projeto?',
    sugestoes: ['Intérprete de Libras nas apresentações', 'Audiodescrição das peças e mostras', 'Local térreo com rampa e sanitário adaptado'],
  },
  {
    etapa: 8,
    chave: 'contrapartida_social',
    nome: 'Contrapartida Social',
    descricao: 'Ação gratuita de retorno social para a comunidade',
    perguntaPadrao: 'Qual será a contrapartida social gratuita oferecida pelo projeto à comunidade de Viamão?',
    sugestoes: ['Apresentação gratuita em praça pública', 'Oficina gratuita em escola municipal', 'Distribuição gratuita de catálogos/livros'],
  },
  {
    etapa: 9,
    chave: 'cronograma',
    nome: 'Cronograma',
    descricao: 'Fases de pré-produção, produção e pós-produção',
    perguntaPadrao: 'Em quantos meses você planeja executar o projeto e quais os prazos das principais fases?',
    sugestoes: ['Execução em 3 meses', 'Execução em 6 meses', 'Fase 1: Preparação (Mês 1) • Fase 2: Ações (Mês 2-3)'],
  },
  {
    etapa: 10,
    chave: 'orcamento',
    nome: 'Orçamento',
    descricao: 'Itens de custo e valores estimados informados pelo proponente',
    perguntaPadrao: 'Quais são os principais itens de custo do seu projeto e quais os valores estimados para cada um?',
    sugestoes: ['Cachês de artistas e oficineiros', 'Locação de som, iluminação e espaço', 'Despesas com acessibilidade e divulgação'],
  },
  {
    etapa: 11,
    chave: 'revisao_final',
    nome: 'Revisão Final',
    descricao: 'Revisão consolidada e conferência para exportação',
    perguntaPadrao: 'Você deseja fazer algum ajuste no texto do seu projeto antes de gerar o documento final para download?',
    sugestoes: ['Tudo certo, quero baixar o documento .docx', 'Quero ajustar o orçamento', 'Quero revisar as medidas de acessibilidade'],
  },
];

export interface ExemploTema {
  titulo: string;
  editalSugerido: string;
  segmento: string;
  ideiaInicial: string;
}

/**
 * Exemplos temáticos de propostas sem valores fixos arbitrários,
 * em total conformidade com o princípio de que o orçamento é definido pelo proponente.
 */
export const PROJETOS_EXEMPLO: ExemploTema[] = [
  {
    titulo: 'Oficinas de Hip-Hop e Rima Periférica',
    editalSugerido: 'PNAB Viamão',
    segmento: 'Cultura Urbana / Música',
    ideiaInicial: 'Realização de ciclo de oficinas de rima, produção musical e poesia falada para jovens, culminando em uma mostra artística aberta à comunidade.',
  },
  {
    titulo: 'Documentário e Memória das Comunidades Tradicionais',
    editalSugerido: 'LPG Viamão (Audiovisual)',
    segmento: 'Audiovisual / Patrimônio Imaterial',
    ideiaInicial: 'Gravação de minidocumentário sobre memórias orais, mestres da cultura popular e tradições de Viamão, com audiodescrição e tradução em Libras.',
  },
  {
    titulo: 'Circulação Teatral nas Escolas Públicas',
    editalSugerido: 'PNAB Viamão',
    segmento: 'Teatro / Artes Cênicas',
    ideiaInicial: 'Circulação de espetáculo teatral infantojuvenil em escolas municipais de Viamão, com debate pedagógico e material didático acessível.',
  },
  {
    titulo: 'Mostra Fotográfica & Painéis Táteis',
    editalSugerido: 'Edital Municipal / PNAB',
    segmento: 'Artes Visuais / Patrimônio',
    ideiaInicial: 'Exposição fotográfica retratando o patrimônio histórico e ambiental de Viamão, com painéis em relevo para pessoas cegas e visitas guiadas.',
  },
];

export interface AssistantTurnResult {
  text: string;
  etapaAtual: number;
  secoesAtualizadas: Record<string, string>;
  fontesCitadas: Array<{ documento: string; trecho: string }>;
  pendencias: string[];
  isError?: boolean;
}

export function translateAiFailure(data: {
  code?: string;
  error?: string;
  details?: Array<{ model?: string; status?: number; error?: string }> | string;
}): string {
  if (data.code === 'MISSING_GEMINI_API_KEY') {
    return 'A chave de inteligência artificial (GEMINI_API_KEY) não está configurada no ambiente. Configure a variável de ambiente para habilitar o assistente.';
  }

  const details = data.details;
  const statuses: number[] = [];
  let isTimeout = false;

  if (Array.isArray(details)) {
    for (const d of details) {
      if (typeof d.status === 'number') {
        statuses.push(d.status);
      }
      if (
        d.status === 408 ||
        (d.error && (
          d.error.toLowerCase().includes('timeout') ||
          d.error.toLowerCase().includes('timed out') ||
          d.error.toLowerCase().includes('tempo limite')
        ))
      ) {
        isTimeout = true;
      }
    }
  }

  if (data.code === 'AI_PROCESS_TIMEOUT' || isTimeout || statuses.includes(408)) {
    return 'a IA demorou demais para responder';
  }
  if (statuses.includes(429)) {
    return 'limite de uso da chave de IA atingido';
  }
  if (statuses.includes(400) || statuses.includes(403)) {
    return 'chave de IA inválida ou sem permissão';
  }
  if (statuses.includes(404)) {
    return 'modelo de IA descontinuado';
  }

  return data.error || 'Os servidores de inteligência artificial estão temporariamente indisponíveis. Por favor, tente novamente em alguns instantes.';
}

export async function sendMessageToAssistant(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
): Promise<AssistantTurnResult> {
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), 70000);

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
      signal: abortController.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        return {
          text: d.mensagem || json.text || '',
          etapaAtual: typeof d.etapa_atual === 'number' ? d.etapa_atual : 1,
          secoesAtualizadas: d.secoes_atualizadas || {},
          fontesCitadas: d.fontes_citadas || [],
          pendencias: d.pendencias || [],
          isError: false,
        };
      }

      if (!json.success) {
        const errorMsg = translateAiFailure(json);
        return {
          text: `⚠️ **Aviso do Consultor de Projetos:** ${errorMsg}`,
          etapaAtual: 1,
          secoesAtualizadas: {},
          fontesCitadas: [],
          pendencias: [],
          isError: true,
        };
      }
    } else {
      let errText = 'Servidor de IA indisponível.';
      try {
        const errJson = await res.json();
        errText = translateAiFailure(errJson);
      } catch {}
      return {
        text: `⚠️ **Erro na comunicação com a IA:** ${errText}`,
        etapaAtual: 1,
        secoesAtualizadas: {},
        fontesCitadas: [],
        pendencias: [],
        isError: true,
      };
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err?.name === 'AbortError') {
      return {
        text: '⚠️ **Aviso do Consultor de Projetos:** a IA demorou demais para responder',
        etapaAtual: 1,
        secoesAtualizadas: {},
        fontesCitadas: [],
        pendencias: [],
        isError: true,
      };
    }
    return {
      text: '⚠️ **Indisponibilidade de Conexão:** Não foi possível conectar ao consultor no momento. Por favor, verifique sua conexão ou tente novamente.',
      etapaAtual: 1,
      secoesAtualizadas: {},
      fontesCitadas: [],
      pendencias: [],
      isError: true,
    };
  }

  return {
    text: '⚠️ O assistente de IA não pôde gerar uma resposta no momento.',
    etapaAtual: 1,
    secoesAtualizadas: {},
    fontesCitadas: [],
    pendencias: [],
    isError: true,
  };
}
