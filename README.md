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

## 📚 Como Adicionar Novos Editais na Base de Conhecimento

O assistente de elaboração de projetos culturais baseia-se exclusivamente em normativas oficiais arquivadas no diretório `backend/conhecimento/`. Para incluir um novo edital municipal de Viamão ou instrução normativa:

1. **Adicionar o Documento de Texto:**
   - Crie um arquivo `.txt` ou `.md` dentro de `backend/conhecimento/` com o texto oficial do edital (ex: `edital_01_2026_viamao.txt`).
   - Mantenha os títulos, artigos, categorias e critérios de elegibilidade fiéis ao documento publicado no Diário Oficial.

2. **Registrar o Edital no `backend/conhecimento/indice.json`:**
   - Adicione uma entrada no array `documentos` seguindo a estrutura:
   ```json
   {
     "id": "edital-viamao-01-2026",
     "titulo": "Edital de Fomento Cultural nº 01/2026 - SMC Viamão",
     "tipo": "edital",
     "instrumento": "Municipal",
     "ano": 2026,
     "arquivo": "edital_01_2026_viamao.txt",
     "etapas_relevantes": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
     "resumo": "Edital municipal de fomento para projetos culturais em Viamão/RS."
   }
   ```
3. **Mapeamento de Etapas Relevantes:**
   - O campo `etapas_relevantes` direciona o `backend/conhecimento_retriever.py` a injetar o trecho correspondente na etapa certa da conversa (ex: etapas 7 e 8 para acessibilidade e contrapartida social; etapa 10 para planilha orçamentária).

---

## ☁️ Configuração do Google Cloud para Exportação no Google Drive

A plataforma permite exportar o projeto cultural diretamente para a conta do Google Drive da pessoa, convertendo a proposta em um **Google Doc editável**.

Essa integração é **opcional**: caso a variável `VITE_GOOGLE_CLIENT_ID` não esteja definida, o botão do Google Drive permanece oculto e o usuário conta com o download em formato `.docx` (Microsoft Word / LibreOffice / Google Docs).

### Passo a Passo no Google Cloud Console:

1. **Criar ou Selecionar Projeto:**
   - Acesse o [Google Cloud Console](https://console.cloud.google.com/).
   - Crie um novo projeto (ex: `cultura-transparente-viamao`).

2. **Ativar a Google Drive API:**
   - No menu lateral, acesse **APIs e Serviços** > **Biblioteca**.
   - Pesquise por `Google Drive API` e clique em **Ativar** (*Enable*).

3. **Configurar a Tela de Consentimento OAuth (OAuth Consent Screen):**
   - Acesse **APIs e Serviços** > **Tela de permissão OAuth**.
   - Selecione o tipo de usuário **Externo** e clique em **Criar**.
   - Preencha o nome do app (ex: `Cultura Transparente Viamão`) e o e-mail de suporte.
   - Na etapa de **Escopos**, clique em **Adicionar ou remover escopos** e selecione estritamente:
     - `https://www.googleapis.com/auth/drive.file`
     *(Escopo não-sensível recomendado pelo Google, que concede acesso apenas aos arquivos criados pelo próprio aplicativo, garantindo total privacidade à conta do usuário).*

4. **Criar Credenciais OAuth (Client ID da Web):**
   - Acesse **APIs e Serviços** > **Credenciais** > **Criar Credenciais** > **ID do cliente OAuth**.
   - Em **Tipo de aplicativo**, selecione **Aplicativo da Web** (*Web application*).
   - Em **Origens JavaScript autorizadas**, insira a URL da sua aplicação (ex: `https://cultura-transparente-vf.vercel.app` e `http://localhost:3000` para desenvolvimento local).
   - Clique em **Criar** e copie o **Client ID** gerado (formato `XXXXXX.apps.googleusercontent.com`).

5. **Configurar Variável de Ambiente:**
   - No seu arquivo `.env` local ou no painel de configurações de ambiente do Vercel / Cloud Run:
     ```env
     VITE_GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
     ```
   - Reinicie a aplicação para que o botão "Salvar no meu Google Drive" fique automaticamente disponível na interface.
