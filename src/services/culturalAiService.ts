/**
 * =============================================================================
 * CULTURA TRANSPARENTE - SERVIÇO DE IA PARA PROJETOS CULTURAIS
 * Módulo: src/services/culturalAiService.ts
 * =============================================================================
 * Comunica com o endpoint /api/chat que conduz o proponente com base
 * estritamente no estado dos campos definidos em src/config/roteiros.json.
 * A decisão de avanço é do código; a IA apenas formula perguntas e organiza respostas.
 */

import roteirosData from '../config/roteiros.json';

export type CampoStatus = 'vazio' | 'em andamento' | 'preenchido' | 'pendente';

export interface CampoDef {
  id: string;
  rotulo: string;
  pergunta_base: string;
  obrigatorio: boolean;
  tipo: 'texto' | 'escolha' | 'lista de itens' | 'tabela' | 'valor' | string;
  fonte?: string;
  por_produto: boolean;
}

export interface PoliticaDef {
  nome: string;
  descricao: string;
  campos: CampoDef[];
}

export interface CampoEstado {
  valor: string;
  status: CampoStatus;
  falta?: string;
  editadoManualmente?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  campo?: string;
  etapaAtual?: number;
  secoesAtualizadas?: Record<string, string>;
  fontesCitadas?: Array<{ documento: string; trecho: string }>;
  pendencias?: string[];
  conferenciaRegras?: any;
  politica?: string;
  isError?: boolean;
}

export const ROTEIROS_CONFIG: Record<string, PoliticaDef> = roteirosData as Record<string, PoliticaDef>;

export function getPoliticaConfig(politica: string): PoliticaDef | undefined {
  const pol = (politica || '').toUpperCase();
  return ROTEIROS_CONFIG[pol];
}

export function getCamposPolitica(politica: string): CampoDef[] {
  const cfg = getPoliticaConfig(politica);
  return cfg ? cfg.campos : [];
}

export function getCampoDef(politica: string, campoId: string): CampoDef | undefined {
  const campos = getCamposPolitica(politica);
  return campos.find(c => c.id === campoId);
}

export function getPrimeiroCampoObrigatorio(
  politica: string,
  camposEstado?: Record<string, CampoEstado>
): CampoDef | undefined {
  const campos = getCamposPolitica(politica);
  if (!campos || campos.length === 0) return undefined;

  for (const c of campos) {
    if (c.obrigatorio) {
      const estado = camposEstado ? camposEstado[c.id] : undefined;
      if (!estado || (estado.status !== 'preenchido' && estado.status !== 'pendente')) {
        return c;
      }
    }
  }

  // Se todos os obrigatórios estiverem preenchidos/pendentes, retorna o último (ex: revisão)
  return campos[campos.length - 1];
}

export interface AssistantRequestPayload {
  politica: string;
  campo_atual: string;
  campos: Record<string, CampoEstado>;
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
}

export interface AssistantTurnResult {
  text: string;
  campo?: string;
  conteudo?: string;
  completo?: boolean;
  falta?: string;
  proximo_campo?: string;
  status_campo?: CampoStatus;
  campos_atualizados?: Record<string, CampoEstado>;
  outros_campos?: Record<string, string>;
  etapaAtual?: number;
  secoesAtualizadas?: Record<string, string>;
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
  input: AssistantRequestPayload | Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
): Promise<AssistantTurnResult> {
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), 70000);

  const payload = Array.isArray(input) ? { messages: input } : input;

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: abortController.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        return {
          text: d.mensagem || json.text || '',
          campo: d.campo,
          conteudo: d.conteudo,
          completo: d.completo,
          falta: d.falta,
          proximo_campo: d.proximo_campo,
          status_campo: d.status_campo,
          campos_atualizados: d.campos_atualizados,
          outros_campos: d.outros_campos,
          etapaAtual: typeof d.etapa_atual === 'number' ? d.etapa_atual : 1,
          secoesAtualizadas: d.secoes_atualizadas || {},
          fontesCitadas: d.fontes_citadas || [],
          pendencias: d.pendencias || [],
          conferenciaRegras: d.conferencia_regras,
          politica: json.metadata?.politica || d.politica,
          isError: false,
        };
      }

      if (!json.success) {
        const friendlyMessage = translateAiFailure(json);
        return {
          text: `Não foi possível prosseguir neste momento porque ${friendlyMessage}. Por favor, tente novamente.`,
          fontesCitadas: [],
          pendencias: [],
          isError: true,
        };
      }
    }

    let errorData: any = {};
    try {
      errorData = await res.json();
    } catch {}

    const friendlyMessage = translateAiFailure(errorData);
    return {
      text: `Não foi possível prosseguir neste momento porque ${friendlyMessage}. Por favor, tente novamente em instantes.`,
      fontesCitadas: [],
      pendencias: [],
      isError: true,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err?.name === 'AbortError') {
      return {
        text: 'Não foi possível prosseguir neste momento porque a IA demorou demais para responder. Por favor, tente novamente em instantes.',
        fontesCitadas: [],
        pendencias: [],
        isError: true,
      };
    }
    return {
      text: 'Houve uma falha de conexão temporária ao contatar o assistente. Por favor, verifique sua conexão e tente novamente.',
      fontesCitadas: [],
      pendencias: [],
      isError: true,
    };
  }
}
