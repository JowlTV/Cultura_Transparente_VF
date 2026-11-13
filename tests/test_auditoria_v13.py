"""Regressões da auditoria v13: nenhum dado substituto e escopo territorial fixo em Viamão."""
import json
import os
import re
import unittest
from unittest.mock import MagicMock, patch

from backend.apis import PortalTransparenciaRsApi, status_execucao
from backend.scrapers.viamao_scraper import formatar_data_iso_para_br, chave_ordenacao_data
from backend.utils import cache
from api.chat import extrair_valores_orcamento_texto, obter_modelos_gemini
from tests.test_endpoints import invoke_handler
from api.emendas import handler as EmendasHandler
from api.lpg import handler as LpgHandler

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


class _SemCache:
    def get_or_fetch(self, key, fetch_fn, ttl_seconds=None):
        return fetch_fn()


class TestAuditoriaV13(unittest.TestCase):
    def setUp(self):
        cache.clear()

    def test_portal_rs_sem_json_nao_inventa_emendas(self):
        client = MagicMock()
        client.fetch_json.return_value = {"raw_text": "<html>PowerBI</html>", "status": 200}
        api = PortalTransparenciaRsApi(client=client, single_flight_cache=_SemCache())
        emendas = api.buscar_emendas_estaduais(anos=[2024, 2025, 2026])
        self.assertEqual(emendas, [])
        self.assertFalse(api.fonte_disponivel)

    def test_status_execucao_sem_valor(self):
        self.assertEqual(status_execucao(0.0, 0.0), "Sem empenho registrado")
        self.assertEqual(status_execucao(100.0, 100.0), "Concluída")
        self.assertEqual(status_execucao(100.0, 10.0), "Em Execução / Vigente")

    def test_emendas_ignora_ibge_e_municipio_da_url(self):
        with patch("api.emendas.CguTransparenciaApi") as cgu_cls, patch("api.emendas.PortalTransparenciaRsApi") as rs_cls:
            cgu = MagicMock(api_key="k")
            cgu.buscar_emendas.return_value = []
            cgu_cls.return_value = cgu
            rs = MagicMock(fonte_disponivel=False)
            rs.buscar_emendas_estaduais.return_value = []
            rs_cls.return_value = rs
            status, body = invoke_handler(EmendasHandler, "/api/emendas?ibge=4305108&municipio=Canoas")
        self.assertIn("200", status)
        self.assertEqual(body["codigo_ibge"], "4323002")
        self.assertEqual(cgu.buscar_emendas.call_args.kwargs["codigo_ibge"], "4323002")
        self.assertEqual(rs.buscar_emendas_estaduais.call_args.kwargs["municipio"], "Viamão")
        self.assertEqual(body["status_fontes"]["estadual_rs"]["status"], "sem_fonte_estruturada")

    def test_lpg_ignora_cnpj_da_url(self):
        with patch("api.lpg.TransferegovApi") as api_cls:
            api_cls.CNPJ_VIAMAO_DEFAULT = "88000914000101"
            inst = MagicMock()
            inst.buscar_plano_acao_lpg.return_value = {"valor_total_repasse": 1.0}
            api_cls.return_value = inst
            invoke_handler(LpgHandler, "/api/lpg?cnpj=11111111111111")
        self.assertEqual(inst.buscar_plano_acao_lpg.call_args.kwargs["cnpj"], "88000914000101")

    def test_datas_rss_rfc822(self):
        self.assertEqual(formatar_data_iso_para_br("Fri, 13 Nov 2026 10:00:00 -0300"), "13/11/2026")
        self.assertGreater(chave_ordenacao_data("Fri, 13 Nov 2026 10:00:00 -0300"), chave_ordenacao_data("2026-08-28"))

    def test_mei_nao_confunde_com_meio(self):
        self.assertNotIn("tipo_proponente", extrair_valores_orcamento_texto("por meio de oficinas"))
        self.assertEqual(extrair_valores_orcamento_texto("sou MEI")["tipo_proponente"], "mei")

    def test_modelos_gemini_padrao_nao_vazio(self):
        with patch.dict(os.environ, {"GEMINI_MODELS": ""}):
            modelos = obter_modelos_gemini()
        self.assertTrue(modelos)
        self.assertTrue(all(modelos))

    def test_frontend_sem_datasets_fixos_de_emendas_e_noticias(self):
        with open(os.path.join(ROOT, "src", "data", "initialData.ts"), encoding="utf-8") as f:
            conteudo = f.read()
        for nome in ("INITIAL_EMENDAS", "BUDGET_CHRONOLOGY", "INITIAL_NEWS"):
            self.assertNotIn(f"export const {nome}", conteudo)
        self.assertNotIn("empenho_numero:", conteudo)

    def test_exportacoes_nao_hardcodam_artigos_rouanet(self):
        for arq in ("docxExport.ts", "googleDriveExport.ts"):
            with open(os.path.join(ROOT, "src", "utils", arq), encoding="utf-8") as f:
                conteudo = f.read()
            self.assertIsNone(re.search(r"custos administrativos até 15% \(Art\. 19\)", conteudo))
            self.assertIn("REGRAS_GERAIS_ROUANET", conteudo)


if __name__ == "__main__":
    unittest.main()
