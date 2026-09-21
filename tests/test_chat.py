"""=============================================================================
TESTES UNITÁRIOS E DE INTEGRAÇÃO DO ASSISTENTE DE IA (api/chat.py)
Módulo: tests/test_chat.py
=============================================================================
Valida o funcionamento do endpoint serverless /api/chat:
- Obtenção e injeção do contexto factual de Viamão (PNAB, LPG, Emendas)
- Validação de payload e tratamento de requisições inválidas
- Tratamento de ausência da chave GEMINI_API_KEY
- Chamada bem-sucedida e formatação de resposta
- Mecanismo de cache de prompts
- Failover entre múltiplos modelos Gemini
"""

import unittest
import json
import os
from io import BytesIO
from unittest.mock import MagicMock, patch

from api.chat import handler as ChatHandler, obter_contexto_factual_viamao
from backend.utils import cache


def invoke_post_handler(handler_class, path: str, json_body: dict):
    """Executa o handler HTTP simulando uma requisição POST real."""
    h = handler_class.__new__(handler_class)
    h.command = "POST"
    h.path = path
    h.request_version = "HTTP/1.1"
    h.requestline = f"POST {path} HTTP/1.1"
    h.client_address = ("127.0.0.1", 8000)
    
    body_bytes = json.dumps(json_body).encode("utf-8")
    h.rfile = BytesIO(body_bytes)
    h.wfile = BytesIO()
    h.headers = {
        "Content-Length": str(len(body_bytes)),
        "Content-Type": "application/json"
    }
    h._headers_buffer = []

    h.do_POST()

    raw_output = h.wfile.getvalue()
    parts = raw_output.split(b"\r\n\r\n", 1)
    header_str = parts[0].decode("utf-8", errors="replace")
    status_line = header_str.splitlines()[0] if header_str else ""
    body_data = json.loads(parts[1].decode("utf-8")) if len(parts) > 1 else {}
    return status_line, body_data


class TestChatEndpoint(unittest.TestCase):

    def setUp(self):
        cache.clear()

    def test_contexto_factual_viamao_injection(self):
        """Valida que o contexto factual de Viamão é extraído com dados de PNAB, LPG e Emendas."""
        with patch("api.chat.TransferegovApi") as mock_api_cls:
            mock_inst = MagicMock()
            mock_inst.buscar_termo_adesao_pnab.return_value = {
                "valor_total_previsto": 1756598.0,
                "situacao_termo_adesao": "Assinado",
                "numero_termo_adesao": "0514/2023"
            }
            mock_inst.buscar_plano_acao_lpg.return_value = {
                "valor_total": 2049000.0,
                "situacao_plano_acao": "Homologado"
            }
            mock_api_cls.return_value = mock_inst

            contexto = obter_contexto_factual_viamao("Quero inscrever projeto cultural na PNAB e LPG em Viamão")

            self.assertIn("Viamão", contexto)
            self.assertIn("1.756.598,00", contexto)
            self.assertIn("2,049,000.00", contexto)
            self.assertIn("PNAB", contexto)
            self.assertIn("LPG", contexto)

    def test_chat_missing_messages(self):
        """Valida que requisição sem 'messages' retorna HTTP 400 com mensagem explicativa."""
        status_line, body = invoke_post_handler(ChatHandler, "/api/chat", {})
        self.assertIn("400 Bad Request", status_line)
        self.assertFalse(body.get("success"))
        self.assertIn("messages", body.get("error", ""))

    def test_chat_empty_messages_list(self):
        """Valida que requisição com lista 'messages' vazia retorna HTTP 400."""
        status_line, body = invoke_post_handler(ChatHandler, "/api/chat", {"messages": []})
        self.assertIn("400 Bad Request", status_line)
        self.assertFalse(body.get("success"))

    @patch.dict(os.environ, {}, clear=True)
    def test_chat_missing_gemini_api_key(self):
        """Valida que ausência de GEMINI_API_KEY retorna erro explicativo com código MISSING_GEMINI_API_KEY."""
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
        self.assertIn("GEMINI_API_KEY", body.get("error", ""))

    @patch.dict(os.environ, {"GEMINI_API_KEY": "fake_test_key"})
    @patch("api.chat.TransferegovApi")
    @patch("api.chat.urllib.request.urlopen")
    def test_chat_successful_generation(self, mock_urlopen, mock_transferegov_cls):
        """Valida chamada com sucesso à API do Gemini e retorno de texto gerado."""
        mock_response = MagicMock()
        mock_response.__enter__.return_value = mock_response
        mock_response.status = 200
        mock_response.code = 200
        mock_response.read.return_value = json.dumps({
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {"text": "Olá! Sou o Consultor de Projetos Culturais de Viamão. Como posso ajudar seu projeto?"}
                        ]
                    }
                }
            ]
        }).encode("utf-8")
        mock_urlopen.return_value = mock_response

        status_line, body = invoke_post_handler(
            ChatHandler,
            "/api/chat",
            {"messages": [{"role": "user", "content": "Quero fazer uma oficina de hip hop em Viamão."}]}
        )

        self.assertIn("200 OK", status_line)
        self.assertTrue(body.get("success"))
        self.assertIn("Consultor de Projetos Culturais de Viamão", body.get("text"))
        self.assertFalse(body.get("cached", False))

    @patch.dict(os.environ, {"GEMINI_API_KEY": "fake_test_key"})
    @patch("api.chat.TransferegovApi")
    @patch("api.chat.urllib.request.urlopen")
    def test_chat_caching_mechanism(self, mock_urlopen, mock_transferegov_cls):
        """Valida que prompts idênticos são servidos via cache na segunda chamada."""
        mock_response = MagicMock()
        mock_response.__enter__.return_value = mock_response
        mock_response.status = 200
        mock_response.code = 200
        mock_response.read.return_value = json.dumps({
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {"text": "Resposta sobre critérios da PNAB em Viamão."}
                        ]
                    }
                }
            ]
        }).encode("utf-8")
        mock_urlopen.return_value = mock_response

        payload = {"messages": [{"role": "user", "content": "Quais são os critérios da PNAB?"}]}

        # Primeira chamada (MISS)
        status_line_1, body_1 = invoke_post_handler(ChatHandler, "/api/chat", payload)
        self.assertIn("200 OK", status_line_1)
        self.assertFalse(body_1.get("cached", False))
        self.assertEqual(mock_urlopen.call_count, 1)

        # Segunda chamada (HIT)
        status_line_2, body_2 = invoke_post_handler(ChatHandler, "/api/chat", payload)
        self.assertIn("200 OK", status_line_2)
        self.assertTrue(body_2.get("cached", True))
        self.assertEqual(body_2.get("text"), "Resposta sobre critérios da PNAB em Viamão.")
        # Garante que urlopen não foi chamado novamente
        self.assertEqual(mock_urlopen.call_count, 1)

    @patch.dict(os.environ, {"GEMINI_API_KEY": "fake_test_key"})
    @patch("api.chat.TransferegovApi")
    @patch("api.chat.urllib.request.urlopen")
    def test_chat_model_failover(self, mock_urlopen, mock_transferegov_cls):
        """Valida failover automático quando o primeiro modelo falha."""
        import urllib.error

        # Primeiro modelo falha (HTTP 503 Service Unavailable), segundo tem sucesso
        mock_success = MagicMock()
        mock_success.__enter__.return_value = mock_success
        mock_success.status = 200
        mock_success.code = 200
        mock_success.read.return_value = json.dumps({
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {"text": "Resposta gerada com sucesso após failover!"}
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
            {"messages": [{"role": "user", "content": "Preciso de ajuda com planilha orçamentária."}]}
        )

        self.assertIn("200 OK", status_line)
        self.assertTrue(body.get("success"))
        self.assertEqual(body.get("text"), "Resposta gerada com sucesso após failover!")
        self.assertEqual(mock_urlopen.call_count, 2)

    @patch.dict(os.environ, {"GEMINI_API_KEY": "fake_test_key"})
    @patch("api.chat.TransferegovApi")
    @patch("api.chat.urllib.request.urlopen")
    def test_failover_404_then_success(self, mock_urlopen, mock_transferegov_cls):
        """Simula primeiro modelo falhando com 404 e segundo respondendo com sucesso."""
        import urllib.error

        mock_err_404 = urllib.error.HTTPError(
            url="https://api",
            code=404,
            msg="Not Found",
            hdrs={},
            fp=BytesIO(b'{"error": "models/gemini-3.6-flash is not found"}')
        )

        mock_success = MagicMock()
        mock_success.__enter__.return_value = mock_success
        mock_success.status = 200
        mock_success.code = 200
        mock_success.read.return_value = json.dumps({
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {"text": "Projeto estruturado com sucesso pelo modelo de contingência!"}
                        ]
                    }
                }
            ]
        }).encode("utf-8")

        mock_urlopen.side_effect = [mock_err_404, mock_success]

        status_line, body = invoke_post_handler(
            ChatHandler,
            "/api/chat",
            {"messages": [{"role": "user", "content": "Como criar cronograma para edital?"}]}
        )

        self.assertIn("200 OK", status_line)
        self.assertTrue(body.get("success"))
        self.assertEqual(body.get("text"), "Projeto estruturado com sucesso pelo modelo de contingência!")
        self.assertEqual(mock_urlopen.call_count, 2)

    @patch.dict(os.environ, {"GEMINI_API_KEY": "fake_test_key"})
    @patch("api.chat.TransferegovApi")
    @patch("api.chat.urllib.request.urlopen")
    def test_all_models_fail_429(self, mock_urlopen, mock_transferegov_cls):
        """Simula todos os modelos falhando com 429 (quota excedida)."""
        import urllib.error

        def make_429_err(model_name):
            return urllib.error.HTTPError(
                url=f"https://api/{model_name}",
                code=429,
                msg="Too Many Requests",
                hdrs={},
                fp=BytesIO(b'{"error": "Resource has been exhausted (e.g. check quota)"}')
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
        self.assertIsInstance(body.get("details"), list)
        self.assertEqual(len(body.get("details")), 4)
        for detail in body.get("details"):
            self.assertEqual(detail["status"], 429)
            self.assertIn("429", detail["error"])

    @patch.dict(os.environ, {"GEMINI_API_KEY": "fake_test_key", "CHAT_DEADLINE_SECONDS": "8.5"})
    @patch("api.chat.TransferegovApi")
    @patch("api.chat.urllib.request.urlopen")
    @patch("api.chat.time.time")
    def test_timeout_exhausted_before_last_model(self, mock_time, mock_urlopen, mock_transferegov_cls):
        """Simula esgotamento do tempo global antes de tentar todos os modelos."""
        import urllib.error

        call_count = {"count": 0}
        def dynamic_time():
            call_count["count"] += 1
            if call_count["count"] <= 2:
                return 1000.0
            return 1008.2  # Após primeira tentativa, simula que 8.2s já se passaram (saldo 0.3s <= 0.5s)

        mock_time.side_effect = dynamic_time

        # Primeiro modelo falha com 500
        mock_urlopen.side_effect = [
            urllib.error.HTTPError(
                url="https://api/gemini-3.6-flash",
                code=500,
                msg="Internal Error",
                hdrs={},
                fp=BytesIO(b'{"error": "Internal server error"}')
            )
        ]

        status_line, body = invoke_post_handler(
            ChatHandler,
            "/api/chat",
            {"messages": [{"role": "user", "content": "Consultar edital com pressa"}]}
        )

        self.assertIn("200 OK", status_line)
        self.assertFalse(body.get("success"))
        self.assertEqual(body.get("code"), "AI_MODELS_UNAVAILABLE")
        self.assertIsInstance(body.get("details"), list)

        # O segundo modelo registrado deve ser por timeout (408)
        timeout_details = [d for d in body.get("details") if d.get("status") == 408]
        self.assertTrue(len(timeout_details) >= 1)
        self.assertIn("timeout", timeout_details[0]["error"].lower())

    @patch.dict(os.environ, {"GEMINI_API_KEY": "fake_test_key"})
    @patch("api.chat.TransferegovApi")
    @patch("api.chat.urllib.request.urlopen")
    def test_first_attempt_timeout_failover_to_lite_model(self, mock_urlopen, mock_transferegov_cls):
        """Valida que quando a primeira tentativa estoura o teto (timeout), o failover vai direto para o modelo lite."""
        import socket

        mock_success = MagicMock()
        mock_success.__enter__.return_value = mock_success
        mock_success.status = 200
        mock_success.code = 200
        mock_success.read.return_value = json.dumps({
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {"text": "Resposta rápida do modelo lite após timeout!"}
                        ]
                    }
                }
            ]
        }).encode("utf-8")

        # 1ª tentativa estoura timeout no gemini-3.6-flash
        # 2ª tentativa deve ser chamada com modelo lite (gemini-3.5-flash-lite)
        mock_urlopen.side_effect = [
            socket.timeout("The read operation timed out"),
            mock_success
        ]

        status_line, body = invoke_post_handler(
            ChatHandler,
            "/api/chat",
            {"messages": [{"role": "user", "content": "Preciso de ajuda urgente com o projeto"}]}
        )

        self.assertIn("200 OK", status_line)
        self.assertTrue(body.get("success"))
        self.assertEqual(body.get("text"), "Resposta rápida do modelo lite após timeout!")
        self.assertEqual(mock_urlopen.call_count, 2)

        # Inspeciona as URLs das chamadas
        first_call_req = mock_urlopen.call_args_list[0][0][0]
        second_call_req = mock_urlopen.call_args_list[1][0][0]

        self.assertIn("gemini-3.6-flash", first_call_req.full_url)
        self.assertIn("gemini-3.5-flash-lite", second_call_req.full_url)

    @patch.dict(os.environ, {
        "GEMINI_API_KEY": "fake_test_key",
        "CHAT_DEADLINE_SECONDS": "40",
        "CHAT_ATTEMPT_TIMEOUT_SECONDS": "18"
    })
    @patch("api.chat.TransferegovApi")
    @patch("api.chat.urllib.request.urlopen")
    def test_env_vars_override_deadlines(self, mock_urlopen, mock_transferegov_cls):
        """Valida que as variáveis de ambiente CHAT_DEADLINE_SECONDS e CHAT_ATTEMPT_TIMEOUT_SECONDS alteram os prazos."""
        mock_response = MagicMock()
        mock_response.__enter__.return_value = mock_response
        mock_response.status = 200
        mock_response.code = 200
        mock_response.read.return_value = json.dumps({
            "candidates": [{"content": {"parts": [{"text": "OK"}]}}]
        }).encode("utf-8")
        mock_urlopen.return_value = mock_response

        status_line, body = invoke_post_handler(
            ChatHandler,
            "/api/chat",
            {"messages": [{"role": "user", "content": "Verificar timeout customizado"}]}
        )

        self.assertIn("200 OK", status_line)
        self.assertTrue(body.get("success"))

        # Inspeciona o timeout passado na chamada ao urlopen
        passed_timeout = mock_urlopen.call_args[1].get("timeout")
        self.assertIsNotNone(passed_timeout)
        # O timeout deve ser limitado pelo teto de tentativa configurado (18.0s)
        self.assertAlmostEqual(passed_timeout, 18.0, delta=0.5)

    @patch.dict(os.environ, {"GEMINI_API_KEY": "fake_test_key"})
    @patch("api.chat.TransferegovApi")
    @patch("api.chat.urllib.request.urlopen")
    def test_payload_thinking_config_normal_vs_consolidation(self, mock_urlopen, mock_transferegov_cls):
        """Valida thinkingLevel low em mensagens normais e medium na consolidação, sem campos proibidos."""
        mock_response = MagicMock()
        mock_response.__enter__.return_value = mock_response
        mock_response.status = 200
        mock_response.code = 200
        mock_response.read.return_value = json.dumps({
            "candidates": [{"content": {"parts": [{"text": "Resposta OK"}]}}]
        }).encode("utf-8")
        mock_urlopen.return_value = mock_response

        # 1. Mensagem normal -> thinkingLevel deve ser 'low'
        status_line, body = invoke_post_handler(
            ChatHandler,
            "/api/chat",
            {"messages": [{"role": "user", "content": "Como funciona a PNAB em Viamão?"}]}
        )
        self.assertIn("200 OK", status_line)
        req_obj_1 = mock_urlopen.call_args[0][0]
        payload_1 = json.loads(req_obj_1.data.decode("utf-8"))

        self.assertIn("generationConfig", payload_1)
        gen_cfg_1 = payload_1["generationConfig"]
        self.assertEqual(gen_cfg_1.get("thinkingConfig", {}).get("thinkingLevel"), "low")
        self.assertNotIn("thinkingBudget", gen_cfg_1.get("thinkingConfig", {}))
        self.assertNotIn("temperature", gen_cfg_1)
        self.assertNotIn("top_p", gen_cfg_1)
        self.assertNotIn("top_k", gen_cfg_1)

        # 2. Mensagem de consolidação final -> thinkingLevel deve ser 'medium'
        cache.clear()
        status_line_2, body_2 = invoke_post_handler(
            ChatHandler,
            "/api/chat",
            {"messages": [
                {"role": "user", "content": "Tenho todos os dados"},
                {"role": "assistant", "content": "Excelente"},
                {"role": "user", "content": "Terminei de responder, por favor gere o [PROJETO_FINAL] consolidado."}
            ]}
        )
        self.assertIn("200 OK", status_line_2)
        req_obj_2 = mock_urlopen.call_args[0][0]
        payload_2 = json.loads(req_obj_2.data.decode("utf-8"))

        self.assertIn("generationConfig", payload_2)
        gen_cfg_2 = payload_2["generationConfig"]
        self.assertEqual(gen_cfg_2.get("thinkingConfig", {}).get("thinkingLevel"), "medium")
        self.assertNotIn("thinkingBudget", gen_cfg_2.get("thinkingConfig", {}))
        self.assertNotIn("temperature", gen_cfg_2)
        self.assertNotIn("top_p", gen_cfg_2)
        self.assertNotIn("top_k", gen_cfg_2)


if __name__ == "__main__":
    unittest.main()
