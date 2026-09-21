"""=============================================================================
CULTURA TRANSPARENTE - ASSISTENTE DE IA DE PROJETOS CULTURAIS
Módulo: api/chat.py (Serverless Function Vercel)
=============================================================================
Conduz o proponente na construção do seu projeto cultural passo a passo,
com base estrita em informação oficial (legislação federal, decretos e editais),
sem inventar informações, sem definir valores para o proponente, com uma
pergunta por mensagem e com resposta estruturada em JSON.
"""

from http.server import BaseHTTPRequestHandler
import json
import os
import sys
import time
import re
import socket
import concurrent.futures
import urllib.request
import urllib.error
from typing import Dict, List, Any, Optional

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.apis import TransferegovApi
from backend.conhecimento_retriever import (
    extrair_contexto_conhecimento,
    identificar_politica
)
from backend.utils import setup_logger

logger = setup_logger("VercelApiChat")

ROTEIRO_ETAPAS = [
    {
        "etapa": 1,
        "chave": "edital_politica",
        "nome": "Edital ou Política",
        "descricao": "Escolha do instrumento: PNAB, Lei Paulo Gustavo, emenda parlamentar ou edital municipal de Viamão",
        "pergunta_padrao": "Para qual edital ou política cultural você deseja preparar seu projeto (PNAB, Lei Paulo Gustavo, emenda parlamentar ou edital municipal de Viamão)?"
    },
    {
        "etapa": 2,
        "chave": "ideia_projeto",
        "nome": "Ideia do Projeto",
        "descricao": "Ideia do projeto em poucas palavras",
        "pergunta_padrao": "Qual é a ideia central do seu projeto cultural em poucas palavras?"
    },
    {
        "etapa": 3,
        "chave": "tipo_proponente",
        "nome": "Tipo de Proponente",
        "descricao": "Pessoa física, coletivo informal, MEI ou organização/associação",
        "pergunta_padrao": "Você vai inscrever o projeto como pessoa física, coletivo sem CNPJ, MEI ou organização/associação?"
    },
    {
        "etapa": 4,
        "chave": "objetivo_principal",
        "nome": "Objetivo Principal",
        "descricao": "Objetivo principal e justificativa de impacto cultural",
        "pergunta_padrao": "Qual é o objetivo principal que o seu projeto quer alcançar em Viamão?"
    },
    {
        "etapa": 5,
        "chave": "publico_territorio",
        "nome": "Público e Território",
        "descricao": "Público-alvo estimado e bairro/território de realização",
        "pergunta_padrao": "Quem é o público-alvo prioritário e em qual bairro ou região de Viamão a ação será realizada?"
    },
    {
        "etapa": 6,
        "chave": "atividades_metodologia",
        "nome": "Atividades e Execução",
        "descricao": "Atividades que serão realizadas e como acontecerão na prática",
        "pergunta_padrao": "Quais são as principais atividades do projeto e como elas serão realizadas na prática?"
    },
    {
        "etapa": 7,
        "chave": "acessibilidade",
        "nome": "Medidas de Acessibilidade",
        "descricao": "Medidas de acessibilidade física, comunicacional ou atitudinal",
        "pergunta_padrao": "Quais medidas de acessibilidade física ou comunicacional (como Libras ou audiodescrição) serão adotadas no projeto?"
    },
    {
        "etapa": 8,
        "chave": "contrapartida_social",
        "nome": "Contrapartida Social",
        "descricao": "Ação gratuita de contrapartida social para a comunidade",
        "pergunta_padrao": "Qual será a contrapartida social gratuita oferecida pelo projeto à comunidade de Viamão?"
    },
    {
        "etapa": 9,
        "chave": "cronograma",
        "nome": "Cronograma",
        "descricao": "Período estimado de execução e etapas de pré-produção, produção e pós-produção",
        "pergunta_padrao": "Em quantos meses você planeja executar o projeto e quais os prazos das principais fases?"
    },
    {
        "etapa": 10,
        "chave": "orcamento",
        "nome": "Orçamento",
        "descricao": "Itens de despesa e valores estimados informados pelo proponente",
        "pergunta_padrao": "Quais são os principais itens de custo do seu projeto e quais os valores estimados para cada um?"
    },
    {
        "etapa": 11,
        "chave": "revisao_final",
        "nome": "Revisão Final",
        "descricao": "Revisão e conferência de todas as seções para exportação",
        "pergunta_padrao": "Você deseja fazer algum ajuste no texto do seu projeto antes de gerar o documento final para download?"
    }
]

CULTURAL_SYSTEM_PROMPT = """Você é o Consultor Oficial de Projetos Culturais da plataforma Cultura Transparente de Viamão/RS.
Sua missão é conduzir a pessoa na construção do próprio projeto cultural, etapa por etapa, com base unicamente na documentação oficial e nos dados reais do sistema, gerando um documento estruturado.

PRINCÍPIOS INEGOCIÁVEIS:
1. UMA PERGUNTA POR MENSAGEM:
   - Nunca faça duas ou mais perguntas na mesma resposta.
   - Sua mensagem DEVE conter no máximo um ponto de interrogação ('?').
   - Se precisar de mais informações, pergunte primeiro o ponto mais importante.

2. NÃO INVENTAR INFORMAÇÃO:
   - Toda afirmação sobre regras, prazos, requisitos, critérios ou valores de um edital ou política deve vir EXCLUSIVAMENTE dos documentos oficiais fornecidos na BASE DE CONHECIMENTO OFICIAL anexa ou dos dados reais do sistema, com citação expressa do documento e item/artigo.
   - Se a informação não estiver disponível nos documentos fornecidos, diga expressamente: "Não encontrei essa informação nos documentos oficiais disponíveis" e oriente a pessoa a confirmar no edital oficial publicado.

3. NÃO DEFINIR VALORES PARA A PESSOA:
   - Você NÃO sugere quanto a pessoa deve pedir, quanto cobrar de cachê nem preenche valores de orçamento por conta própria.
   - Você pode apenas:
     a) Informar limites e faixas que constem LITERALMENTE no documento oficial (citando o item/artigo).
     b) Perguntar os valores à pessoa.
     c) Conferir se o total informado respeita esses limites e se a soma dos itens fecha.

4. O PROJETO É DA PESSOA:
   - O assistente organiza, pergunta, confere e redige tecnicamente a partir das respostas do usuário.
   - Todo conteúdo substantivo (ideia, atividades, público, território, valores) vem da pessoa.

5. EMENDAS PARLAMENTARES:
   - Deixe sempre claro que emenda parlamentar NÃO é um edital aberto ou concurso público. O recurso é indicado por um parlamentar e normalmente destinado a um órgão público ou organização da sociedade civil apta a celebrar parceria (Termo de Fomento via MROSC - Lei nº 13.019/2014). Não prometa acesso garantido ao recurso.

6. DADOS PESSOAIS E LGPD:
   - NUNCA peça CPF, RG, dados bancários, endereço residencial completo ou telefone no chat.
   - No documento, essas informações aparecem como campos entre colchetes para preenchimento posterior pela pessoa (ex: "[CPF do proponente]", "[Endereço do proponente]", "[Conta Bancária]").
   - Se a pessoa digitar dados pessoais no chat, avise educadamente que não é necessário enviá-los e JAMAIS os repita na resposta.

ROTEIRO FIXO DE ETAPAS (1 a 11):
1. edital_politica: Qual edital ou política (PNAB, Lei Paulo Gustavo, emenda parlamentar, edital municipal de Viamão)
2. ideia_projeto: Ideia do projeto, em poucas palavras
3. tipo_proponente: Tipo de proponente (pessoa física, coletivo, MEI, organização)
4. objetivo_principal: Objetivo principal e justificativa de impacto em Viamão
5. publico_territorio: Público-alvo prioritário e território/bairro de Viamão onde acontece
6. atividades_metodologia: Atividades e como serão realizadas na prática
7. acessibilidade: Medidas de acessibilidade (física, comunicacional com Libras/audiodescrição, e atitudinal)
8. contrapartida_social: Contrapartida social gratuita para a comunidade
9. cronograma: Cronograma de execução por etapas
10. orcamento: Orçamento (itens e valores informados pela pessoa)
11. revisao_final: Revisão final consolidada

CONDUÇÃO DA CONVERSA:
- Se a resposta da pessoa for incompleta para a etapa atual, peça o que falta com UMA ÚNICA pergunta.
- Se a pessoa responder dados de várias etapas de uma vez, aproveite todas as informações, atualize as respectivas seções em 'secoes_atualizadas', confirme brevemente e siga para a próxima etapa pendente.
- Se a pessoa quiser alterar uma etapa anterior, atualize a seção correspondente e prossiga.

FORMATO OBRIGATÓRIO DA RESPOSTA:
Sua resposta DEVE ser EXCLUSIVAMENTE um objeto JSON válido, sem texto fora do JSON, no seguinte esquema:
{
  "mensagem": "texto acolhedor exibido no chat, contendo NO MÁXIMO UMA pergunta ('?')",
  "etapa_atual": 1,
  "secoes_atualizadas": {
    "edital_politica": "texto redigido...",
    "ideia_projeto": "texto redigido...",
    "tipo_proponente": "...",
    "objetivo_principal": "...",
    "publico_territorio": "...",
    "atividades_metodologia": "...",
    "acessibilidade": "...",
    "contrapartida_social": "...",
    "cronograma": "...",
    "orcamento": "...",
    "revisao_final": "..."
  },
  "fontes_citadas": [
    { "documento": "Nome oficial do documento", "trecho": "Artigo ou item" }
  ],
  "pendencias": [
    "item pendente se houver"
  ]
}
"""


def sanitize_api_key(text: str, api_key: str = "") -> str:
    """Remove qualquer menção a chaves de API para prevenir vazamento em logs e respostas."""
    if not text:
        return ""
    sanitized = text
    if api_key and len(api_key) > 4:
        sanitized = sanitized.replace(api_key, "[CHAVE_OCULTA]")
    sanitized = re.sub(r'AIza[0-9A-Za-z-_]{35}', '[CHAVE_OCULTA]', sanitized)
    sanitized = re.sub(r'key=[^&\s"\']+', 'key=[CHAVE_OCULTA]', sanitized)
    return sanitized


def normalizar_uma_pergunta(texto: str) -> str:
    """Garante a regra inegociável de no máximo uma pergunta (no máximo um '?')."""
    if not texto or texto.count('?') <= 1:
        return texto

    # Divide em sentenças preservando os delimitadores de pontuação
    frases = re.split(r'([.!?]+)', texto)
    partes = []
    total_interrogacoes = texto.count('?')
    vistas = 0
    i = 0
    while i < len(frases):
        pedaco = frases[i]
        delimitador = frases[i+1] if i + 1 < len(frases) else ""
        i += 2
        if '?' in delimitador:
            vistas += 1
            if vistas < total_interrogacoes:
                delimitador = delimitador.replace('?', '.')
        partes.append(pedaco + delimitador)

    return "".join(partes).strip()


def obter_contexto_factual_viamao(user_query: str = "") -> str:
    """
    Coleta dados factuais em tempo real das APIs públicas integradas
    (PNAB, LPG Transferegov e Emendas) sem nenhum valor numérico fixo ou fallback fictício.
    """
    context_parts = []
    user_query_lower = (user_query or "").lower()

    # Contexto PNAB
    if any(k in user_query_lower for k in ["pnab", "aldir blanc", "14.399", "projeto", "edital"]):
        context_parts.append(
            "- PNAB Viamão (Lei nº 14.399/2022): Os valores e termos de adesão oficiais de Viamão devem ser consultados diretamente no Painel Oficial do Ministério da Cultura (MinC) integrado a esta plataforma."
        )

    # Contexto LPG (Consulta Transferegov real)
    if any(k in user_query_lower for k in ["lpg", "paulo gustavo", "audiovisual", "195", "cinema", "vídeo"]):
        try:
            api_lpg = TransferegovApi()
            plano = api_lpg.buscar_plano_acao_lpg(cnpj="88000914000101")
            if plano and isinstance(plano, dict) and plano.get("valor_total_repasse") is not None:
                v_repasse = plano["valor_total_repasse"]
                context_parts.append(
                    f"- Lei Paulo Gustavo Viamão (LPG - LC nº 195/2022): Plano de Ação Transferegov com valor total de repasse registrado de R$ {v_repasse:,.2f}."
                )
            else:
                context_parts.append(
                    "- Lei Paulo Gustavo Viamão (LPG - LC nº 195/2022): Informação sobre valor total de repasse não disponível no momento na consulta do Transferegov."
                )
        except Exception as e:
            logger.warning(f"Consulta de LPG no Transferegov falhou: {e}")
            context_parts.append(
                "- Lei Paulo Gustavo Viamão (LPG - LC nº 195/2022): Informação sobre valor total de repasse não disponível no momento na consulta do Transferegov."
            )

    # Contexto Emendas Parlamentares (consulta real com filtro territorial de Viamão)
    if any(k in user_query_lower for k in ["emenda", "parlamentar", "deputad", "verba", "recurso", "orçamento"]):
        try:
            from backend.apis import CguEmendasApi
            cgu = CguEmendasApi()
            emendas = cgu.buscar_emendas_municipio(codigo_ibge="4323002", funcao="13")
            if emendas and len(emendas) > 0:
                total_emendas = sum(e.get("valor_pago", 0) or e.get("valor_empenhado", 0) for e in emendas)
                context_parts.append(
                    f"- Emendas Parlamentares para Cultura em Viamão/RS: {len(emendas)} emenda(s) monitorada(s) pela CGU para o território de Viamão na Função Cultura, somando R$ {total_emendas:,.2f}."
                )
            else:
                context_parts.append(
                    "- Emendas Parlamentares para Cultura em Viamão/RS: Nenhuma emenda específica para Cultura localizada no momento para o município no Portal da Transparência."
                )
        except Exception as e:
            logger.warning(f"Consulta de emendas da CGU falhou: {e}")

    if not context_parts:
        context_parts.append(
            "- Base Territorial: Município de Viamão/RS. Políticas culturais acompanhadas: PNAB, LPG, Emendas Parlamentares e Editais Municipais."
        )

    return (
        "\n\n=== DADOS FACTUAIS REAIS DO SISTEMA DE VIAMÃO/RS ===\n"
        + "\n".join(context_parts)
        + "\nAVISO FUNDAMENTAL: Estes valores representam o montante global de recursos transferidos ao ente público municipal e NÃO indicam quanto cada projeto cultural individual pode ou deve receber. Você NÃO deve sugerir nem arbitrar valores de projetos para o proponente.\n"
    )


def obter_contexto_factual_com_timeout(user_query: str = "", timeout: float = 2.0) -> str:
    """Executa a coleta de contexto com limite estrito de timeout (máximo 2.0s)."""
    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(obter_contexto_factual_viamao, user_query)
        try:
            return future.result(timeout=timeout)
        except concurrent.futures.TimeoutError:
            logger.warning(f"Coleta de contexto factual excedeu limite de {timeout}s; prosseguindo sem enriquecimento.")
            return ""
        except Exception as e:
            logger.warning(f"Erro ao obter contexto factual: {e}")
            return ""


def validar_e_extrair_resposta_estruturada(raw_text: str) -> Optional[Dict[str, Any]]:
    """Valida se o texto retornado pelo modelo é um JSON compatível com o schema do assistente."""
    if not raw_text or not raw_text.strip():
        return None

    limpo = raw_text.strip()
    if limpo.startswith("```"):
        limpo = re.sub(r"^```(?:json)?\s*", "", limpo, flags=re.IGNORECASE)
        limpo = re.sub(r"\s*```$", "", limpo)
        limpo = limpo.strip()

    try:
        data = json.loads(limpo)
    except Exception:
        match = re.search(r'\{.*\}', limpo, re.DOTALL)
        if match:
            try:
                data = json.loads(match.group(0))
            except Exception:
                return None
        else:
            return None

    if not isinstance(data, dict):
        return None

    if "mensagem" not in data or not isinstance(data["mensagem"], str):
        return None

    etapa = data.get("etapa_atual", 1)
    try:
        etapa_int = int(etapa)
        if etapa_int < 1:
            etapa_int = 1
        elif etapa_int > 11:
            etapa_int = 11
        data["etapa_atual"] = etapa_int
    except (ValueError, TypeError):
        data["etapa_atual"] = 1

    if "secoes_atualizadas" not in data or not isinstance(data["secoes_atualizadas"], dict):
        data["secoes_atualizadas"] = {}

    if "fontes_citadas" not in data or not isinstance(data["fontes_citadas"], list):
        data["fontes_citadas"] = []

    if "pendencias" not in data or not isinstance(data["pendencias"], list):
        data["pendencias"] = []

    data["mensagem"] = normalizar_uma_pergunta(data["mensagem"])
    return data


class handler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # Suprime logs padrão do BaseHTTPRequestHandler para usar o logger customizado
        pass

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, x-goog-api-key, X-Requested-With")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Max-Age", "86400")
        self.end_headers()

    def do_GET(self):
        status_info = {
            "servico": "Cultura Transparente - Assistente de IA de Projetos Culturais",
            "endpoint": "/api/chat",
            "status": "online",
            "metodo_esperado": "POST",
            "etapas_suportadas": len(ROTEIRO_ETAPAS),
            "regras": [
                "Uma pergunta por mensagem",
                "Sem valores inventados",
                "Sem cache em memória (privacidade LGPD)"
            ]
        }
        self.send_json_response(200, status_info)

    def do_POST(self):
        start_time = time.time()
        try:
            deadline_seconds = float(os.environ.get("CHAT_DEADLINE_SECONDS", "55"))
        except (ValueError, TypeError):
            deadline_seconds = 55.0

        try:
            attempt_cap_seconds = float(os.environ.get("CHAT_ATTEMPT_TIMEOUT_SECONDS", "25"))
        except (ValueError, TypeError):
            attempt_cap_seconds = 25.0

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

            # NOTA DE PRIVACIDADE LGPD: Cache de respostas foi desativado propositalmente,
            # pois cada conversa contém dados autorais e específicos do projeto da pessoa.

            # Coleta textos do usuário para contextualização factual e conhecimento oficial
            user_texts = [m.get("content", "") for m in messages if m.get("role") == "user"]
            combined_user_text = " ".join(user_texts)

            politica_identificada = identificar_politica(combined_user_text)

            # Estima a etapa atual com base no histórico
            etapa_estimada = 1
            if len(user_texts) >= 1:
                etapa_estimada = min(11, len(user_texts) + 1)

            contexto_conhecimento = extrair_contexto_conhecimento(
                politica=politica_identificada,
                etapa_atual=etapa_estimada,
                user_query=combined_user_text,
                limite_total_caracteres=18000
            )

            contexto_factual = obter_contexto_factual_com_timeout(combined_user_text, timeout=2.0)

            system_instruction_completa = (
                CULTURAL_SYSTEM_PROMPT
                + contexto_conhecimento
                + contexto_factual
            )

            # Formatação para REST da API Gemini
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

            # Payload estruturado com JSON obrigatório
            req_payload = {
                "systemInstruction": {
                    "parts": [{"text": system_instruction_completa}]
                },
                "contents": formatted_contents,
                "generationConfig": {
                    "responseMimeType": "application/json",
                    "thinkingConfig": {
                        "thinkingLevel": "low"
                    }
                }
            }

            candidate_models = [
                "gemini-3.6-flash",
                "gemini-3.5-flash",
                "gemini-3.5-flash-lite",
                "gemini-3.1-flash-lite"
            ]
            models_to_try = list(candidate_models)
            tried_models = set()

            valid_structured_data: Optional[Dict[str, Any]] = None
            raw_response_text = ""
            model_attempts = []

            while models_to_try:
                model_name = models_to_try.pop(0)
                if model_name in tried_models:
                    continue
                tried_models.add(model_name)

                elapsed = time.time() - start_time
                time_left = deadline_seconds - elapsed

                if time_left <= 0.5:
                    logger.warning(f"Prazo global de {deadline_seconds}s esgotado antes de tentar {model_name}.")
                    model_attempts.append({
                        "model": model_name,
                        "status": 408,
                        "error": "Tempo limite de execução atingido (timeout)."
                    })
                    break

                attempt_timeout = max(0.5, min(time_left, attempt_cap_seconds))

                try:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent"
                    data_bytes = json.dumps(req_payload).encode("utf-8")
                    req = urllib.request.Request(
                        url,
                        data=data_bytes,
                        headers={
                            "Content-Type": "application/json",
                            "x-goog-api-key": api_key
                        },
                        method="POST"
                    )

                    with urllib.request.urlopen(req, timeout=attempt_timeout) as response:
                        status_code = getattr(response, "status", getattr(response, "code", 200))
                        if status_code == 200 or status_code is None:
                            res_json = json.loads(response.read().decode("utf-8"))
                            candidates = res_json.get("candidates", [])
                            if candidates and len(candidates) > 0:
                                parts = candidates[0].get("content", {}).get("parts", [])
                                if parts and len(parts) > 0:
                                    raw_response_text = parts[0].get("text", "")
                                    valid_structured_data = validar_e_extrair_resposta_estruturada(raw_response_text)
                                    if valid_structured_data:
                                        break
                                    else:
                                        logger.warning(f"Modelo {model_name} retornou texto não compatível com o schema JSON; tentando próximo modelo.")
                except urllib.error.HTTPError as http_err:
                    error_body = ""
                    try:
                        error_body = http_err.read().decode("utf-8", errors="replace")
                    except Exception:
                        pass
                    sanitized_body = sanitize_api_key(error_body, api_key)
                    err_entry = {
                        "model": model_name,
                        "status": http_err.code,
                        "error": f"HTTP {http_err.code}: {sanitized_body[:200]}"
                    }
                    model_attempts.append(err_entry)
                    logger.warning(f"Failover Gemini ({model_name}): status {http_err.code}")
                except (TimeoutError, urllib.error.URLError, socket.timeout) as ex:
                    is_timeout = isinstance(ex, (TimeoutError, socket.timeout)) or (
                        isinstance(ex, urllib.error.URLError) and (
                            isinstance(getattr(ex, "reason", None), (TimeoutError, socket.timeout))
                            or "timed out" in str(getattr(ex, "reason", "")).lower()
                        )
                    )
                    status_code = 408 if is_timeout else 500
                    error_str = "Tempo limite excedido na requisição ao modelo" if is_timeout else sanitize_api_key(str(ex), api_key)
                    model_attempts.append({
                        "model": model_name,
                        "status": status_code,
                        "error": error_str
                    })
                    logger.warning(f"Failover Gemini ({model_name}): {error_str}")

                    if is_timeout:
                        lite_models = [m for m in models_to_try if "lite" in m and m not in tried_models]
                        other_models = [m for m in models_to_try if "lite" not in m and m not in tried_models]
                        models_to_try = lite_models + other_models
                except Exception as ex:
                    error_str = sanitize_api_key(str(ex), api_key)
                    model_attempts.append({
                        "model": model_name,
                        "status": 500,
                        "error": error_str
                    })
                    logger.warning(f"Failover Gemini ({model_name}): {error_str}")

            if not valid_structured_data:
                # Se obtivemos texto mas falhou validação JSON após tentativas, retorna erro claro sem inventar conteúdo
                if raw_response_text and not valid_structured_data:
                    logger.error("Resposta do modelo não atendeu ao schema estruturado exigido.")
                    self.send_json_response(200, {
                        "success": False,
                        "error": "A resposta do modelo de inteligência artificial não atendeu ao formato estruturado exigido pelo sistema.",
                        "code": "INVALID_STRUCTURED_RESPONSE"
                    })
                    return

                logger.error("Todos os modelos Gemini falharam ou tempo limite foi atingido.")
                self.send_json_response(200, {
                    "success": False,
                    "error": "Os servidores de inteligência artificial estão temporariamente indisponíveis. Por favor, tente novamente em alguns instantes.",
                    "code": "AI_MODELS_UNAVAILABLE",
                    "details": model_attempts
                })
                return

            # Garante formato consistente de retorno estruturado e compatibilidade com campo text
            self.send_json_response(200, {
                "success": True,
                "data": valid_structured_data,
                "text": valid_structured_data.get("mensagem", "")
            })

        except Exception as e:
            sanitized_e = sanitize_api_key(str(e), os.environ.get("GEMINI_API_KEY", ""))
            logger.error(f"Exceção fatal no endpoint /api/chat: {sanitized_e}")
            self.send_json_response(500, {
                "success": False,
                "error": f"Erro interno ao processar requisição: {sanitized_e}",
                "code": "INTERNAL_SERVER_ERROR"
            })

    def send_json_response(self, status_code: int, data: dict):
        payload = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def send_error_response(self, status_code: int, message: str):
        self.send_json_response(status_code, {
            "success": False,
            "error": message
        })
