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


if __name__ == "__main__":
    unittest.main()
