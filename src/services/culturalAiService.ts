/**
 * =============================================================================
 * CULTURA TRANSPARENTE - SERVIÇO DE IA PARA PROJETOS CULTURAIS
 * Módulo: src/services/culturalAiService.ts
 * =============================================================================
 * Comunica com o endpoint /api/chat que conduz o proponente pelas etapas
 * oficiais da elaboração de projetos culturais, com base exclusivamente em
 * documentos legais e dados reais do sistema, sem valores inventados.
 * Suporta o Roteiro Padrão (PNAB/LPG/Emendas/Municipal) e o Roteiro
 * específico da Lei Rouanet (IN MinC nº 29/2026).
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
  conferenciaRegras?: any;
  politica?: string;
  isError?: boolean;
}

export interface EtapaConfig {
  etapa: number;
  chave: string;
  nome: string;
  descricao: string;
  perguntaPadrao: string;
  sugestoes: string[];
  fundamentacaoLegal?: string;
}

// Roteiro Padrão (PNAB, LPG, Emendas, Municipal) - 11 etapas
export const ROTEIRO_ETAPAS: EtapaConfig[] = [
  {
    etapa: 1,
    chave: 'edital_politica',
    nome: 'Edital ou Política',
    descricao: 'Escolha do instrumento: Lei Rouanet, PNAB, LPG, Emendas ou Edital Municipal',
    perguntaPadrao: 'Para qual edital ou política cultural você deseja preparar seu projeto (Lei Rouanet, PNAB, Lei Paulo Gustavo, emenda parlamentar ou edital municipal de Viamão)?',
    sugestoes: ['Lei Rouanet (Lei 8.313/1991 - IN MinC 29/2026)', 'PNAB Viamão (Lei 14.399/2022)', 'Lei Paulo Gustavo (LPG)', 'Emenda Parlamentar', 'Edital Municipal de Viamão'],
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

// Roteiro Específico da Lei Rouanet (Pronac / Salic - IN MinC nº 29/2026) - 12 etapas fundamentadas
export const ROTEIRO_ETAPAS_ROUANET: EtapaConfig[] = [
  {
    etapa: 1,
    chave: 'edital_politica',
    nome: 'Política e Salic',
    descricao: 'Lei Rouanet (Pronac / Mecenato - Lei 8.313/1991 e IN MinC 29/2026)',
    perguntaPadrao: 'Confirmamos a elaboração da sua proposta cultural para a Lei Rouanet (Pronac via Salic). Qual é a sua proposta?',
    sugestoes: ['Lei Rouanet - Mecenato Federal (Salic)', 'Projeto de Circulação Artística', 'Projeto de Festival de Música / Teatro', 'Projeto Editorial / Patrimônio'],
    fundamentacaoLegal: 'Arts. 1º, 4º e 5º da IN MinC nº 29/2026; Lei nº 8.313/1991',
  },
  {
    etapa: 2,
    chave: 'perfil_proponente',
    nome: 'Perfil do Proponente',
    descricao: 'Pessoa física (até 2 projetos / R$ 500 mil), MEI (até 4 / R$ 1,5 mi) ou PJ (até 10 / R$ 15 mi)',
    perguntaPadrao: 'Você vai apresentar a proposta no Salic como Pessoa Física, MEI ou Pessoa Jurídica, e qual é a sua área de atuação cultural comprovada?',
    sugestoes: ['Pessoa Física (limite R$ 500 mil)', 'MEI Cultural (limite R$ 1,5 milhão)', 'Pessoa Jurídica sem fins lucrativos (OSC)', 'Pessoa Jurídica LTDA'],
    fundamentacaoLegal: 'Art. 4º, §§ 1º a 5º, Art. 10, Art. 11 e Anexo II da IN MinC nº 29/2026',
  },
  {
    etapa: 3,
    chave: 'enquadramento_artigo',
    nome: 'Enquadramento Legal',
    descricao: 'Artigo 18 (100% de dedução fiscal do patrocinador) ou Artigo 26 da Lei 8.313/1991',
    perguntaPadrao: 'Em qual área ou segmento cultural sua ação se enquadra (ex: artes cênicas, música instrumental, patrimônio, artes visuais, livros) para definição do Artigo 18 ou 26?',
    sugestoes: ['Artigo 18 (Artes Cênicas / Teatro / Dança)', 'Artigo 18 (Música Erudita ou Instrumental)', 'Artigo 18 (Patrimônio Cultural e Museus)', 'Artigo 26 (Música Popular / Canto / Outros)'],
    fundamentacaoLegal: 'Arts. 18 e 26 da Lei nº 8.313/1991; Anexo IV da IN MinC nº 29/2026',
  },
  {
    etapa: 4,
    chave: 'sintese_produto',
    nome: 'Síntese e Produto Principal',
    descricao: 'Síntese da proposta cultural e produto cultural principal exigido no Salic',
    perguntaPadrao: 'Qual é a síntese da sua proposta cultural e qual será o produto cultural principal gerado (ex: espetáculo, festival, livro, exposição)?',
    sugestoes: ['Temporada de Espetáculo Teatral', 'Festival Musical Aberto ao Público', 'Livro de Memória e História Cultural', 'Oficinas e Mostra de Artes Visuais'],
    fundamentacaoLegal: 'Art. 4º, § 1º e Anexo I (itens LXX e LXXVIII) da IN MinC nº 29/2026',
  },
  {
    etapa: 5,
    chave: 'objetivos_justificativa',
    nome: 'Objetivos e Justificativa',
    descricao: 'Objetivos gerais e específicos e justificativa de interesse público e impacto',
    perguntaPadrao: 'Quais são os objetivos do projeto e qual a justificativa de interesse público para a sua realização?',
    sugestoes: ['Promover difusão artística gratuita', 'Descentralizar a cultura para bairros periféricos', 'Valorizar a memória e identidade comunitária'],
    fundamentacaoLegal: 'Art. 1º da Lei nº 8.313/1991; Art. 4º da IN MinC nº 29/2026',
  },
  {
    etapa: 6,
    chave: 'local_cronograma',
    nome: 'Local e Cronograma',
    descricao: 'Localidades de execução e cronograma detalhado por fases em até 36 meses',
    perguntaPadrao: 'Onde o projeto será realizado e qual é o cronograma previsto para as fases de pré-produção, produção e pós-produção (até 36 meses)?',
    sugestoes: ['Execução em 12 meses (Viamão e Região)', 'Execução em 6 meses (Centros Culturais e Escolas)', 'Pré-produção (Mês 1-3) • Produção (Mês 4-8) • Pós (Mês 9-12)'],
    fundamentacaoLegal: 'Art. 4º, § 2º e Art. 17 da IN MinC nº 29/2026',
  },
  {
    etapa: 7,
    chave: 'plano_distribuicao_democratizacao',
    nome: 'Distribuição e Democratização',
    descricao: 'Cotas: mín. 10% gratuidade social, máx. 10% patrocinador, mín. 20% ingressos populares até R$ 50',
    perguntaPadrao: 'Como será o plano de distribuição de ingressos ou produtos culturais (considerando a cota mínima de 10% gratuita para fins sociais e 20% populares de até R$ 50,00)?',
    sugestoes: ['100% de acesso gratuito à comunidade', '10% gratuito social + 20% popular até R$ 50 + restante até R$ 250', 'Distribuição gratuita integral em escolas e praças'],
    fundamentacaoLegal: 'Art. 41 da IN MinC nº 29/2026',
  },
  {
    etapa: 8,
    chave: 'medidas_acessibilidade',
    nome: 'Acessibilidade (IN 29/2026)',
    descricao: 'Acessibilidade física, comunicacional (Libras, audiodescrição) e atitudinal (limite orçamentário 20%)',
    perguntaPadrao: 'Quais medidas de acessibilidade arquitetônica e comunicacional (como Libras e audiodescrição) serão adotadas para garantir o acesso de pessoas com deficiência ou mobilidade reduzida?',
    sugestoes: ['Intérprete de Libras em todas as apresentações', 'Audiodescrição ao vivo e visitas guiadas táteis', 'Espaço térreo com rampas, sanitários adaptados e gratuidade para acompanhante de PcD'],
    fundamentacaoLegal: 'Arts. 20, 38 a 40 e Anexo III da IN MinC nº 29/2026',
  },
  {
    etapa: 9,
    chave: 'divulgacao_marcas',
    nome: 'Divulgação e Marcas Pronac',
    descricao: 'Marcas obrigatórias Pronac/MinC/Governo Federal e submissão prévia em 5 dias úteis',
    perguntaPadrao: 'Como será feita a divulgação do projeto e a inserção das marcas oficiais obrigatórias do Pronac, Lei Rouanet, Ministério da Cultura e Governo Federal?',
    sugestoes: ['Redes sociais, cartazes impressos e spots de rádio', 'Aplicação das marcas conforme Manual do Pronac com envio prévio de 5 dias úteis ao MinC', 'Assessoria de imprensa e divulgação acessível'],
    fundamentacaoLegal: 'Art. 21 da IN MinC nº 29/2026 e Manual do Uso das Marcas do Pronac',
  },
  {
    etapa: 10,
    chave: 'ficha_tecnica',
    nome: 'Ficha Técnica e Direitos',
    descricao: 'Composição da equipe artística e técnica, currículos/portfólios e direitos autorais (limite 10%)',
    perguntaPadrao: 'Quem são os principais profissionais da ficha técnica (artistas e produtores) e qual a qualificação ou histórico de atuação de cada um?',
    sugestoes: ['Diretor Artístico, Produtor Executivo e Artistas Locais', 'Equipe técnica de som, luz, acessibilidade e comunicação', 'Profissionais com portfólio comprovado e termo de anuência'],
    fundamentacaoLegal: 'Art. 27 e Anexo II da IN MinC nº 29/2026',
  },
  {
    etapa: 11,
    chave: 'planilha_orcamentaria',
    nome: 'Planilha Orçamentária e Limites',
    descricao: 'Orçamento analítico: admin máx. 15%, captação máx. 10%/R$ 150 mil, cachê máx. R$ 25 mil/R$ 50 mil',
    perguntaPadrao: 'Quais são os itens e valores estimados do seu orçamento analítico (incluindo custos de produção, custos administrativos e remunerações)?',
    sugestoes: ['Custos de produção e apresentações', 'Custos administrativos (respeitando o teto de 15%)', 'Remuneração para captação de recursos (respeitando 10% / teto R$ 150 mil)'],
    fundamentacaoLegal: 'Arts. 11, 16, 19, 20, 22, 23, 24, 26 e 27 da IN MinC nº 29/2026',
  },
  {
    etapa: 12,
    chave: 'conferencia_regras_revisao',
    nome: 'Conferência e Salic',
    descricao: 'Conferência de regras por código e orientações para cadastramento da proposta no Salic',
    perguntaPadrao: 'Deseja revisar algum ponto da sua proposta antes de gerar o documento consolidado com o relatório de conferência das regras da Lei Rouanet?',
    sugestoes: ['Tudo conferido, quero baixar o documento .docx da Lei Rouanet', 'Quero revisar as cotas de democratização e gratuidade', 'Quero revisar os itens da planilha orçamentária'],
    fundamentacaoLegal: 'Arts. 4º, 5º, 45, 47, 48 e 69 da IN MinC nº 29/2026',
  },
];

export interface ExemploTema {
  titulo: string;
  editalSugerido: string;
  segmento: string;
  ideiaInicial: string;
}

export const PROJETOS_EXEMPLO: ExemploTema[] = [
  {
    titulo: 'Circulação Musical pela Lei Rouanet (Pronac)',
    editalSugerido: 'Lei Rouanet (IN MinC nº 29/2026)',
    segmento: 'Música Instrumental / Circulação',
    ideiaInicial: 'Projeto de circulação de concerto de música instrumental brasileira com entrada gratuita, acessibilidade completa em Libras e audiodescrição, e oficinas pedagógicas em escolas públicas.',
  },
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
  conferenciaRegras?: any;
  politica?: string;
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
          conferenciaRegras: d.conferencia_regras,
          politica: d.politica,
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
