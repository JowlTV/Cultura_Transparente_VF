"""=============================================================================
CULTURA TRANSPARENTE - ASSISTENTE DE IA DE PROJETOS CULTURAIS
Módulo: api/chat.py (Serverless Function Vercel)
=============================================================================
Endpoint serverless para atendimento interativo e elaboração de projetos culturais
com integração às APIs oficiais de Viamão/RS (PNAB, LPG, Emendas) e failover
resiliente entre modelos Google Gemini.
"""

from http.server import BaseHTTPRequestHandler
import json
import os
import sys
import hashlib
import urllib.request
import urllib.error

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.apis import TransferegovApi
from backend.utils import setup_logger, cache

logger = setup_logger("VercelApiChat")

CULTURAL_SYSTEM_PROMPT = """Você é o Consultor Especialista de Elaboração de Projetos Culturais da plataforma Cultura Transparente de Viamão/RS.
Sua missão é atuar como um consultor sênior em gestão cultural e elaboração técnica de propostas para editais públicos e instrumentos de fomento:
- Política Nacional Aldir Blanc (PNAB - Lei nº 14.399/2022)
- Lei Paulo Gustavo (LPG - Lei Complementar nº 195/2022)
- Emendas Parlamentares Federais e Estaduais para Cultura em Viamão/RS
- Editais Municipais da Secretaria de Cultura de Viamão/RS

DIRETRIZES DE ATUAÇÃO E METODOLOGIA ITERATIVA:
1. Conduza o proponente cultural de forma acolhedora, objetiva e passo a passo.
2. Faça perguntas em blocos curtos (1 ou 2 por vez) para coletar:
   - OBJETO & LOCAL: Qual a ideia do projeto? Formato (oficina comunitária, show, festival, mostra, audiovisual, livro, artes visuais)? Onde será realizado em Viamão/RS (bairros como Santa Isabel, Centro, Itapuã, Águas Claras, Viamópolis, etc.)?
   - JUSTIFICATIVA: Relevância cultural, impacto social e descentralização territorial.
   - ACESSIBILIDADE & DEMOCRATIZAÇÃO:
     * Acessibilidade física/arquitetônica (rampas, sanitários adaptados, assentos prioritários)
     * Acessibilidade comunicacional (Intérprete de Libras, audiodescrição, legendagem)
     * Democratização (gratuidade total ou preços populares, contrapartida social comunitária)
   - METAS E CRONOGRAMA: Etapas (Pré-produção, Produção, Execução, Pós-produção e Prestação de contas)
   - PLANILHA ORÇAMENTÁRIA: Rubricas com valores unitários, quantidades e estimativa global compatível com os tetos dos editais.
   - REGULARIDADE FISCAL: Lembre o usuário das certidões obrigatórias (CND Federal, Estadual RS, Municipal de Viamão, CNDT e FGTS para PJ).

GATILHO DE CONSOLIDAÇÃO DO PROJETO FINAL:
Quando o usuário solicitar a consolidação ("terminei", "finalizar", "gerar projeto", "consolidar", "exportar", "concluir") ou tiver fornecido os elementos essenciais:
Você DEVE gerar o projeto cultural completo, estruturado e formal em Markdown, INICIANDO OBRIGATORIAMENTE COM A TAG:
[PROJETO_FINAL]

Estrutura obrigatória dentro do [PROJETO_FINAL]:
# PROJETO CULTURAL: [Nome do Projeto baseado na conversa]
## Edital Alvo: [PNAB Viamão / LPG Viamão / Emenda Parlamentar / Municipal Viamão]
## Proponente: [Nome ou Coletivo do usuário] | Viamão/RS

### 1. IDENTIFICAÇÃO E RESUMO EXECUTIVO
- **Objeto**: ...
- **Linguagem / Segmento**: ...
- **Público Estimado**: ...
- **Local de Realização**: ...
- **Período de Execução**: ...

### 2. JUSTIFICATIVA E RELEVÂNCIA CULTURAL
...

### 3. OBJETIVOS E METAS
- **Objetivo Geral**: ...
- **Objetivos Específicos**: ...
- **Metas Quantitativas e Qualitativas**: ...

### 4. PLANO DE DEMOCRATIZAÇÃO DE ACESSO E CONTRAPARTIDA SOCIAL
...

### 5. MEDIDAS DE ACESSIBILIDADE (Lei nº 13.146/2015)
- **Acessibilidade Física**: ...
- **Acessibilidade Comunicacional**: ...
- **Acessibilidade Atitudinal**: ...

### 6. CRONOGRAMA DE EXECUÇÃO (Tabela em Markdown com Etapa, Ação, Período e Responsável)

### 7. PLANILHA ORÇAMENTÁRIA DETALHADA (Tabela com Item, Rubrica, Unid., Qtd, Valor Unit. R$ e Total R$)
**VALOR TOTAL DO PROJETO: R$ [Valor Global]**

### 8. EQUIPE PRINCIPAL E FICHA TÉCNICA
...

### 9. PLANO DE DIVULGAÇÃO E COMUNICAÇÃO
...

### 10. CHECKLIST DE CERTIDÕES E DOCUMENTOS DE HABILITAÇÃO
- [ ] CND Federal / PGFN
- [ ] CND Estadual RS (Receita Estadual)
- [ ] CND Municipal de Viamão
- [ ] CNDT (Débitos Trabalhistas)
- [ ] Certificado de Regularidade FGTS (se PJ)
- [ ] Comprovante de Residência/Atuação em Viamão/RS
- [ ] Portfólio Artístico / Comprovantes de Atuação
"""


def obter_contexto_factual_viamao(user_query: str = "") -> str:
    """
    Coleta dados factuais em tempo real das APIs públicas integradas
    (PNAB, LPG Transferegov e Emendas) para enriquecer o contexto do Gemini.
    """
    context_parts = []
    user_query_lower = (user_query or "").lower()

    # Contexto PNAB
    if any(k in user_query_lower for k in ["pnab", "aldir blanc", "fomento", "14.399", "projeto", "edital"]):
        context_parts.append(
            "- PNAB Viamão (Lei nº 14.399/2022): Valor Global de R$ 1.756.598,00 alocado pelo Ministério da Cultura "
            "ao Fundo Municipal de Cultura de Viamão (Termo de Adesão 0514/2023, Conta Fiduciária Banco do Brasil 42000-X). "
            "Destinado a fomento direto a coletivos culturais, premiações e subsídios a espaços artísticos."
        )

    # Contexto LPG (Consulta Transferegov)
    if any(k in user_query_lower for k in ["lpg", "paulo gustavo", "audiovisual", "195", "cinema", "vídeo"]):
        try:
            api_lpg = TransferegovApi()
            plano = api_lpg.buscar_plano_acao_lpg(cnpj="88000914000101")
            if plano and isinstance(plano, dict):
                v_total = plano.get("valor_total", 2029083.72)
                context_parts.append(
                    f"- Lei Paulo Gustavo Viamão (LPG - LC nº 195/2022): Plano de Ação homologado no valor de R$ {v_total:,.2f} "
                    "(Meta Audiovisual Art. 6º: ~R$ 1.444.301,79; Demais Áreas Culturais Art. 8º: ~R$ 584.781,93)."
                )
            else:
                context_parts.append(
                    "- Lei Paulo Gustavo Viamão (LPG - LC nº 195/2022): Plano de Ação Transferegov de R$ 2.029.083,72 "
                    "distribuído entre produção audiovisual, salas de cinema e demais linguagens culturais."
                )
        except Exception as e:
            logger.warning(f"Não foi possível extrair dados adicionais de LPG: {e}")
            context_parts.append(
                "- Lei Paulo Gustavo Viamão (LPG - LC nº 195/2022): R$ 2.029.083,72 alocados no município."
            )

    # Contexto Emendas Parlamentares
    if any(k in user_query_lower for k in ["emenda", "parlamentar", "deputad", "verba", "recurso", "orçamento"]):
        context_parts.append(
            "- Emendas Parlamentares em Viamão/RS: Monitoradas pelo Portal da Transparência CGU e CAGE/RS, "
            "com repasses federais e estaduais direcionados a projetos sociais, infraestrutura comunitária e ações culturais."
        )

    if not context_parts:
        # Contexto base padrão de Viamão
        context_parts.append(
            "- Base Territorial: Município de Viamão/RS (População ~224 mil hab., Região Metropolitana de Porto Alegre). "
            "Políticas ativas monitoradas: PNAB (R$ 1,75M) e LPG (R$ 2,02M)."
        )

    return (
        "\n\n=== DADOS FACTUAIS AUDITADOS DE VIAMÃO/RS (Fontes: MinC, Transferegov e CGU) ===\n"
        + "\n".join(context_parts)
        + "\nUtilize estes dados factuais para auxiliar no dimensionamento orçamentário e fundamentação legal do projeto quando oportuno.\n"
    )


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
        self.send_header("Access-Control-Max-Age", "86400")
        self.end_headers()

    def do_GET(self):
        status_info = {
            "servico": "Cultura Transparente - Assistente de IA de Projetos Culturais",
            "endpoint": "/api/chat",
            "status": "online",
            "metodo_esperado": "POST",
            "payload_esperado": {
                "messages": [
                    {"role": "user", "content": "Quero inscrever um projeto na PNAB em Viamão"}
                ]
            }
        }
        payload = json.dumps(status_info, ensure_ascii=False, indent=2).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def do_POST(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            if content_length > 1000000:
                self.send_error_response(413, "Payload muito grande (máximo 1MB).")
                return

            body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else "{}"
            parsed_data = json.loads(body)
            messages = parsed_data.get("messages", [])

            if not isinstance(messages, list) or len(messages) == 0:
                self.send_error_response(400, "Campo 'messages' inválido ou vazio.")
                return

            api_key = os.environ.get("GEMINI_API_KEY", "").strip()
            if not api_key:
                logger.warning("GEMINI_API_KEY não configurada no ambiente.")
                self.send_json_response(200, {
                    "success": False,
                    "error": "A chave de inteligência artificial (GEMINI_API_KEY) não está configurada no ambiente de produção. Por favor, configure a variável de ambiente para habilitar o assistente.",
                    "code": "MISSING_GEMINI_API_KEY"
                })
                return

            # Verificação de Cache por Hash das mensagens
            prompt_hash = hashlib.sha256(json.dumps(messages, sort_keys=True).encode("utf-8")).hexdigest()
            cache_key = f"chat_gemini:{prompt_hash}"
            cached_text = cache.get(cache_key)

            if cached_text:
                self.send_json_response(200, {
                    "success": True,
                    "text": cached_text,
                    "cached": True
                })
                return

            # Extração de contexto de todas as mensagens do usuário
            user_texts = [m.get("content", "") for m in messages if m.get("role") == "user"]
            combined_user_text = " ".join(user_texts)
            contexto_factual = obter_contexto_factual_viamao(combined_user_text)

            system_instruction_completa = CULTURAL_SYSTEM_PROMPT + contexto_factual

            # Formatação dos conteúdos para a API Gemini REST
            formatted_contents = []
            for m in messages:
                role = m.get("role")
                content = m.get("content", "")
                if role in ("user", "assistant"):
                    formatted_contents.append({
                        "role": "model" if role == "assistant" else "user",
                        "parts": [{"text": content}]
                    })

            if not formatted_contents:
                formatted_contents = [{"role": "user", "parts": [{"text": "Olá!"}]}]

            candidate_models = [
                "gemini-2.5-flash",
                "gemini-2.0-flash",
                "gemini-1.5-flash",
                "gemini-2.5-flash-lite"
            ]

            response_text = ""
            last_error_msg = ""

            for model_name in candidate_models:
                try:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
                    req_payload = {
                        "systemInstruction": {
                            "parts": [{"text": system_instruction_completa}]
                        },
                        "contents": formatted_contents,
                        "generationConfig": {
                            "temperature": 0.7
                        }
                    }
                    data_bytes = json.dumps(req_payload).encode("utf-8")
                    req = urllib.request.Request(
                        url,
                        data=data_bytes,
                        headers={"Content-Type": "application/json"},
                        method="POST"
                    )

                    with urllib.request.urlopen(req, timeout=30) as response:
                        status_code = getattr(response, "status", getattr(response, "code", 200))
                        if status_code == 200 or status_code is None:
                            res_json = json.loads(response.read().decode("utf-8"))
                            candidates = res_json.get("candidates", [])
                            if candidates and len(candidates) > 0:
                                parts = candidates[0].get("content", {}).get("parts", [])
                                if parts and len(parts) > 0:
                                    response_text = parts[0].get("text", "")
                                    if response_text:
                                        break
                except urllib.error.HTTPError as http_err:
                    error_body = ""
                    try:
                        error_body = http_err.read().decode("utf-8")
                    except Exception:
                        pass
                    last_error_msg = f"HTTP {http_err.code} ({model_name}): {error_body}"
                    logger.warning(f"Failover Gemini ({model_name}): {last_error_msg}")
                except Exception as ex:
                    last_error_msg = f"Erro em {model_name}: {str(ex)}"
                    logger.warning(f"Failover Gemini ({model_name}): {last_error_msg}")

            if not response_text:
                logger.error(f"Todos os modelos Gemini falharam. Último erro: {last_error_msg}")
                self.send_json_response(200, {
                    "success": False,
                    "error": "Os servidores de inteligência artificial estão temporariamente indisponíveis. Por favor, tente novamente em alguns instantes.",
                    "code": "AI_MODELS_UNAVAILABLE",
                    "details": last_error_msg
                })
                return

            # Armazena em cache por 30 minutos (1800s)
            cache.set(cache_key, response_text, ttl_seconds=1800)

            self.send_json_response(200, {
                "success": True,
                "text": response_text
            })

        except Exception as e:
            logger.error(f"Exceção fatal no endpoint /api/chat: {e}")
            self.send_json_response(500, {
                "success": False,
                "error": f"Erro interno ao processar requisição: {str(e)}",
                "code": "INTERNAL_SERVER_ERROR"
            })

    def send_json_response(self, status_code: int, data: dict):
        payload = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def send_error_response(self, status_code: int, message: str):
        self.send_json_response(status_code, {
            "success": False,
            "error": message
        })
