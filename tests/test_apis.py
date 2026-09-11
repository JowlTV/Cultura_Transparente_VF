"""=============================================================================
TESTES UNITÁRIOS: CLIENTES DE APIS GOVERNAMENTAIS
Módulo: tests/test_apis.py
=============================================================================
"""

import unittest
from unittest.mock import MagicMock

from backend.apis import TransferegovApi, VersalicRouanetApi, CguTransparenciaApi
from backend.models import PNABRecord, RouanetProject


class TestApis(unittest.TestCase):

    def test_transferegov_api_parse_success(self):
        mock_client = MagicMock()
        mock_client.fetch_json.return_value = {
            "convenios": [
                {
                    "numero": "950123/2024",
                    "objeto": "IMPLEMENTACAO DA POLITICA NACIONAL ALDIR BLANC - PNAB",
                    "valor_global": 1850000.0,
                    "data_assinatura": "12/08/2024"
                }
            ]
        }

        api = TransferegovApi(client=mock_client)
        registro = api.buscar_termo_adesao_pnab("88000914000101")
        
        self.assertIsNotNone(registro)
        self.assertEqual(registro.termo_numero, "950123/2024")
        self.assertEqual(registro.valor_global, 1850000.0)
        self.assertEqual(registro.municipio, "Viamão")

    def test_versalic_rouanet_api_anti_hallucination_filter(self):
        mock_client = MagicMock()
        # Retorna projetos mistos onde um é de Porto Alegre e outro é de Viamão
        mock_client.fetch_json.return_value = {
            "_embedded": {
                "projetos": [
                    {
                        "PRONAC": "240001",
                        "nome": "Projeto de Outra Cidade",
                        "municipio": "Porto Alegre",
                        "uf": "RS",
                        "valor_aprovado": 50000.0
                    },
                    {
                        "PRONAC": "240002",
                        "nome": "Patrimônio Histórico de Viamão",
                        "municipio": "Viamão",
                        "uf": "RS",
                        "valor_aprovado": 80000.0,
                        "valor_captado": 40000.0,
                        "situacao": "Aprovado"
                    }
                ]
            }
        }

        api = VersalicRouanetApi(client=mock_client)
        projetos = api.buscar_projetos_por_municipio("Viamao", "RS")

        # Deve conter apenas o projeto de Viamão, sem alucinações de outras cidades
        self.assertEqual(len(projetos), 1)
        self.assertEqual(projetos[0].pronac_numero, "240002")
        self.assertEqual(projetos[0].municipio, "Viamão")
        self.assertEqual(projetos[0].percentual_captado, 50.0)

    def test_versalic_empty_state_compliance(self):
        mock_client = MagicMock()
        mock_client.fetch_json.return_value = {"_embedded": {"projetos": []}}

        api = VersalicRouanetApi(client=mock_client)
        projetos = api.buscar_projetos_por_municipio("Viamao", "RS")
        self.assertEqual(projetos, [])


if __name__ == "__main__":
    unittest.main()
