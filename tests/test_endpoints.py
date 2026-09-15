"""=============================================================================
TESTES DE REGRESSÃO E SMOKE DOS ENDPOINTS SERVERLESS (api/*.py)
Módulo: tests/test_endpoints.py
=============================================================================
Valida a execução ponta a ponta dos handlers HTTP de /api/*.
Previne bugs de sintaxe, imports faltantes (ex: Optional em typing)
e falhas de cola na camada de roteamento/query string.
"""

import unittest
import json
from io import BytesIO
from unittest.mock import MagicMock, patch

from api.index import handler as IndexHandler
from api.lpg import handler as LpgHandler
from api.news import handler as NewsHandler
from api.emendas import handler as EmendasHandler
from backend.models import EmendaRecord
from backend.utils import cache


def invoke_handler(handler_class, path: str):
    """Executa o handler HTTP simulando uma requisição GET real."""
    h = handler_class.__new__(handler_class)
    h.command = "GET"
    h.path = path
    h.request_version = "HTTP/1.1"
    h.requestline = f"GET {path} HTTP/1.1"
    h.client_address = ("127.0.0.1", 8000)
    h.rfile = BytesIO()
    h.wfile = BytesIO()
    h.headers = {}
    h._headers_buffer = []

    h.do_GET()

    raw_output = h.wfile.getvalue()
    parts = raw_output.split(b"\r\n\r\n", 1)
    header_str = parts[0].decode("utf-8", errors="replace")
    status_line = header_str.splitlines()[0] if header_str else ""
    body_data = json.loads(parts[1].decode("utf-8")) if len(parts) > 1 else {}
    return status_line, body_data


class TestEndpoints(unittest.TestCase):

    def setUp(self):
        cache.clear()

    def test_emendas_endpoint_regression_multi_ano_typing(self):
        """
        Teste de regressão crítico:
        Garante que /api/emendas com anos=2024,2025,2026 processa Optional[List[int]]
        e parsing de query string sem NameError ou falha de tipagem.
        """
        mock_cgu = MagicMock()
        mock_cgu.api_key = "fake_cgu_key"
        mock_cgu.buscar_emendas.return_value = [
            EmendaRecord(
                id="FED-2024-001",
                autor="Denise Pessôa",
                partido="PT",
                tipo="Individual",
                ano=2024,
                orgao="Ministério da Cultura",
                esfera="Federal (API CGU)",
                valor=100000.0,
                pago=100000.0,
                status="Pago",
                objeto="Apoio a Coletivos Culturais de Viamão",
                municipio="Viamão",
                is_cultura=True,
                area_atuacao="Cultura"
            )
        ]

        mock_rs = MagicMock()
        mock_rs.buscar_emendas_estaduais.return_value = [
            EmendaRecord(
                id="EST-2025-002",
                autor="Professor Bonatto",
                partido="PSDB",
                tipo="Individual",
                ano=2025,
                orgao="SEDAC/RS",
                esfera="Estadual (CAGE/RS)",
                valor=150000.0,
                pago=0.0,
                status="Empenhado",
                objeto="Restauro e Difusão Cultural de Viamão",
                municipio="Viamão",
                is_cultura=True,
                area_atuacao="Cultura"
            )
        ]

        with patch("api.emendas.CguTransparenciaApi", return_value=mock_cgu) as patched_cgu_cls, \
             patch("api.emendas.PortalTransparenciaRsApi", return_value=mock_rs) as patched_rs_cls:
            status_line, body = invoke_handler(
                EmendasHandler,
                "/api/emendas?anos=2024,2025,2026&esfera=all&apenas_cultura=true"
            )

        # Valida que não houve HTTP 500 nem NameError
        self.assertIn("200 OK", status_line)
        self.assertTrue(body.get("success"))
        self.assertEqual(body.get("anos_consultados"), [2024, 2025, 2026])
        self.assertEqual(body.get("total_emendas"), 2)
        self.assertEqual(body.get("total_cultura"), 2)

        # Valida que anos 2024 e 2025 estão presentes nos resultados retornados
        anos_retornados = {e.get("ano") for e in body.get("emendas", [])}
        self.assertIn(2024, anos_retornados)
        self.assertIn(2025, anos_retornados)

        # Confirma chamadas com argumentos esperados
        mock_cgu.buscar_emendas.assert_called_once_with(anos=[2024, 2025, 2026], codigo_ibge="4323002")
        mock_rs.buscar_emendas_estaduais.assert_called_once_with(municipio="Viamão", anos=[2024, 2025, 2026])

    def test_emendas_endpoint_sem_parametros_padrao(self):
        """Valida chamada padrão /api/emendas sem parâmetros de query string."""
        with patch("api.emendas.CguTransparenciaApi") as mock_cgu_cls, \
             patch("api.emendas.PortalTransparenciaRsApi") as mock_rs_cls:
            mock_cgu = MagicMock()
            mock_cgu.api_key = None  # Modo sem chave
            mock_cgu_cls.return_value = mock_cgu

            mock_rs = MagicMock()
            mock_rs.buscar_emendas_estaduais.return_value = []
            mock_rs_cls.return_value = mock_rs

            status_line, body = invoke_handler(EmendasHandler, "/api/emendas")

        self.assertIn("200 OK", status_line)
        self.assertTrue(body.get("success"))
        self.assertIsNone(body.get("anos_consultados"))
        self.assertIn("federal_cgu", body.get("status_fontes", {}))
        self.assertEqual(body["status_fontes"]["federal_cgu"]["status"], "missing_api_key")

    def test_emendas_endpoint_filtro_esferas(self):
        """Valida que o filtro de esfera (apenas federal ou apenas estadual) funciona."""
        with patch("api.emendas.CguTransparenciaApi") as mock_cgu_cls, \
             patch("api.emendas.PortalTransparenciaRsApi") as mock_rs_cls:
            mock_cgu = MagicMock()
            mock_cgu.api_key = "fake_key"
            mock_cgu.buscar_emendas.return_value = []
            mock_cgu_cls.return_value = mock_cgu

            mock_rs = MagicMock()
            mock_rs.buscar_emendas_estaduais.return_value = []
            mock_rs_cls.return_value = mock_rs

            # Apenas federal
            status_line, body = invoke_handler(EmendasHandler, "/api/emendas?esfera=federal")
            self.assertIn("200 OK", status_line)
            mock_cgu.buscar_emendas.assert_called_once()
            mock_rs.buscar_emendas_estaduais.assert_not_called()

            mock_cgu.buscar_emendas.reset_mock()
            mock_rs.buscar_emendas_estaduais.reset_mock()

            # Apenas estadual
            status_line, body = invoke_handler(EmendasHandler, "/api/emendas?esfera=estadual")
            self.assertIn("200 OK", status_line)
            mock_cgu.buscar_emendas.assert_not_called()
            mock_rs.buscar_emendas_estaduais.assert_called_once()

    def test_emendas_endpoint_camada_seguranca_territorial(self):
        """
        Garante que a camada final de segurança em /api/emendas:
        1. Descarta emendas injetadas que possuam municipio diferente de Viamão
        2. Registra o total de descartes em auditoria_territorial
        """
        mock_cgu = MagicMock()
        mock_cgu.api_key = "fake_key"
        mock_cgu.buscar_emendas.return_value = [
            EmendaRecord(
                id="FED-01",
                autor="Deputado Nacional",
                partido="MDB",
                tipo="Individual",
                ano=2024,
                orgao="MinC",
                esfera="Federal (API CGU)",
                valor=50000.0,
                pago=50000.0,
                status="Pago",
                objeto="Cultura",
                municipio="RS (Abrangência Regional Viamão)",  # Inválido / não-estrito
                is_cultura=True,
                area_atuacao="Cultura"
            ),
            EmendaRecord(
                id="FED-02",
                autor="Deputado Local",
                partido="PT",
                tipo="Individual",
                ano=2024,
                orgao="MinC",
                esfera="Federal (API CGU)",
                valor=80000.0,
                pago=80000.0,
                status="Pago",
                objeto="Cultura Hip-Hop em Viamão",
                municipio="Viamão",  # Válido
                is_cultura=True,
                area_atuacao="Cultura"
            )
        ]

        with patch("api.emendas.CguTransparenciaApi", return_value=mock_cgu), \
             patch("api.emendas.PortalTransparenciaRsApi") as mock_rs_cls:
            mock_rs = MagicMock()
            mock_rs.buscar_emendas_estaduais.return_value = []
            mock_rs_cls.return_value = mock_rs

            status_line, body = invoke_handler(EmendasHandler, "/api/emendas?esfera=federal")

        self.assertIn("200 OK", status_line)
        self.assertEqual(body.get("total_emendas"), 1)
        self.assertEqual(body.get("emendas")[0]["id"], "FED-02")
        self.assertEqual(body.get("auditoria_territorial", {}).get("descartes_camada_seguranca"), 1)

    def test_smoke_index_endpoint(self):
        """Smoke test do endpoint /api (Health Check e Índice)."""
        status_line, body = invoke_handler(IndexHandler, "/api")
        self.assertIn("200 OK", status_line)
        self.assertEqual(body.get("status"), "online")
        self.assertIn("/api/emendas", body.get("rotas_disponiveis", {}))

    def test_smoke_lpg_endpoint(self):
        """Smoke test do endpoint /api/lpg."""
        with patch("api.lpg.TransferegovApi") as mock_lpg_cls:
            mock_inst = MagicMock()
            mock_inst.buscar_plano_acao_lpg.return_value = {
                "id_plano_acao": 12345,
                "codigo_plano_acao": "30882120230006-010014"
            }
            mock_lpg_cls.return_value = mock_inst

            status_line, body = invoke_handler(LpgHandler, "/api/lpg?cnpj=88000914000101")

        self.assertIn("200 OK", status_line)
        self.assertTrue(body.get("success"))
        self.assertIn("plano_acao", body)

    def test_smoke_news_endpoint(self):
        """Smoke test do endpoint /api/news."""
        with patch("api.news.ViamaoCultureScraper") as mock_scraper_cls:
            mock_inst = MagicMock()
            mock_inst.extrair_noticias_editais_viamao.return_value = [
                {
                    "titulo": "Edital de Apoio à Cultura Aberto em Viamão",
                    "link": "https://www.viamao.rs.gov.br/noticias/cultura-1",
                    "data": "15/09/2026"
                }
            ]
            mock_scraper_cls.return_value = mock_inst

            status_line, body = invoke_handler(NewsHandler, "/api/news?q=cultura")

        self.assertIn("200 OK", status_line)
        self.assertTrue(body.get("success"))
        self.assertEqual(body.get("total"), 1)


if __name__ == "__main__":
    unittest.main()
