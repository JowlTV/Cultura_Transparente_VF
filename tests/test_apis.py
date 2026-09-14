"""=============================================================================
TESTES UNITÁRIOS: CLIENTES DE APIS GOVERNAMENTAIS
Módulo: tests/test_apis.py
=============================================================================
"""

import unittest
from unittest.mock import MagicMock

from backend.apis import TransferegovApi, CguTransparenciaApi, PortalTransparenciaRsApi, classificar_tipo_cultural, normalizar_texto
from backend.models import LPGProject, EmendaRecord


class TestApis(unittest.TestCase):

    def test_transferegov_api_lpg_parse_success(self):
        mock_client = MagicMock()
        mock_client.fetch_json.side_effect = [
            # 1. Plano de ação
            [
                {
                    "id_plano_acao": 10014,
                    "codigo_plano_acao": "30882120230006-010014",
                    "situacao_plano_acao": "AUTORIZADO",
                    "valor_total_repasse_plano_acao": 2046951.79,
                    "data_inicio_vigencia_plano_acao": "2023-06-12",
                    "data_fim_vigencia_plano_acao": "2024-12-31",
                    "nome_ente_recebedor_plano_acao": "MUNICIPIO DE VIAMAO",
                    "nome_municipio_ente_recebedor_plano_acao": "VIAMÃO",
                    "nome_fundo_recebedor_plano_acao": "Secretaria Municipal da Cultura "
                }
            ],
            # 2. Metas
            [
                {
                    "id_meta_plano_acao": 24164,
                    "numero_meta_plano_acao": "M1",
                    "nome_meta_plano_acao": "Art. 6º, inciso I",
                    "descricao_meta_plano_acao": "Apoio a Produções Audiovisuais",
                    "valor_meta_plano_acao": 1084475.06
                },
                {
                    "id_meta_plano_acao": 24167,
                    "numero_meta_plano_acao": "M4",
                    "nome_meta_plano_acao": "Art. 8º",
                    "descricao_meta_plano_acao": "Demais áreas da cultura",
                    "valor_meta_plano_acao": 590136.20
                }
            ],
            # 3. Dados bancários
            [
                {
                    "id_plano_acao_dado_bancario": 10688,
                    "nome_banco_plano_acao_dado_bancario": "Banco do Brasil",
                    "numero_agencia_plano_acao_dado_bancario": 628,
                    "numero_conta_plano_acao_dado_bancario": 70018,
                    "nome_programa_agil_conta_plano_acao_dado_bancario": "MINC-LPG-MUNI-AUD"
                }
            ]
        ]

        api = TransferegovApi(client=mock_client)
        lpg_res = api.buscar_plano_acao_lpg("88000914000101")
        
        self.assertIsNotNone(lpg_res)
        self.assertEqual(lpg_res["codigo_plano_acao"], "30882120230006-010014")
        self.assertEqual(lpg_res["valor_total_repasse"], 2046951.79)
        self.assertEqual(len(lpg_res["metas"]), 2)
        self.assertEqual(len(lpg_res["dados_bancarios"]), 1)

    def test_cgu_transparencia_api_sem_chave(self):
        """Verifica que sem chave configurada, a API da CGU retorna lista vazia sem lançar exceção."""
        mock_client = MagicMock()
        api = CguTransparenciaApi(api_key="", client=mock_client)
        emendas = api.buscar_emendas(anos=[2024, 2025])
        self.assertEqual(emendas, [])
        mock_client.fetch_json.assert_not_called()

    def test_cgu_transparencia_api_sucesso(self):
        """Verifica o parsing e classificação de emendas federais da CGU com chave configurada."""
        mock_client = MagicMock()
        mock_client.fetch_json.return_value = [
            {
                "codigoEmenda": "2024810001",
                "nomeAutor": "Deputado Federal da Cultura",
                "partido": "PT",
                "tipoEmenda": "Individual",
                "orgaoSuperior": {"nome": "Ministério da Cultura"},
                "localidadeDoGasto": "Oficinas de Hip-Hop e Slam de Viamão",
                "valorEmpenhado": 250000.00,
                "valorPago": 250000.00,
                "situacao": "Concluída",
                "funcao": "Cultura"
            }
        ]

        api = CguTransparenciaApi(api_key="teste-chave-cgu", client=mock_client)
        emendas = api.buscar_emendas(ano=2024)

        self.assertEqual(len(emendas), 1)
        emenda = emendas[0]
        self.assertEqual(emenda.id, "em-fed-2024-2024810001")
        self.assertEqual(emenda.autor, "Deputado Federal da Cultura")
        self.assertEqual(emenda.valor, 250000.0)
        self.assertTrue(emenda.is_cultura)
        self.assertEqual(emenda.tipo_projeto_cultural, "Hip-Hop & Cultura Urbana")
        self.assertEqual(emenda.esfera, "Federal (API CGU)")

    def test_portal_transparencia_rs_api_sucesso(self):
        """Verifica a busca e normalização de emendas estaduais do RS com filtragem territorial."""
        mock_client = MagicMock()
        mock_client.fetch_json.return_value = [
            {
                "numero_emenda": "8841",
                "autor": "Deputada Estadual Gaúcha",
                "partido": "PSDB",
                "secretaria": "Secretaria de Estado da Cultura (SEDAC)",
                "objeto": "Restauração da Igreja Matriz de Viamão",
                "municipio": "Viamão",
                "valor_alocado": 300000.00,
                "valor_pago": 150000.00,
                "status": "Em Execução / Vigente"
            },
            {
                "numero_emenda": "9999",
                "autor": "Outro Deputado",
                "municipio": "Canoas",
                "valor_alocado": 100000.00
            }
        ]

        api = PortalTransparenciaRsApi(client=mock_client)
        emendas = api.buscar_emendas_estaduais(municipio="Viamão", anos=[2024])

        # Deve filtrar e retornar apenas a emenda destinada a Viamão
        self.assertEqual(len(emendas), 1)
        emenda = emendas[0]
        self.assertEqual(emenda.numero_emenda, "Ep 8841")
        self.assertEqual(emenda.autor, "Deputada Estadual Gaúcha")
        self.assertEqual(emenda.valor, 300000.0)
        self.assertEqual(emenda.pago, 150000.0)
        self.assertTrue(emenda.is_cultura)
        self.assertEqual(emenda.tipo_projeto_cultural, "Patrimônio & Restauro")
        self.assertEqual(emenda.esfera, "Estadual (ALRS)")

    def test_classificacao_cultural_e_normalizacao(self):
        """Verifica robustez das rotinas de classificação cultural e normalização de texto."""
        self.assertEqual(normalizar_texto("VIAMÃO - RS"), "viamao - rs")
        self.assertEqual(classificar_tipo_cultural("Apoio a festival de hip-hop"), "Hip-Hop & Cultura Urbana")
        self.assertEqual(classificar_tipo_cultural("Obras no patrimônio histórico"), "Patrimônio & Restauro")
        self.assertEqual(classificar_tipo_cultural("Festival de Cinema Audiovisual"), "Audiovisual & Cinema")
        self.assertEqual(classificar_tipo_cultural("Encontro de Folclore e Tradição Gaúcha"), "Tradição & Folclore")
        self.assertEqual(classificar_tipo_cultural("Aquisição de acervo para biblioteca e literatura"), "Literatura & Leitura")
        self.assertEqual(classificar_tipo_cultural("Show de música e teatro"), "Música & Artes Cênicas")
        self.assertEqual(classificar_tipo_cultural("Pavimentação de rua"), "Outras Áreas")


if __name__ == "__main__":
    unittest.main()
