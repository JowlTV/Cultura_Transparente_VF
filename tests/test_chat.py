"""=============================================================================
CULTURA TRANSPARENTE - SUÍTE DE TESTES UNITÁRIOS DO CHAT DE IA
Arquivo: tests/test_chat.py
=============================================================================
Testes automatizados cobrindo:
1. Respostas do assistente contêm no máximo um ponto de interrogação ('?');
2. Validação e rejeição de JSON de resposta estruturada quando inválido;
3. Contexto factual sem nenhum valor fixo/fictício;
4. Leitura correta do campo 'valor_total_repasse' da Lei Paulo Gustavo (LPG);
5. Tratamento de informação não encontrada nos documentos oficiais da base;
6. Desativação de cache para conformidade com privacidade e LGPD;
7. Failover automático entre modelos Gemini e respeito a prazos de timeout.
"""

import unittest
from unittest.mock import patch, MagicMock
import json
import os
import sys
from io import BytesIO

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from api.chat import (
    handler as ChatHandler,
    obter_contexto_factual_viamao,
    validar_e_extrair_resposta_estruturada,
    normalizar_uma_pergunta,
    ROTEIRO_ETAPAS
)


def invoke_post_handler(handler_cls, path, payload, headers=None):
    """Auxiliar para simular requisição HTTP POST no handler serverless BaseHTTPRequestHandler."""
    body_bytes = json.dumps(payload).encode("utf-8")
    req_headers = {
        "Content-Type": "application/json",
        "Content-Length": str(len(body_bytes))
    }
    if headers:
        req_headers.update(headers)

    class MockSocket:
        def makefile(self, mode="r", buffering=-1):
            if "b" in mode:
                if "w" in mode or "+" in mode:
                    return BytesIO()
                return BytesIO(body_bytes)
            return BytesIO(body_bytes)

    handler = handler_cls.__new__(handler_cls)
    handler.rfile = BytesIO(body_bytes)
    handler.wfile = BytesIO()
    handler.headers = req_headers
    handler.path = path
    handler.command = "POST"
    handler.request_version = "HTTP/1.1"
    handler.requestline = f"POST {path} HTTP/1.1"

    handler.do_POST()

    handler.wfile.seek(0)
    raw_response = handler.wfile.read().decode("utf-8")

    lines = raw_response.split("\r\n")
    status_line = lines[0] if lines else ""

    body_idx = -1
    for i, line in enumerate(lines):
        if line == "":
            body_idx = i + 1
            break

    body_str = "\r\n".join(lines[body_idx:]) if body_idx != -1 else ""
    parsed_json = {}
    if body_str.strip():
        try:
            parsed_json = json.loads(body_str.strip())
        except Exception:
            parsed_json = {"raw": body_str}

    return status_line, parsed_json


class TestChatEndpoint(unittest.TestCase):

    def test_contexto_factual_sem_valores_fixos(self):
        """Valida que o contexto factual de Viamão NÃO contém nenhum valor fixo/fictício."""
        with patch("api.chat.TransferegovApi") as mock_api_cls:
            mock_inst = MagicMock()
            mock_inst.buscar_plano_acao_lpg.return_value = {
                "valor_total_repasse": 2046951.79,
                "situacao_plano_acao": "Homologado"
            }
            mock_api_cls.return_value = mock_inst

            contexto = obter_contexto_factual_viamao("Quero inscrever projeto cultural na PNAB e LPG em Viamão")

            self.assertIn("Viamão", contexto)
            # Confirma que valores fixos antigos foram totalmente banidos
            self.assertNotIn("1756598", contexto)
            self.assertNotIn("1.756.598", contexto)
            self.assertNotIn("2029083", contexto)
            self.assertNotIn("2.029.083", contexto)
            self.assertNotIn("1444301", contexto)
            self.assertNotIn("584781", contexto)

            # Confirma que PNAB indica o Painel Oficial do MinC
            self.assertIn("Ministério da Cultura (MinC)", contexto)

    def test_leitura_correta_valor_total_repasse_lpg(self):
        """Valida que o campo lido do Transferegov para LPG é 'valor_total_repasse'."""
        with patch("api.chat.TransferegovApi") as mock_api_cls:
            mock_inst = MagicMock()
            mock_inst.buscar_plano_acao_lpg.return_value = {
                "valor_total_repasse": 2046951.79,
                "situacao_plano_acao": "Homologado"
            }
            mock_api_cls.return_value = mock_inst

            contexto = obter_contexto_factual_viamao("Qual o valor da Lei Paulo Gustavo?")

            self.assertIn("2,046,951.79", contexto)
            self.assertIn("LPG", contexto)
            self.assertIn("Transferegov", contexto)

    def test_mensagens_maximo_uma_pergunta(self):
        """Valida a regra de no máximo um ponto de interrogação por mensagem."""
        texto_duas_perguntas = "Olá! Qual é a sua ideia para o projeto cultural? Onde ele será realizado?"
        normalizado = normalizar_uma_pergunta(texto_duas_perguntas)

        self.assertLessEqual(normalizado.count("?"), 1)
        self.assertEqual(normalizado.count("?"), 1)
        self.assertTrue(normalizado.endswith("?"))

        texto_sem_pergunta = "Aqui está o resumo do seu projeto até o momento."
        self.assertEqual(normalizar_uma_pergunta(texto_sem_pergunta).count("?"), 0)

    def test_validacao_json_resposta_estruturada(self):
        """Valida que o JSON retornado pelo modelo é validado e campos são normalizados."""
        payload_valido = json.dumps({
            "mensagem": "Excelente ideia! Quem será o público-alvo do seu projeto cultural?",
            "etapa_atual": 5,
            "secoes_atualizadas": {
                "publico_territorio": "Comunidade do bairro Tarumã em Viamão/RS."
            },
            "fontes_citadas": [
                {"documento": "Lei nº 14.399/2022", "trecho": "Art. 5º"}
            ],
            "pendencias": []
        })

        resultado = validar_e_extrair_resposta_estruturada(payload_valido)
        self.assertIsNotNone(resultado)
        self.assertEqual(resultado["etapa_atual"], 5)
        self.assertEqual(resultado["mensagem"].count("?"), 1)
        self.assertIn("publico_territorio", resultado["secoes_atualizadas"])
        self.assertEqual(len(resultado["fontes_citadas"]), 1)

    def test_rejeicao_json_invalido(self):
        """Valida que textos com JSON malformado ou campos obrigatórios ausentes são rejeitados."""
        self.assertIsNone(validar_e_extrair_resposta_estruturada("isso não é um json"))
        self.assertIsNone(validar_e_extrair_resposta_estruturada("{ chave_sem_fechar: "))
        self.assertIsNone(validar_e_extrair_resposta_estruturada(json.dumps({"sem_mensagem": 123})))
        self.assertIsNone(validar_e_extrair_resposta_estruturada(""))

    def test_informacao_nao_encontrada_na_base(self):
        """Valida que a instrução de sistema instrui explicitamente a resposta oficial para ausência de dados."""
        from api.chat import CULTURAL_SYSTEM_PROMPT
        self.assertIn("Não encontrei essa informação nos documentos oficiais disponíveis", CULTURAL_SYSTEM_PROMPT)
        self.assertIn("UMA PERGUNTA POR MENSAGEM", CULTURAL_SYSTEM_PROMPT)
        self.assertIn("NÃO DEFINIR VALORES PARA A PESSOA", CULTURAL_SYSTEM_PROMPT)

    def test_chat_missing_messages(self):
        """Valida que requisição sem 'messages' retorna HTTP 400."""
        status_line, body = invoke_post_handler(ChatHandler, "/api/chat", {})
        self.assertIn("400 Bad Request", status_line)
        self.assertFalse(body.get("success"))

    def test_chat_empty_messages_list(self):
        """Valida que requisição com lista 'messages' vazia retorna HTTP 400."""
        status_line, body = invoke_post_handler(ChatHandler, "/api/chat", {"messages": []})
        self.assertIn("400 Bad Request", status_line)
        self.assertFalse(body.get("success"))

    @patch.dict(os.environ, {}, clear=True)
    def test_chat_missing_gemini_api_key(self):
        """Valida que ausência de GEMINI_API_KEY retorna código MISSING_GEMINI_API_KEY."""
        if "GEMINI_API_KEY" in os.environ:
            del os.environ["GEMINI_API_KEY"]

        status_line, body = invoke_post_handler(
            ChatHandler,
            "/api/chat",
            {"messages": [{"role": "user", "content": "Olá!"}]}
        )
        self.assertIn("200 OK", status_line)
        self.assertFalse(body.get("success"))
        self.assertEqual(body.get("code"), "MISSING_GEMINI_API_KEY")

    @patch.dict(os.environ, {"GEMINI_API_KEY": "fake_test_key"})
    @patch("api.chat.TransferegovApi")
    @patch("api.chat.urllib.request.urlopen")
    def test_chat_successful_structured_generation(self, mock_urlopen, mock_transferegov_cls):
        """Valida chamada com sucesso e resposta estruturada contendo no máximo uma pergunta."""
        mock_response = MagicMock()
        mock_response.__enter__.return_value = mock_response
        mock_response.status = 200
        mock_response.code = 200
        mock_response.read.return_value = json.dumps({
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {
                                "text": json.dumps({
                                    "mensagem": "Olá! Para qual edital ou política você deseja preparar seu projeto?",
                                    "etapa_atual": 1,
                                    "secoes_atualizadas": {},
                                    "fontes_citadas": [],
                                    "pendencias": ["Definir política ou edital"]
                                })
                            }
                        ]
                    }
                }
            ]
        }).encode("utf-8")
        mock_urlopen.return_value = mock_response

        status_line, body = invoke_post_handler(
            ChatHandler,
            "/api/chat",
            {"messages": [{"role": "user", "content": "Quero inscrever um projeto cultural."}]}
        )

        self.assertIn("200 OK", status_line)
        self.assertTrue(body.get("success"))
        data = body.get("data", {})
        self.assertEqual(data.get("etapa_atual"), 1)
        self.assertEqual(data.get("mensagem").count("?"), 1)

    @patch.dict(os.environ, {"GEMINI_API_KEY": "fake_test_key"})
    @patch("api.chat.TransferegovApi")
    @patch("api.chat.urllib.request.urlopen")
    def test_sem_cache_de_respostas_lgpd(self, mock_urlopen, mock_transferegov_cls):
        """Valida que duas chamadas idênticas disparam consultas reais sem cache em memória (LGPD)."""
        mock_response = MagicMock()
        mock_response.__enter__.return_value = mock_response
        mock_response.status = 200
        mock_response.code = 200
        mock_response.read.return_value = json.dumps({
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {
                                "text": json.dumps({
                                    "mensagem": "Qual é a ideia do projeto?",
                                    "etapa_atual": 2,
                                    "secoes_atualizadas": {},
                                    "fontes_citadas": [],
                                    "pendencias": []
                                })
                            }
                        ]
                    }
                }
            ]
        }).encode("utf-8")
        mock_urlopen.return_value = mock_response

        payload = {"messages": [{"role": "user", "content": "Projeto de hip hop no Tarumã."}]}

        # Primeira chamada
        invoke_post_handler(ChatHandler, "/api/chat", payload)
        self.assertEqual(mock_urlopen.call_count, 1)

        # Segunda chamada com mesmo payload - DEVE chamar a API novamente, sem cache
        invoke_post_handler(ChatHandler, "/api/chat", payload)
        self.assertEqual(mock_urlopen.call_count, 2)

    @patch.dict(os.environ, {"GEMINI_API_KEY": "fake_test_key"})
    @patch("api.chat.TransferegovApi")
    @patch("api.chat.urllib.request.urlopen")
    def test_chat_model_failover(self, mock_urlopen, mock_transferegov_cls):
        """Valida failover automático quando o primeiro modelo falha."""
        import urllib.error

        mock_success = MagicMock()
        mock_success.__enter__.return_value = mock_success
        mock_success.status = 200
        mock_success.code = 200
        mock_success.read.return_value = json.dumps({
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {
                                "text": json.dumps({
                                    "mensagem": "Qual o objetivo principal do projeto?",
                                    "etapa_atual": 4,
                                    "secoes_atualizadas": {},
                                    "fontes_citadas": [],
                                    "pendencias": []
                                })
                            }
                        ]
                    }
                }
            ]
        }).encode("utf-8")

        mock_urlopen.side_effect = [
            urllib.error.HTTPError(url="https://api", code=503, msg="Service Unavailable", hdrs={}, fp=None),
            mock_success
        ]

        status_line, body = invoke_post_handler(
            ChatHandler,
            "/api/chat",
            {"messages": [{"role": "user", "content": "Definir objetivo"}]}
        )

        self.assertIn("200 OK", status_line)
        self.assertTrue(body.get("success"))
        self.assertEqual(mock_urlopen.call_count, 2)

    @patch.dict(os.environ, {"GEMINI_API_KEY": "fake_test_key"})
    @patch("api.chat.TransferegovApi")
    @patch("api.chat.urllib.request.urlopen")
    def test_all_models_fail_429(self, mock_urlopen, mock_transferegov_cls):
        """Simula todos os modelos falhando com 429."""
        import urllib.error

        def make_429_err(model_name):
            return urllib.error.HTTPError(
                url=f"https://api/{model_name}",
                code=429,
                msg="Too Many Requests",
                hdrs={},
                fp=BytesIO(b'{"error": "Resource exhausted"}')
            )

        mock_urlopen.side_effect = [
            make_429_err("gemini-3.6-flash"),
            make_429_err("gemini-3.5-flash"),
            make_429_err("gemini-3.5-flash-lite"),
            make_429_err("gemini-3.1-flash-lite")
        ]

        status_line, body = invoke_post_handler(
            ChatHandler,
            "/api/chat",
            {"messages": [{"role": "user", "content": "Ajuda com contrapartida social"}]}
        )

        self.assertIn("200 OK", status_line)
        self.assertFalse(body.get("success"))
        self.assertEqual(body.get("code"), "AI_MODELS_UNAVAILABLE")
        self.assertEqual(len(body.get("details", [])), 4)

    @patch.dict(os.environ, {"GEMINI_API_KEY": "fake_test_key"})
    @patch("api.chat.TransferegovApi")
    @patch("api.chat.urllib.request.urlopen")
    def test_rejeicao_quando_modelo_retorna_json_invalido(self, mock_urlopen, mock_transferegov_cls):
        """Valida que se o modelo retornar texto que não é JSON, a resposta é rejeitada com erro estruturado."""
        mock_response = MagicMock()
        mock_response.__enter__.return_value = mock_response
        mock_response.status = 200
        mock_response.code = 200
        mock_response.read.return_value = json.dumps({
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {"text": "Isso com certeza não é um objeto JSON válido."}
                        ]
                    }
                }
            ]
        }).encode("utf-8")
        mock_urlopen.return_value = mock_response

        status_line, body = invoke_post_handler(
            ChatHandler,
            "/api/chat",
            {"messages": [{"role": "user", "content": "Ajuda"}]}
        )

        self.assertIn("200 OK", status_line)
        self.assertFalse(body.get("success"))
        self.assertEqual(body.get("code"), "INVALID_STRUCTURED_RESPONSE")


if __name__ == "__main__":
    unittest.main()
