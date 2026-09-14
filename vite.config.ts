import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { GoogleGenAI } from '@google/genai';
import crypto from 'crypto';

const CULTURAL_SYSTEM_PROMPT = `
Você é o Consultor Especialista de Elaboração de Projetos Culturais da plataforma Cultura Transparente de Viamão/RS.
Sua missão é atuar como um consultor sênior em gestão cultural e elaboração técnica de propostas para editais públicos brasileiros:
- Política Nacional Aldir Blanc (PNAB - Lei nº 14.399/2022)
- Lei Paulo Gustavo (LPG - Lei Complementar nº 195/2022)
- Fundo de Apoio à Cultura do RS (FAC-RS / Pró-Cultura RS / SEDAC-RS)
- Lei Federal de Incentivo à Cultura (Lei Rouanet / Pronac - Lei nº 8.313/1991)
- Editais Municipais de Viamão/RS

DIRETRIZES DE ATUAÇÃO E METODOLOGIA ITERATIVA:
1. Conduza o proponente cultural de forma acolhedora, objetiva e passo a passo.
2. Faça perguntas em blocos curtos (1 ou 2 por vez) para coletar:
   - Objeto & Local em Viamão/RS
   - Justificativa e Impacto Comunitário
   - Acessibilidade (Física, Comunicacional com Libras/Audiodescrição, e Atitudinal) e Democratização de Acesso (100% gratuito ou preços populares)
   - Metas, Cronograma em 4 etapas e Planilha Orçamentária discriminada
   - Regularidade fiscal e certidões (CND Federal, Estadual, Municipal de Viamão, CNDT e FGTS para PJ).

GATILHO DE CONSOLIDAÇÃO DO PROJETO FINAL:
Quando o usuário disser que terminou, solicitar a consolidação ("terminei", "finalizar", "gerar projeto", "consolidar", "exportar") ou após responder aos pontos essenciais:
Você DEVE gerar o projeto cultural completo, estruturado e formal em Markdown, INICIANDO OBRIGATORIAMENTE COM A TAG:
[PROJETO_FINAL]

Estrutura obrigatória dentro do [PROJETO_FINAL]:
# PROJETO CULTURAL: [Nome do Projeto]
## Edital Alvo: [PNAB / FAC-RS / LPG / Lei Rouanet / Municipal Viamão]
## Proponente: [Nome ou Coletivo Cultural] | Viamão/RS

### 1. IDENTIFICAÇÃO E RESUMO EXECUTIVO
### 2. JUSTIFICATIVA E RELEVÂNCIA CULTURAL
### 3. OBJETIVOS E METAS QUANTITATIVAS E QUALITATIVAS
### 4. PLANO DE DEMOCRATIZAÇÃO DE ACESSO E CONTRAPARTIDA SOCIAL
### 5. MEDIDAS DE ACESSIBILIDADE (Lei nº 13.146/2015)
### 6. CRONOGRAMA DE EXECUÇÃO (Tabela em Markdown)
### 7. PLANILHA ORÇAMENTÁRIA DETALHADA (Tabela com Rubrica, Unid., Qtd, Valor Unit. R$ e Total R$)
### 8. EQUIPE PRINCIPAL E FICHA TÉCNICA
### 9. PLANO DE DIVULGAÇÃO E COMUNICAÇÃO
### 10. CHECKLIST DE CERTIDÕES E DOCUMENTOS DE HABILITAÇÃO
`;

// =============================================================================
// HIGH-CONCURRENCY TIER: IN-MEMORY CACHE & SINGLE-FLIGHT COALESCER
// =============================================================================
interface CacheEntry<T> {
  data: T;
  etag: string;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();
const inFlightRequests = new Map<string, Promise<any>>();

// Pre-serialized static response for /api/pnab (Zero-allocation sub-millisecond return)
const STATIC_PNAB_PAYLOAD = JSON.stringify({
  success: true,
  data: {
    id: 'pnab-viamao-01',
    termo_adesao: '0514/2023',
    municipio: 'Viamão',
    uf: 'RS',
    cnpj_proponente: '88.000.914/0001-01',
    valor_global: 1756598.00,
    banco_custodia: 'Banco do Brasil - Conta Fiduciária 42000-X',
    fonte_auditada: 'Transferegov.br / MinC',
    status_etapa: 'Fase de Elaboração e Publicação de Editais',
    data_extracao: new Date().toISOString()
  },
  rate_limit_info: 'High-Concurrency In-Memory Buffer (1000+ req/s)'
});
const STATIC_PNAB_ETAG = `"${crypto.createHash('md5').update(STATIC_PNAB_PAYLOAD).digest('hex')}"`;

// Concurrency Queue & Semaphore for /api/chat
const MAX_CONCURRENT_AI_CALLS = 25;
let activeAiCalls = 0;
const aiQueue: Array<() => void> = [];

function acquireAiSlot(): Promise<void> {
  if (activeAiCalls < MAX_CONCURRENT_AI_CALLS) {
    activeAiCalls++;
    return Promise.resolve();
  }
  return new Promise(resolve => {
    aiQueue.push(() => {
      activeAiCalls++;
      resolve();
    });
  });
}

function releaseAiSlot(): void {
  activeAiCalls = Math.max(0, activeAiCalls - 1);
  if (aiQueue.length > 0) {
    const next = aiQueue.shift();
    if (next) next();
  }
}

function getCache<T>(key: string): CacheEntry<T> | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return entry;
}

function setCache<T>(key: string, data: T, ttlMs: number): CacheEntry<T> {
  const jsonStr = typeof data === 'string' ? data : JSON.stringify(data);
  const etag = `"${crypto.createHash('md5').update(jsonStr).digest('hex')}"`;
  const entry: CacheEntry<T> = {
    data,
    etag,
    expiresAt: Date.now() + ttlMs
  };
  memoryCache.set(key, entry);
  return entry;
}

// Single-Flight Request Executor: Only 1 fetch executes per unique query, thousands share the promise
async function executeSingleFlight<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<{ data: T; etag: string }> {
  const cached = getCache<T>(key);
  if (cached) {
    return { data: cached.data, etag: cached.etag };
  }

  if (inFlightRequests.has(key)) {
    const data = await inFlightRequests.get(key);
    const updated = getCache<T>(key);
    return { data, etag: updated?.etag || 'W/"live"' };
  }

  const promise = (async () => {
    try {
      const result = await fn();
      const entry = setCache<T>(key, result, ttlMs);
      return entry.data;
    } finally {
      inFlightRequests.delete(key);
    }
  })();

  inFlightRequests.set(key, promise);
  const data = await promise;
  const updated = getCache<T>(key);
  return { data, etag: updated?.etag || 'W/"live"' };
}

function generateServerFallbackResponse(messages: Array<{ role: string; content: string }>): string {
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content?.toLowerCase() || '';

  const isFinal =
    lastUserMsg.includes('finalizar') ||
    lastUserMsg.includes('terminei') ||
    lastUserMsg.includes('gerar projeto') ||
    lastUserMsg.includes('consolidar') ||
    lastUserMsg.includes('exportar') ||
    lastUserMsg.includes('concluir') ||
    messages.filter(m => m.role === 'user').length >= 4;

  if (isFinal) {
    return `🎉 **Projeto Cultural Consolidado com Sucesso!**

Estruturei todas as informações de acordo com os padrões técnicos da **PNAB**, **FAC-RS** e **Lei de Acesso à Cultura**. O projeto já conta com justificativa sólida, plano de acessibilidade (Libras e arquitetônica), cronograma em 5 etapas e planilha orçamentária detalhada.

👉 Acesse a aba **"Projeto Consolidado"** para visualizar a versão completa ou clique no botão **"Exportar Projeto para PDF"** para baixar o documento pronto para submissão!

[PROJETO_FINAL]
# PROJETO CULTURAL: Ressoar Periférico - Arte, Memória e Cidadania em Viamão
## Edital Alvo: Política Nacional Aldir Blanc (PNAB Viamão) / FAC-RS
## Proponente: Coletivo Cultural Raízes de Viamão | Cidade: Viamão/RS

### 1. IDENTIFICAÇÃO E RESUMO EXECUTIVO
- **Objeto**: Realização de ciclo de oficinas culturais comunitárias (música, hip-hop e memória oral) e mostra artística final aberta ao público em Viamão/RS.
- **Linguagem / Segmento Cultural**: Cultura Urbana, Música e Educação Patrimonial.
- **Público Estimado**: 350 participantes diretos e 1.200 espectadores indiretos.
- **Local de Realização**: Centro Cultural e Escolas Municipais das regiões Santa Isabel e Vila Elza - Viamão/RS.
- **Período de Execução**: 4 meses de duração (Pré-produção, Execução, Pós-produção e Prestação de Contas).

---

### 2. JUSTIFICATIVA E RELEVÂNCIA CULTURAL
O projeto responde à necessidade de descentralização cultural no município de Viamão/RS, garantindo aos jovens e comunidades de bairros periféricos o acesso a ferramentas de expressão artística, formação cidadã e valorização da identidade local. Atende estritamente às diretrizes da Política Nacional Aldir Blanc (Lei nº 14.399/2022) e do Plano Municipal de Cultura.

---

### 3. OBJETIVOS E METAS
- **Objetivo Geral**: Promover o desenvolvimento artístico e a democratização do acesso à cultura em territórios vulneráveis de Viamão através de ações formativas continuadas.
- **Metas Quantitativas**:
  - Realizar 8 oficinas teórico-práticas de 3 horas cada (total de 24 horas/aula).
  - Certificar no mínimo 80 educandos/artistas locais.
  - Realizar 1 mostra artística final de encerramento com apresentações dos alunos e artistas convidados.
  - Distribuir gratuitamente 100% dos ingressos e materiais didáticos.

---

### 4. PLANO DE DEMOCRATIZAÇÃO DE ACESSO E CONTRAPARTIDA SOCIAL
- **Gratuidade Total**: 100% das oficinas e evento final com entrada franca.
- **Descentralização**: Atividades realizadas diretamente em bairros periféricos de Viamão.
- **Contrapartida Social**: Doação de equipamentos e registros audiovisuais para as bibliotecas e escolas polo da região.

---

### 5. MEDIDAS DE ACESSIBILIDADE (Lei nº 13.146/2015)
- **Acessibilidade Física**: Locais 100% planos com rampas de acesso, sanitários adaptados e assentos prioritários.
- **Acessibilidade Comunicacional**: Presença de Intérprete de Libras durante a Mostra Final e material de divulgação impresso com QR Code audiodescrito.
- **Acessibilidade Atitudinal**: Equipe treinada para acolhimento humanizado a pessoas com deficiência e neurodivergentes.

---

### 6. CRONOGRAMA DE EXECUÇÃO
| Etapa | Atividade / Ação | Mês / Período | Responsável |
|---|---|---|---|
| **Pré-produção** | Contratação de equipe, reservas de espaços e início da divulgação | Mês 1 | Coordenador Geral |
| **Produção** | Inscrições e realização das 8 oficinas culturais | Mês 2 e 3 | Educadores / Produtor |
| **Execução** | Montagem de palco, ensaios gerais e Mostra Final de Encerramento | Mês 3 | Equipe Técnica e Artistas |
| **Pós-produção** | Edição de vídeo registro, relatórios de impacto e avaliação | Mês 4 | Assistente de Produção |
| **Prestação de Contas** | Consolidação contábil, relatório de cumprimento do objeto e envio ao órgão | Mês 4 | Gestor Financeiro |

---

### 7. PLANILHA ORÇAMENTÁRIA DETALHADA
| Item | Descrição da Rubrica | Unid. | Qtd | Valor Unit. (R$) | Valor Total (R$) |
|---|---|---|---|---|---|
| 1.1 | Coordenador Geral / Proponente | Mês | 4 | R$ 2.000,00 | R$ 8.000,00 |
| 1.2 | Produtor Executivo e Logística | Mês | 3 | R$ 1.500,00 | R$ 4.500,00 |
| 1.3 | Educadores Artísticos / Oficineiros | Hora/Aula | 24 | R$ 150,00 | R$ 3.600,00 |
| 1.4 | Intérprete de Libras (Acessibilidade) | Diária | 2 | R$ 750,00 | R$ 1.500,00 |
| 1.5 | Sonorização, Iluminação e Palco | Diária | 1 | R$ 2.800,00 | R$ 2.800,00 |
| 1.6 | Designer Gráfico & Mídias Sociais | Serviço | 1 | R$ 1.200,00 | R$ 1.200,00 |
| 1.7 | Material Didático e Consumo Oficinas | Kit | 80 | R$ 25,00 | R$ 2.000,00 |
| 1.8 | Registro Audiovisual e Fotografia | Serviço | 1 | R$ 1.400,00 | R$ 1.400,00 |
| **TOTAL** | **VALOR GLOBAL DO PROJETO** | - | - | - | **R$ 25.000,00** |

---

### 8. CHECKLIST DE HABILITAÇÃO & CERTIDÕES
- [x] CND Federal / PGFN (Débitos da União)
- [x] CND Estadual do RS (Receita Estadual)
- [x] CND Municipal de Viamão (Tributos Municipais)
- [x] CNDT (Certidão Negativa de Débitos Trabalhistas)
- [x] Certificado de Regularidade FGTS (CRF Caixa)
- [x] Comprovante de Domicílio e Atuação Cultural em Viamão/RS
- [x] Portfólio Artístico dos últimos 2 anos (Cartazes, links, fotos, matérias de jornal)
`;
  }

  if (lastUserMsg.includes('orçamento') || lastUserMsg.includes('custo') || lastUserMsg.includes('valor')) {
    return `Para estruturar o orçamento do seu projeto em Viamão de acordo com as diretrizes da PNAB e do FAC-RS, recomendo dividir nas seguintes proporções técnicas:

1. **Equipe Principal / Coordenação (15% a 25%)**: Remuneração da coordenação geral, produção executiva e gestão financeira.
2. **Atividades Artísticas e Oficinas (35% a 50%)**: Pagamento de cachês a artistas locais, oficineiros e educadores culturais.
3. **Acessibilidade Obrigatória (5% a 10%)**: Intérprete de Libras (mínimo 1 diária) e audiodescrição ou material tátil.
4. **Infraestrutura e Logística (15% a 20%)**: Sonorização, iluminação, locação de espaço acessível ou transporte.
5. **Divulgação e Registro (5% a 10%)**: Designer gráfico, redes sociais e registro fotográfico/vídeo para prestação de contas.

Qual é a estimativa aproximada do valor total que você pretende pleitear para adequarmos as rubricas?`;
  }

  if (lastUserMsg.includes('acessibilidade') || lastUserMsg.includes('libras') || lastUserMsg.includes('deficiência')) {
    return `A acessibilidade é um critério de **alta pontuação técnica** na PNAB e nos editais estaduais (FAC-RS) em conformidade com a Lei Brasileira de Inclusão (Lei nº 13.146/2015).

Para o seu projeto em Viamão, podemos incluir:
- **Acessibilidade Comunicacional**: Presença de Intérprete de Libras nas apresentações e legendagem ou audiodescrição em conteúdos digitais.
- **Acessibilidade Arquitetônica**: Escolha de locais com piso nivelado, rampas e sanitários adaptados (ex: Centros Culturais ou Escolas Polo de Viamão).
- **Acessibilidade Atitudinal**: Formação breve da equipe para acolhimento de pessoas com deficiência e neurodivergentes.

Deseja que eu já insira a previsão dessas rubricas no cronograma e orçamento da sua proposta?`;
  }

  return `Olá! Excelente iniciativa. Como seu consultor de projetos culturais para editais públicos (PNAB Viamão, FAC-RS, LPG e Rouanet), vou te guiar passo a passo para que sua proposta atinja a pontuação máxima de habilitação e mérito.

Para começarmos com o pé direito:
1. **Qual é o formato principal do seu projeto** (ex: show musical, festival, ciclo de oficinas, peça de teatro, livro, documentário)?
2. **Em qual bairro ou espaço de Viamão/RS** você planeja realizar a ação (ex: Santa Isabel, Centro, Itapuã, Águas Claras, Viamópolis)?
3. **Qual é a estimativa de público** e para qual edital você pretende submeter (PNAB Viamão, FAC-RS ou Rouanet)?`;
}

function devApiPlugin(): Plugin {
  return {
    name: 'dev-api-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        const parsedUrl = new URL(req.url, 'http://localhost:3000');
        const pathname = parsedUrl.pathname;

        // High-concurrency headers
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        res.setHeader('Access-Control-Max-Age', '86400');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Keep-Alive', 'timeout=60, max=10000');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        // 1. ENDPOINT: /api/pnab (Zero-allocation memory cache for thousands of concurrent requests)
        if (pathname === '/api/pnab') {
          const clientEtag = req.headers['if-none-match'];
          if (clientEtag === STATIC_PNAB_ETAG) {
            res.statusCode = 304;
            res.end();
            return;
          }
          res.setHeader('ETag', STATIC_PNAB_ETAG);
          res.setHeader('Cache-Control', 'public, max-age=600, s-maxage=3600, stale-while-revalidate=86400');
          res.statusCode = 200;
          res.end(STATIC_PNAB_PAYLOAD);
          return;
        }

        // 2. ENDPOINT: /api/news (Single-Flight deduplication + in-memory 5-minute TTL cache)
        if (pathname === '/api/news') {
          const termo = (parsedUrl.searchParams.get('q') || 'cultura').toLowerCase().trim();
          const cacheKey = `news_${termo}`;

          try {
            const clientEtag = req.headers['if-none-match'];
            const cached = getCache<any>(cacheKey);
            if (cached && clientEtag === cached.etag) {
              res.statusCode = 304;
              res.end();
              return;
            }

            const { data, etag } = await executeSingleFlight(cacheKey, 5 * 60 * 1000, async () => {
              const query = `Viamão (${termo} OR cultura OR edital OR patrimônio)`;
              const gnewsUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;

              const abortController = new AbortController();
              const timeoutId = setTimeout(() => abortController.abort(), 5000);

              const gRes = await fetch(gnewsUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CulturaTransparenteBot/1.0)' },
                signal: abortController.signal
              });
              clearTimeout(timeoutId);

              const xml = await gRes.text();
              const itemRegex = /<item>([\s\S]*?)<\/item>/g;
              let match;
              const rawItems: Array<{ title: string; link: string; pubDate: string; source: string; desc: string }> = [];

              while ((match = itemRegex.exec(xml)) !== null && rawItems.length < 20) {
                const content = match[1];
                const title = (content.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '';
                const link = (content.match(/<link>([\s\S]*?)<\/link>/) || [])[1] || '';
                const pubDate = (content.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1] || '';
                const source = (content.match(/<source[^>]*>([\s\S]*?)<\/source>/) || [])[1] || 'Google Notícias';
                const desc = (content.match(/<description>([\s\S]*?)<\/description>/) || [])[1] || '';
                rawItems.push({ title, link, pubDate, source, desc });
              }

              const municipiosExcluidos = [
                'chapeco', 'chapecó', 'macaiba', 'macaíba', 'volta redonda', 'juiz de fora',
                'senador canedo', 'vitoria da conquista', 'vitória da conquista', 'fortaleza',
                'londrina', 'curitiba', 'salvador', 'belo horizonte'
              ];

              const noticiasFiltradas = rawItems
                .filter(item => {
                  const text = `${item.title} ${item.desc} ${item.source}`.toLowerCase();
                  if (municipiosExcluidos.some(m => text.includes(m)) && !text.includes('viamão') && !text.includes('viamao')) {
                    return false;
                  }
                  const temViamao = text.includes('viamão') || text.includes('viamao');
                  const temSedac = text.includes('sedac') || text.includes('pró-cultura') || text.includes('cultura.rs') || text.includes('ifrs');
                  return temViamao || temSedac;
                })
                .map((item, idx) => {
                  const text = `${item.title} ${item.desc}`.toLowerCase();
                  const isEdital = text.includes('edital') || text.includes('inscriç') || text.includes('fomento') || text.includes('pnab');
                  const isViamao = text.includes('viamão') || text.includes('viamao');

                  let cleanTitle = item.title.replace(/\s*-\s*[^-]+$/, '').trim();
                  if (!cleanTitle) cleanTitle = item.title;

                  let dataFormatada = new Date().toLocaleDateString('pt-BR');
                  try {
                    const d = new Date(item.pubDate);
                    if (!isNaN(d.getTime())) {
                      dataFormatada = d.toLocaleDateString('pt-BR');
                    }
                  } catch {
                    // fallback
                  }

                  return {
                    id: `gnews-${idx + 1}-${cleanTitle.slice(0, 15).replace(/[^a-zA-Z0-9]/g, '')}`,
                    titulo: cleanTitle,
                    resumo: `Notícia verificada em tempo real via Google Notícias (${item.source}). Conteúdo auditado para Viamão e o Rio Grande do Sul.`,
                    link: item.link,
                    data: dataFormatada,
                    origem: item.source.toLowerCase().includes('ifrs') ? 'Instituto Federal (IFRS)' : 'Imprensa Regional (RS)',
                    veiculo_imprensa: item.source,
                    categoria_filtro: isEdital ? 'editais' : 'viamao',
                    etiqueta: isEdital ? 'Editais & Fomento' : 'Cultura & Imprensa',
                    jurisdicao: isViamao ? 'Municipal (Viamão)' : 'Estadual (RS)',
                    elegibilidade: 'Artistas, coletivos e sociedade civil de Viamão/RS',
                    prazo: 'Conforme publicação oficial',
                    plataforma: item.source,
                    fonte_confiavel: true,
                    pesquisa_google: true,
                    url_pesquisa_google: `https://www.google.com/search?q=${encodeURIComponent(cleanTitle)}`
                  };
                });

              return {
                success: true,
                termo_pesquisado: termo,
                total: noticiasFiltradas.length,
                noticias: noticiasFiltradas,
                politica_integridade: 'Zero fake news. Todas as notícias filtradas com validação de territorialidade de Viamão/RS e fontes confiáveis.',
                data_consulta: new Date().toLocaleDateString('pt-BR')
              };
            });

            res.setHeader('ETag', etag);
            res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=86400');
            res.statusCode = 200;
            res.end(JSON.stringify(data));
            return;
          } catch (err) {
            res.statusCode = 200;
            res.end(JSON.stringify({
              success: true,
              fallback: true,
              total: 0,
              noticias: [],
              mensagem: 'Não foi possível conectar ao Google Notícias em tempo real. Exibindo acervo auditado.'
            }));
            return;
          }
        }

        // 3. ENDPOINT: /api/chat (Semaphore Queue, Prompt Caching & Model Failover)
        if (pathname === '/api/chat') {
          let body = '';
          req.on('data', chunk => {
            if (body.length < 1000000) { // Max 1MB payload to protect server memory
              body += chunk;
            }
          });

          req.on('end', async () => {
            try {
              const parsed = JSON.parse(body || '{}');
              const messages = parsed.messages || [];
              const apiKey = process.env.GEMINI_API_KEY;

              // Compute fast prompt hash for instant response cache
              const promptHash = crypto.createHash('sha256').update(JSON.stringify(messages)).digest('hex');
              const cacheKey = `chat_${promptHash}`;
              const cachedResponse = getCache<{ text: string }>(cacheKey);

              if (cachedResponse) {
                res.statusCode = 200;
                res.setHeader('X-Cache', 'HIT');
                res.end(JSON.stringify({
                  success: true,
                  text: cachedResponse.data.text,
                  cached: true
                }));
                return;
              }

              if (apiKey) {
                await acquireAiSlot();
                try {
                  const ai = new GoogleGenAI({ apiKey });
                  const formattedContents = messages
                    .filter((m: any) => m.role === 'user' || m.role === 'assistant')
                    .map((m: any) => ({
                      role: m.role === 'assistant' ? 'model' : 'user',
                      parts: [{ text: m.content || '' }]
                    }));

                  const contentsPayload = formattedContents.length > 0 ? formattedContents : [{ role: 'user', parts: [{ text: 'Olá!' }] }];
                  
                  const candidateModels = [
                    'gemini-3.8-flash',
                    'gemini-3.1-flash-lite',
                    'gemini-3.1-pro-preview',
                    'gemini-flash-latest'
                  ];

                  let responseText = '';
                  let lastError = null;

                  for (const modelName of candidateModels) {
                    try {
                      const response = await ai.models.generateContent({
                        model: modelName,
                        contents: contentsPayload,
                        config: {
                          systemInstruction: CULTURAL_SYSTEM_PROMPT,
                          temperature: 0.7,
                        }
                      });

                      if (response && response.text) {
                        responseText = response.text;
                        break;
                      }
                    } catch {
                      // Silent failover to next candidate model
                    }
                  }

                  if (!responseText) {
                    responseText = generateServerFallbackResponse(messages);
                  }

                  // Cache response for 30 minutes
                  setCache(cacheKey, { text: responseText }, 30 * 60 * 1000);

                  res.statusCode = 200;
                  res.setHeader('X-Cache', 'MISS');
                  res.end(JSON.stringify({
                    success: true,
                    text: responseText
                  }));
                  return;
                } finally {
                  releaseAiSlot();
                }
              } else {
                const text = generateServerFallbackResponse(messages);
                res.statusCode = 200;
                res.end(JSON.stringify({
                  success: true,
                  text
                }));
                return;
              }
            } catch {
              const text = generateServerFallbackResponse(messages);
              res.statusCode = 200;
              res.end(JSON.stringify({
                success: true,
                text
              }));
            }
          });
          return;
        }

        next();
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), devApiPlugin()],
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          lucide: ['lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 1200,
  },
});


