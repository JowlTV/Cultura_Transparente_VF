/**
 * =============================================================================
 * CULTURA TRANSPARENTE - CLIENTE DE INTEGRAÇÃO COM SERVERLESS APIS & CACHE
 * Módulo: src/services/apiClient.ts
 * =============================================================================
 * Fornece consumo resiliente dos endpoints Python em /api (Vercel Serverless)
 * e métricas de latência. Para emendas e notícias NÃO existe dado substituto: se a fonte
 * falhar, retorna lista vazia com isFallback=true para a interface sinalizar a indisponibilidade.
 * Apenas a LPG tem snapshot estático verificado (INITIAL_LPG_DATA), sinalizado como 'fallback_estatico'.
 */

import { NewsItem, LpgPlanoAcao, Emenda } from '../types/culture';
import { INITIAL_LPG_DATA } from '../data/initialData';
import { sanitizeUrl, sanitizeInputText } from '../utils/security';

export interface ApiStatusReport {
  endpoint: string;
  status: 'online' | 'degraded' | 'cached';
  latencyMs: number;
  lastChecked: string;
  rateLimitInfo: string;
  totalRecords: number;
}

interface ClientCacheEntry<T> {
  data: T;
  timestamp: number;
}

const NAO_INFORMADO = 'Não informado pela fonte';
// Categorias que a API realmente produz; outras ('todos', 'eventos'...) são filtradas só na interface
const FILTROS_CATEGORIA_API = new Set(['editais', 'viamao']);

class CulturalApiClient {
  private static instance: CulturalApiClient;
  private cache = new Map<string, ClientCacheEntry<any>>();
  private inFlightRequests = new Map<string, Promise<any>>();
  private readonly CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes client cache

  private constructor() {}

  public static getInstance(): CulturalApiClient {
    if (!CulturalApiClient.instance) {
      CulturalApiClient.instance = new CulturalApiClient();
    }
    return CulturalApiClient.instance;
  }

  private getCached<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.CACHE_TTL_MS) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  private setCached<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /** Limpa o cache do navegador para forçar nova consulta (botão "Atualizar"). */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Consulta auditoria da Lei Paulo Gustavo em /api/lpg via Transferegov Fundo a Fundo
   */
  public async fetchLpg(): Promise<{ data: LpgPlanoAcao; report: ApiStatusReport }> {
    const cacheKey = 'lpg_viamao';
    const cached = this.getCached<{ data: LpgPlanoAcao; report: ApiStatusReport }>(cacheKey);
    if (cached) {
      return {
        ...cached,
        report: { ...cached.report, status: 'cached', latencyMs: 1 }
      };
    }

    if (this.inFlightRequests.has(cacheKey)) {
      return this.inFlightRequests.get(cacheKey);
    }

    const promise = (async () => {
      const startTime = performance.now();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const response = await fetch('/api/lpg', {
          headers: { Accept: 'application/json' },
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        const latencyMs = Math.round(performance.now() - startTime);

        if (response.ok) {
          const json = await response.json();
          if (json.success && json.plano_acao) {
            const p = json.plano_acao;
            const lpgData: LpgPlanoAcao = {
              id_plano_acao: p.id_plano_acao,
              codigo_plano_acao: sanitizeInputText(p.codigo_plano_acao || 'Não informado pela fonte', 50),
              situacao: sanitizeInputText(p.situacao || 'Não informado pela fonte', 40),
              valor_total_repasse: typeof p.valor_total_repasse === 'number' ? p.valor_total_repasse : 0,
              data_inicio_vigencia: sanitizeInputText(p.data_inicio_vigencia || 'Não informada', 30),
              data_fim_vigencia: sanitizeInputText(p.data_fim_vigencia || 'Não informada', 30),
              diagnostico: sanitizeInputText(p.diagnostico || '', 500),
              objetivos: sanitizeInputText(p.objetivos || '', 500),
              ente_recebedor: {
                cnpj: sanitizeInputText(p.ente_recebedor?.cnpj || '88.000.914/0001-01', 30),
                nome: sanitizeInputText(p.ente_recebedor?.nome || 'Não informado pela fonte', 100),
                uf: sanitizeInputText(p.ente_recebedor?.uf || 'RS', 10),
                municipio: sanitizeInputText(p.ente_recebedor?.municipio || 'Não informado pela fonte', 50),
                fundo_orgao: sanitizeInputText(p.ente_recebedor?.fundo_orgao || 'Não informado pela fonte', 100),
              },
              orgao_repassador: {
                sigla: sanitizeInputText(p.orgao_repassador?.sigla || 'MinC', 20),
                nome: sanitizeInputText(p.orgao_repassador?.nome || 'Não informado pela fonte', 100),
                fundo: sanitizeInputText(p.orgao_repassador?.fundo || 'Não informado pela fonte', 100),
              },
              // Resposta bem-sucedida com lista vazia propaga [] legitimamente
              metas: Array.isArray(p.metas) ? p.metas : [],
              dados_bancarios: Array.isArray(p.dados_bancarios) ? p.dados_bancarios : [],
              base_legal: sanitizeInputText(p.base_legal || 'Lei Complementar nº 195/2022', 100),
              fonte_oficial: sanitizeInputText(p.fonte_oficial || 'Plataforma Transferegov.br / Fundo a Fundo / MinC', 150),
              fonte_dado: 'api_real',
            };

            const result = {
              data: lpgData,
              report: {
                endpoint: '/api/lpg',
                status: 'online' as const,
                latencyMs,
                lastChecked: new Date().toLocaleTimeString('pt-BR'),
                rateLimitInfo: 'Transferegov Fundo a Fundo (60 req/min)',
                totalRecords: lpgData.metas.length,
              },
            };
            this.setCached(cacheKey, result);
            return result;
          }
        }
      } catch (_) {
        // Fallback apenas em caso de falha real de rede ou HTTP não-200
      }

      const latencyMs = Math.round(performance.now() - startTime);
      const fallbackData: LpgPlanoAcao = {
        ...INITIAL_LPG_DATA,
        fonte_dado: 'fallback_estatico'
      };
      const result = {
        data: fallbackData,
        report: {
          endpoint: '/api/lpg',
          status: 'cached' as const,
          latencyMs: Math.max(latencyMs, 5),
          lastChecked: new Date().toLocaleTimeString('pt-BR'),
          rateLimitInfo: 'Buffer Oficial Transferegov Fundo a Fundo',
          totalRecords: fallbackData.metas.length,
        },
      };
      this.setCached(cacheKey, result);
      return result;
    })();

    this.inFlightRequests.set(cacheKey, promise);
    try {
      return await promise;
    } finally {
      this.inFlightRequests.delete(cacheKey);
    }
  }

  /**
   * Consulta notícias e editais em tempo real com single-flight e cache em memória
   */
  public async fetchNews(query: string = 'cultura', filtro?: string): Promise<{
    data: NewsItem[];
    report: ApiStatusReport;
    total: number;
    queryUsed: string;
    statusFontes?: Record<string, any>;
    isFallback?: boolean;
  }> {
    const rawQuery = (query || 'cultura').trim().toLowerCase();
    const cacheKey = `news_${rawQuery}_${filtro || 'all'}`;

    const cached = this.getCached<any>(cacheKey);
    if (cached) {
      return {
        ...cached,
        report: { ...cached.report, status: 'cached', latencyMs: 1 }
      };
    }

    if (this.inFlightRequests.has(cacheKey)) {
      return this.inFlightRequests.get(cacheKey);
    }

    const promise = (async () => {
      const startTime = performance.now();
      try {
        const termoParam = encodeURIComponent(rawQuery);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const response = await fetch(`/api/news?q=${termoParam}`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        const latencyMs = Math.round(performance.now() - startTime);

        if (response.ok) {
          const payload = await response.json();
          if (payload.success && Array.isArray(payload.noticias)) {
            const sanitizedNoticias: NewsItem[] = payload.noticias.map((n: any) => ({
              id: sanitizeInputText(n.id || `news-${Date.now()}`, 60),
              titulo: sanitizeInputText(n.titulo || '', 200),
              resumo: sanitizeInputText(n.resumo || '', 600),
              data: sanitizeInputText(n.data || '', 40),
              fonte: sanitizeInputText(n.fonte || n.orgao || n.veiculo_imprensa || '', 100),
              categoria_filtro: n.categoria_filtro === 'viamao' || n.categoria_filtro === 'pnab' || n.categoria_filtro === 'sedac-rs' || n.categoria_filtro === 'editais' || n.categoria_filtro === 'ministerio-publico' || n.categoria_filtro === 'governo-federal' ? n.categoria_filtro : 'viamao',
              origem: sanitizeInputText(n.origem || 'Municipal (Viamão)', 60),
              etiqueta: sanitizeInputText(n.etiqueta || '', 60),
              link: sanitizeUrl(n.link),
              imagem: n.imagem ? sanitizeUrl(n.imagem) : undefined,
              veiculo_imprensa: n.veiculo_imprensa ? sanitizeInputText(n.veiculo_imprensa, 80) : undefined,
              fonte_confiavel: Boolean(n.fonte_confiavel ?? true),
              jurisdicao: n.jurisdicao ? sanitizeInputText(n.jurisdicao, 60) : undefined,
              url_pesquisa_google: n.url_pesquisa_google ? sanitizeUrl(n.url_pesquisa_google) : undefined,
            }));
            let filtradas = sanitizedNoticias;
            if (filtro && FILTROS_CATEGORIA_API.has(filtro)) {
              filtradas = filtradas.filter(n => n.categoria_filtro === filtro);
            }
            const result = {
              data: filtradas,
              report: {
                endpoint: `/api/news?q=${query}`,
                status: 'online' as const,
                latencyMs,
                lastChecked: new Date().toLocaleTimeString('pt-BR'),
                rateLimitInfo: 'Alta Concorrência com Single-Flight',
                totalRecords: filtradas.length,
              },
              total: filtradas.length,
              queryUsed: query,
              statusFontes: payload.status_fontes,
              // A API respondeu, mas a fonte oficial pode ter falhado: sinaliza para a interface
              isFallback: Object.values(payload.status_fontes || {}).some((f: any) => f && f.sucesso === false)
            };
            this.setCached(cacheKey, result);
            return result;
          }
        }
      } catch {
        // Falha de rede ou timeout; ativa acervo auditado
      }

      const latencyMs = Math.round(performance.now() - startTime);
      const result = {
        data: [] as NewsItem[],
        report: {
          endpoint: '/api/news',
          status: 'degraded' as const,
          latencyMs: Math.max(latencyMs, 5),
          lastChecked: new Date().toLocaleTimeString('pt-BR'),
          rateLimitInfo: 'Fonte indisponível',
          totalRecords: 0,
        },
        total: 0,
        queryUsed: query,
        statusFontes: {
          prefeitura_viamao: {
            fonte: 'Prefeitura Municipal de Viamão',
            consultada: true,
            sucesso: false,
            mensagem: 'Não foi possível consultar a fonte agora'
          }
        },
        isFallback: true
      };
      return result;
    })();

    this.inFlightRequests.set(cacheKey, promise);
    try {
      return await promise;
    } finally {
      this.inFlightRequests.delete(cacheKey);
    }
  }

  /**
   * Consulta emendas parlamentares em /api/emendas via CGU e Portal RS (CAGE)
   */
  public async fetchEmendas(options?: {
    esfera?: 'all' | 'federal' | 'estadual';
    anos?: string;
    apenasCultura?: boolean;
  }): Promise<{
    data: Emenda[];
    report: ApiStatusReport;
    statusFontes?: Record<string, any>;
    isFallback: boolean;
  }> {
    const esfera = options?.esfera || 'all';
    const anos = options?.anos || '2024,2025,2026';
    const apenasCultura = options?.apenasCultura ?? false;
    const cacheKey = `emendas_${esfera}_${anos}_${apenasCultura}`;

    const cached = this.getCached<any>(cacheKey);
    if (cached) {
      return {
        ...cached,
        report: { ...cached.report, status: 'cached', latencyMs: 1 }
      };
    }

    if (this.inFlightRequests.has(cacheKey)) {
      return this.inFlightRequests.get(cacheKey);
    }

    const promise = (async () => {
      const startTime = performance.now();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const url = `/api/emendas?esfera=${esfera}&anos=${encodeURIComponent(anos)}&apenas_cultura=${apenasCultura ? 'true' : 'false'}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        const latencyMs = Math.round(performance.now() - startTime);

        if (response.ok) {
          const payload = await response.json();
          if (payload.success && Array.isArray(payload.emendas)) {
            const sanitizedEmendas: Emenda[] = payload.emendas.map((e: any, idx: number) => {
              const valorAlocado = typeof e.valor === 'number' ? e.valor : parseFloat(e.valor || 0);
              const valorPago = typeof e.pago === 'number' ? e.pago : (typeof e.valor_gasto === 'number' ? e.valor_gasto : parseFloat(e.pago || 0));
              const esferaNormalizada = (e.esfera && e.esfera.includes('Federal')) ? 'Federal (API CGU)' : 'Estadual (ALRS)';
              
              return {
                id: sanitizeInputText(e.id || `emenda-${idx + 1}`, 60),
                ano: typeof e.ano === 'number' ? e.ano : Number(e.ano) || 0,
                parlamentar: sanitizeInputText(e.autor || e.parlamentar || NAO_INFORMADO, 100),
                partido: sanitizeInputText(e.partido || NAO_INFORMADO, 40),
                partido_sigla: sanitizeInputText(e.partido || e.partido_sigla || NAO_INFORMADO, 40),
                esfera: esferaNormalizada,
                orgao: sanitizeInputText(e.orgao || NAO_INFORMADO, 120),
                secretaria: sanitizeInputText(e.orgao || e.secretaria || NAO_INFORMADO, 120),
                projeto: sanitizeInputText(e.objeto || e.subprojeto || NAO_INFORMADO, 200),
                subprojeto: sanitizeInputText(e.subprojeto || e.objeto || NAO_INFORMADO, 200),
                valor: valorAlocado,
                valor_gasto: valorPago,
                status: sanitizeInputText(e.status || NAO_INFORMADO, 40) as Emenda['status'],
                is_cultura: Boolean(e.is_cultura),
                area_atuacao: sanitizeInputText(e.area_atuacao || (e.is_cultura ? 'Cultura & Turismo' : 'Demais Áreas'), 60),
                tipo_projeto_cultural: e.tipo_projeto_cultural || (e.is_cultura ? 'Outras Áreas' : undefined),
                justificativa: sanitizeInputText(e.justificativa || `Emenda parlamentar registrada no ${e.fonte || 'Portal da Transparência'}.`, 300),
                fonte: sanitizeInputText(e.fonte || 'Portal da Transparência', 100),
                fontes_cruzadas: Array.isArray(e.fontes_cruzadas) ? e.fontes_cruzadas : [e.fonte || 'Portal da Transparência'],
                numeroEmenda: sanitizeInputText(e.numero_emenda || e.numeroEmenda || '', 40),
                beneficiario: sanitizeInputText(e.beneficiario || NAO_INFORMADO, 160),
              };
            });

            const emendasFinais = sanitizedEmendas;
            // Lista vazia de uma API que respondeu é um resultado legítimo; só é "falha" se alguma fonte reportou erro
            const isFallbackResult = Object.values(payload.status_fontes || {}).some(
              (f: any) => f && (f.status === 'error' || f.status === 'missing_api_key')
            );

            const result = {
              data: emendasFinais,
              report: {
                endpoint: '/api/emendas',
                status: 'online' as const,
                latencyMs,
                lastChecked: new Date().toLocaleTimeString('pt-BR'),
                rateLimitInfo: 'CGU API & Transparência RS',
                totalRecords: emendasFinais.length,
              },
              statusFontes: payload.status_fontes,
              isFallback: isFallbackResult
            };
            this.setCached(cacheKey, result);
            return result;
          }
        }
      } catch {
        // Falha de rede; ativa base auditada consolidada como fallback explícito
      }

      const latencyMs = Math.round(performance.now() - startTime);
      return {
        data: [] as Emenda[],
        report: {
          endpoint: '/api/emendas',
          status: 'degraded' as const,
          latencyMs: Math.max(latencyMs, 6),
          lastChecked: new Date().toLocaleTimeString('pt-BR'),
          rateLimitInfo: 'Fonte indisponível',
          totalRecords: 0,
        },
        statusFontes: {
          api: {
            status: 'error',
            mensagem: 'Não foi possível consultar /api/emendas agora. Nenhum dado substituto é exibido.'
          }
        },
        isFallback: true
      };
    })();

    this.inFlightRequests.set(cacheKey, promise);
    try {
      return await promise;
    } finally {
      this.inFlightRequests.delete(cacheKey);
    }
  }

}

export const apiClient = CulturalApiClient.getInstance();

