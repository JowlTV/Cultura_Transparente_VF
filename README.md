# 🏛️ Cultura Transparente Viamão (Cultura_Transparente_VF)

Plataforma cidadã de transparência pública, auditoria de recursos e fomento à cultura para o Município de Viamão/RS. Pautada estritamente na **Lei nº 12.527/2011 (LAI)**, **LC nº 131/2009** e nos princípios da integridade de dados públicos sem alucinação.

---

## 📋 Arquitetura do Sistema

O projeto é estruturado em uma arquitetura moderna full-stack:
- **Frontend SPA**: React 18 + TypeScript + Vite + Tailwind CSS + Lucide Icons.
- **Backend & Automação**: Python 3.10+ modularizado (`backend/models.py`, `backend/utils.py`, `backend/apis.py`).
- **Serverless API (Vercel)**: Funções serverless leves em `/api` com resposta sub-100ms e cache no Edge.
- **PNAB (Política Nacional Aldir Blanc)**: Consulta direta e visual via iframe oficial do painel Power BI do Ministério da Cultura (MinC), garantindo dados fidedignos e atualizados sem riscos de inconsistência por scraping.
- **LPG (Lei Paulo Gustavo)**: Consulta e auditoria em tempo real via endpoint `/api/lpg` conectado à API Pública Transferegov Fundo a Fundo (Programa 47).
- **Emendas Parlamentares (Federais e Estaduais)**: Coleta e auditoria via endpoint `/api/emendas` conectado à API de Dados da CGU (Governo Federal) e aos Dados Abertos do Portal da Transparência RS (CAGE / SEFAZ-RS), com fallback auditado e classificação setorial.

```
├── api/                       # Vercel Serverless Functions (Python)
│   ├── lpg.py                 # GET /api/lpg (Transferegov Fundo a Fundo - LC 195/2022)
│   ├── news.py                # GET /api/news (Google News RSS com filtro cultural)
│   ├── emendas.py             # GET /api/emendas (CGU Federal + Transparência RS CAGE)
│   └── index.py               # GET /api (Índice de rotas e health check)
├── backend/                   # Módulos Python Reutilizáveis
│   ├── models.py              # Classes Dataclass de dados (LPG, Emendas, Validação CNPJ)
│   ├── utils.py               # Cache com TTL, Logging estruturado e Retry Exponencial
│   └── apis.py                # Clientes com tratamento de rate-limits (Transferegov, CGU, Portal RS)
├── tests/                     # Suíte de Testes Unitários Python
│   ├── test_models.py
│   ├── test_utils.py
│   └── test_apis.py
├── src/                       # Frontend React / TypeScript
│   ├── components/            # Componentes de interface por aba
│   │   ├── PnabAuditoriaSection.tsx # Painel Oficial MinC Power BI via Iframe
│   │   ├── LpgSection.tsx           # Auditoria LPG com metas orçamentárias reais
│   │   ├── EmendasSection.tsx       # Emendas Parlamentares Federais e Estaduais
│   │   ├── BudgetDashboard.tsx      # Dashboard Orçamentário e Cronologia
│   │   └── ExecutiveSummary.tsx     # Sumário Executivo e KPIs
│   ├── data/                  # Dados consolidados e auditados
│   └── types/                 # Contratos TypeScript sincronizados
├── vercel.json                # Configuração para Deploy Gratuito no Vercel (Timeout 10s + Caching)
└── requirements.txt           # Dependências Python para Vercel
```

---

## 🚀 Como Fazer Deploy Gratuito no Vercel

O projeto foi 100% otimizado para o plano **Vercel Hobby (Gratuito)**, respeitando:
- **Limite estrito de 10s de execução** (`maxDuration: 10` configurado em `vercel.json`).
- **Edge Caching** com cabeçalhos `s-maxage=3600, stale-while-revalidate=86400` para proteger cotas e garantir respostas quase instantâneas.
- **Roteamento SPA** e rewrites automáticos para `/api/*`.

### Passo a Passo:

1. **Importar o Repositório no Vercel**:
   - Conecte sua conta GitHub/GitLab no [Vercel Dashboard](https://vercel.com).
   - Selecione o repositório `Cultura_Transparente_VF`.

2. **Configurações de Build (detectadas automaticamente via `vercel.json`)**:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

3. **Variáveis de Ambiente**:
   - `PORTAL_TRANSPARENCIA_API_KEY`: Chave gratuita de API da CGU para consulta ao vivo de emendas federais. Obtenha em [portaldatransparencia.gov.br/api-de-dados/cadastrar](https://portaldatransparencia.gov.br/api-de-dados/cadastrar).
   - `LOG_FORMAT=json` (ativa logs estruturados em JSON no dashboard do Vercel).

4. **Clique em Deploy**:
   - O Vercel fará a compilação estática do frontend e provisionará as funções serverless de `/api/*.py`.

---

## 🧪 Executando Testes Unitários

Para rodar a suíte completa de testes unitários do backend Python:

```bash
PYTHONPATH=. python3 -m unittest discover -s tests -p "test_*.py"
```

Todos os 18 testes validam:
- Formatos e dígitos verificadores de CNPJ.
- Integração e parsing da API Transferegov Fundo a Fundo (LPG).
- API da CGU (Emendas Federais) com e sem chave configurada.
- Consulta de emendas federais em janela móvel de 3 anos (exercício corrente + 2 anos anteriores).
- Tolerância a falha parcial na API da CGU (se 1 ano falhar, os demais anos são preservados).
- Deduplicação e consolidação de emendas que transitam entre múltiplos anos fiscais.
- Portal da Transparência RS (Emendas Estaduais CAGE) com filtragem territorial estrita.
- Normalização e classificação setorial de projetos culturais.
- Coalescência de requisições (`SingleFlightCache`) e proteção sob concorrência multithread.
- Fast path de cache TTL (expiração, hit/miss, invalidação).
- Resiliência de requisições HTTP e tolerância a falhas de rede.

---

## 🔌 Documentação de Rate Limits e Coalescência de Requisições

| API Governamental | Endpoint Base | Limite Oficial / Estimado | Estratégia de Cache e Proteção |
|---|---|---|---|
| **Portal da Transparência CGU** | `api.portaldatransparencia.gov.br/api-de-dados/` | 400 req/min (dia) / 700 req/min (madrugada) / 180 req/min (restritas) | Janela móvel de 3 anos (até 3 reqs/sync) + Single-Flight por ano + Cache TTL 24h (`s-maxage=86400`) |
| **Portal da Transparência RS (CAGE)** | `transparencia.rs.gov.br/` | Dados Abertos Governamentais | Single-Flight Backend + Cache TTL 24h (`s-maxage=86400`) |
| **Transferegov / SICONV** | `api.convenios.gov.br/siconv/v1/` | ~60 req/min | Single-Flight Backend + Cache TTL 1h (`s-maxage=3600`) |
| **Google News RSS Viamão** | `news.google.com/rss/search` | ~30 req/min | Cache TTL 1h (`s-maxage=3600`) |

### 🛡️ Janela Móvel e Proteção por Coalescência de Requisições
1. **Janela Móvel Multi-Ano de Emendas:** O endpoint `/api/emendas` e a classe `CguTransparenciaApi` consultam os últimos 3 exercícios orçamentários (ex: 2024, 2025 e 2026). Isso resulta em até 3 requisições à CGU por sincronização com cache frio — cada ano possui sua própria chave de cache de 24h e proteção *Single-Flight* independente. Emendas com mesmo identificador são automaticamente deduplicadas e consolidadas com o maior valor pago/liquidado.
2. **Frontend (`inFlightRequests` em `src/services/apiClient.ts`):** Deduplica chamadas disparadas no mesmo navegador / aba enquanto uma requisição está em trânsito.
3. **Backend Serverless (`SingleFlightCache` em `backend/utils.py`):** Utiliza locks granulados por chave para que, caso múltiplos usuários cheguem simultaneamente com o cache frio (*cold cache*), apenas **uma única requisição real** seja disparada para cada ano à API da CGU ou do Estado do RS. Todas as demais threads aguardam e compartilham o mesmo resultado consolidado, mitigando tempestades de requisições (*thundering herd problem*).

---

