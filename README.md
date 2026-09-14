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

Todos os 13 testes validam:
- Formatos e dígitos verificadores de CNPJ.
- Integração e parsing da API Transferegov Fundo a Fundo (LPG).
- API da CGU (Emendas Federais) com e sem chave configurada.
- Portal da Transparência RS (Emendas Estaduais CAGE) com filtragem territorial estrita.
- Normalização e classificação setorial de projetos culturais.
- Cache TTL (expiração, hit/miss, invalidação).
- Resiliência de requisições HTTP e tolerância a falhas de rede.

---

## 🔌 Documentação de Rate Limits das APIs Oficiais

| API Governamental | Endpoint Base | Limite Estimado | Estratégia de Cache |
|---|---|---|---|
| **Transferegov / SICONV** | `api.convenios.gov.br/siconv/v1/` | ~60 req/min | Cache TTL 1h (`s-maxage=3600`) |
| **Portal da Transparência CGU** | `api.portaldatransparencia.gov.br/api-de-dados/` | 120 req/min (com chave) | Cache TTL 24h (`s-maxage=86400`) |
| **Portal da Transparência RS (CAGE)** | `transparencia.rs.gov.br/` | Dados Abertos | Cache TTL 24h (`s-maxage=86400`) |
| **Google News RSS Viamão** | `news.google.com/rss/search` | ~30 req/min | Cache TTL 1h (`s-maxage=3600`) |

---

