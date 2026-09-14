# 🏛️ Cultura Transparente Viamão (Cultura_Transparente_VF)

Plataforma cidadã de transparência pública, auditoria de recursos e mapeamento cultural para o Município de Viamão/RS. Pautada estritamente na **Lei nº 12.527/2011 (LAI)**, **LC nº 131/2009** e nos princípios da integridade de dados públicos sem alucinação.

---

## 📋 Arquitetura do Sistema

O projeto é estruturado em uma arquitetura moderna full-stack:
- **Frontend SPA**: React 18 + TypeScript + Vite + Tailwind CSS + Lucide Icons.
- **Backend & Automação**: Python 3.10+ modularizado (`backend/models.py`, `backend/utils.py`, `backend/apis.py`, `backend/scrapers/`).
- **Serverless API (Vercel)**: Funções serverless leves em `/api` com resposta sub-100ms e cache no Edge.

```
├── api/                       # Vercel Serverless Functions (Python)
│   ├── pnab.py                # GET /api/pnab (Auditoria MinC / Transferegov)
│   ├── rouanet.py             # GET /api/rouanet (Versalic / SalicNet filtrado)
│   ├── fac.py                 # GET /api/fac (SEDAC-RS Pró-Cultura / FAC)
│   └── index.py               # GET /api (Índice de rotas e health check)
├── backend/                   # Módulos Python Reutilizáveis
│   ├── models.py              # Classes Dataclass de dados (PNAB, FAC, LPG, Rouanet, Emendas)
│   ├── utils.py               # Cache com TTL, Logging JSON estruturado e Retry Exponencial
│   ├── apis.py                # Clientes com tratamento de rate-limits (Transferegov, Versalic, CGU)
│   └── scrapers/              # Bots de web scraping (Selenium, BeautifulSoup, Fallbacks)
│       ├── rouanet_scraper.py # Scraper SalicNet/Versalic
│       ├── fac_scraper.py     # Scraper Pró-Cultura RS / FAC
│       └── viamao_scraper.py  # Scraper notícias e editais de Viamão
├── tests/                     # Suíte de Testes Unitários Python
│   ├── test_models.py
│   ├── test_utils.py
│   └── test_apis.py
├── src/                       # Frontend React / TypeScript
│   ├── components/            # Componentes de interface por aba
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

3. **Variáveis de Ambiente (Opcionais)**:
   - `LOG_FORMAT=json` (ativa logs estruturados em JSON no dashboard do Vercel)
   - `CGU_API_KEY` (chave opcional para a API do Portal da Transparência da CGU)

4. **Clique em Deploy**:
   - O Vercel fará a compilação estática do frontend e provisionará as funções serverless de `/api/*.py`.

---

## 🧪 Executando Testes Unitários

Para rodar a suíte completa de testes unitários do backend Python:

```bash
PYTHONPATH=. python3 -m unittest discover -s tests -p "test_*.py"
```

Todos os 12 testes validam:
- Formatos e dígitos verificadores de CNPJ.
- Filtro territorial anti-alucinação da Lei Rouanet (rejeita projetos fora de Viamão).
- Cache TTL (expiração, hit/miss, invalidação).
- Resiliência de requisições e normalização de schemas.

---

## 🔌 Documentação de Rate Limits das APIs Oficiais

| API Governamental | Endpoint Base | Limite Estimado | Estratégia de Cache |
|---|---|---|---|
| **Transferegov / SICONV** | `api.convenios.gov.br/siconv/v1/` | ~60 req/min | Cache TTL 1h (`s-maxage=3600`) |
| **Versalic (Lei Rouanet)** | `versalic.cultura.gov.br/api/v1/` | ~30 req/min | Cache TTL 2h (`s-maxage=7200`) |
| **Portal da Transparência CGU** | `api.portaldatransparencia.gov.br/` | 120 req/min (com chave) | Cache TTL 24h (`s-maxage=86400`) |
| **Pró-Cultura RS (FAC)** | `www.procultura.rs.gov.br` | Web público | Cache TTL 4h (`s-maxage=14400`) |

---

