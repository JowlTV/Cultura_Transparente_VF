"""=============================================================================
TESTES UNITÁRIOS: CLIENTES DE APIS GOVERNAMENTAIS
Módulo: tests/test_apis.py
=============================================================================
"""

import unittest
from datetime import datetime
from unittest.mock import MagicMock

from backend.apis import TransferegovApi, CguTransparenciaApi, PortalTransparenciaRsApi, classificar_tipo_cultural, normalizar_texto
from backend.models import LPGProject, EmendaRecord
from backend.utils import TTLCache, SingleFlightCache


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

        api = TransferegovApi(client=mock_client, single_flight_cache=SingleFlightCache(cache_instance=TTLCache()))
        lpg_res = api.buscar_plano_acao_lpg("88000914000101")
        
        self.assertIsNotNone(lpg_res)
        self.assertEqual(lpg_res["codigo_plano_acao"], "30882120230006-010014")
        self.assertEqual(lpg_res["valor_total_repasse"], 2046951.79)
        self.assertEqual(len(lpg_res["metas"]), 2)
        self.assertEqual(len(lpg_res["dados_bancarios"]), 1)

    def test_transferegov_lpg_neutral_fallbacks(self):
        """Verifica que campos ausentes na API do Transferegov retornam valores neutros (None / Não informado) e não dados hardcoded de Viamão."""
        mock_client = MagicMock()
        mock_client.fetch_json.side_effect = [
            [
                {
                    "id_plano_acao": 9999,
                    # Omitidos propositalmente: codigo_plano_acao, situacao_plano_acao, valor_total_repasse_plano_acao, vigência, ente, orgao
                }
            ],
            [],
            []
        ]

        api = TransferegovApi(client=mock_client, single_flight_cache=SingleFlightCache(cache_instance=TTLCache()))
        lpg_res = api.buscar_plano_acao_lpg("12345678000199")

        self.assertIsNotNone(lpg_res)
        self.assertEqual(lpg_res["codigo_plano_acao"], "Não informado pela fonte")
        self.assertEqual(lpg_res["situacao"], "Não informado pela fonte")
        self.assertIsNone(lpg_res["valor_total_repasse"])
        self.assertIsNone(lpg_res["data_inicio_vigencia"])
        self.assertIsNone(lpg_res["data_fim_vigencia"])
        self.assertEqual(lpg_res["ente_recebedor"]["nome"], "Não informado pela fonte")
        self.assertEqual(lpg_res["orgao_repassador"]["nome"], "Não informado pela fonte")

    def test_cgu_transparencia_api_sem_chave(self):
        """Verifica que sem chave configurada, a API da CGU retorna lista vazia sem lançar exceção."""
        mock_client = MagicMock()
        api = CguTransparenciaApi(api_key="", client=mock_client, single_flight_cache=SingleFlightCache(cache_instance=TTLCache()))
        emendas = api.buscar_emendas(anos=[2024, 2025])
        self.assertEqual(emendas, [])
        mock_client.fetch_json.assert_not_called()

    def test_cgu_transparencia_api_sucesso(self):
        """Verifica o parsing e classificação de emendas federais da CGU com chave configurada."""
        mock_client = MagicMock()
        mock_client.fetch_json.return_value = [
            {
                "codigoEmenda": "2024810001",
                "ano": 2024,
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

        api = CguTransparenciaApi(api_key="teste-chave-cgu", client=mock_client, single_flight_cache=SingleFlightCache(cache_instance=TTLCache()))
        emendas = api.buscar_emendas(ano=2024)

        self.assertEqual(len(emendas), 1)
        emenda = emendas[0]
        self.assertEqual(emenda.id, "em-fed-2024-2024810001")
        self.assertEqual(emenda.autor, "Deputado Federal da Cultura")
        self.assertEqual(emenda.valor, 250000.0)
        self.assertTrue(emenda.is_cultura)
        self.assertEqual(emenda.tipo_projeto_cultural, "Hip-Hop & Cultura Urbana")
        self.assertEqual(emenda.esfera, "Federal (API CGU)")

    def test_cgu_transparencia_api_multi_anos_default(self):
        """Verifica que buscar_emendas() sem argumento de anos consulta a janela deslizante de 3 anos."""
        mock_client = MagicMock()
        chamados = []

        def side_effect(url, params=None, headers=None, cache_ttl=None):
            ano = params.get("ano") if params else None
            chamados.append(ano)
            return [
                {
                    "codigoEmenda": f"{ano}0001",
                    "ano": ano,
                    "nomeAutor": f"Deputado do Ano {ano}",
                    "partido": "MDB",
                    "orgaoSuperior": {"nome": "Ministério da Cultura"},
                    "localidadeDoGasto": f"Projeto Cultural Viamão {ano}",
                    "valorEmpenhado": 100000.0,
                    "valorPago": 50000.0
                }
            ]

        mock_client.fetch_json.side_effect = side_effect
        api = CguTransparenciaApi(api_key="teste-chave-cgu", client=mock_client, single_flight_cache=SingleFlightCache(cache_instance=TTLCache()))
        emendas = api.buscar_emendas()

        ano_atual = datetime.now().year
        esperados = [ano_atual, ano_atual - 1, ano_atual - 2]
        for esp in esperados:
            self.assertIn(esp, chamados, f"O ano {esp} deveria ter sido consultado na janela padrão")
        self.assertEqual(len(emendas), 3, "Deveriam ser retornadas 3 emendas correspondentes aos 3 anos")

    def test_cgu_transparencia_api_tolerancia_falha_parcial(self):
        """Verifica que se um ano falhar (exceção de rede), os demais anos continuam sendo retornados."""
        mock_client = MagicMock()

        def side_effect(url, params=None, headers=None, cache_ttl=None):
            ano = params.get("ano") if params else None
            if ano == 2024:
                raise RuntimeError("Timeout simulado na API da CGU para 2024")
            return [
                {
                    "codigoEmenda": f"{ano}9999",
                    "ano": ano,
                    "nomeAutor": f"Deputado {ano}",
                    "partido": "PL",
                    "orgaoSuperior": {"nome": "Ministério do Turismo"},
                    "localidadeDoGasto": f"Festa Tradicional Viamão {ano}",
                    "valorEmpenhado": 80000.0,
                    "valorPago": 80000.0
                }
            ]

        mock_client.fetch_json.side_effect = side_effect
        api = CguTransparenciaApi(api_key="teste-chave-cgu", client=mock_client, single_flight_cache=SingleFlightCache(cache_instance=TTLCache()))
        emendas = api.buscar_emendas(anos=[2024, 2025, 2026])

        # 2024 falhou, mas 2025 e 2026 devem ser retornados com sucesso
        self.assertEqual(len(emendas), 2)
        anos_retornados = [e.ano for e in emendas]
        self.assertIn(2025, anos_retornados)
        self.assertIn(2026, anos_retornados)
        self.assertNotIn(2024, anos_retornados)

    def test_cgu_transparencia_api_deduplicacao(self):
        """Verifica que a mesma emenda retornada em múltiplos anos é deduplicada e atualizada com maior valor pago."""
        mock_client = MagicMock()

        def side_effect(url, params=None, headers=None, cache_ttl=None):
            ano = params.get("ano") if params else None
            if ano == 2024:
                return [
                    {
                        "codigoEmenda": "999888",
                        "ano": 2024,
                        "nomeAutor": "Deputado Reeleito",
                        "partido": "PT",
                        "orgaoSuperior": {"nome": "Ministério da Cultura"},
                        "localidadeDoGasto": "Teatro Municipal Viamão",
                        "valorEmpenhado": 200000.0,
                        "valorPago": 50000.0,
                        "situacao": "Em Execução"
                    }
                ]
            else:
                return [
                    {
                        "codigoEmenda": "999888",
                        "ano": 2024,
                        "nomeAutor": "Deputado Reeleito",
                        "partido": "PT",
                        "orgaoSuperior": {"nome": "Ministério da Cultura"},
                        "localidadeDoGasto": "Teatro Municipal Viamão",
                        "valorEmpenhado": 200000.0,
                        "valorPago": 200000.0,
                        "situacao": "Concluída"
                    }
                ]

        mock_client.fetch_json.side_effect = side_effect
        api = CguTransparenciaApi(api_key="teste-chave-cgu", client=mock_client, single_flight_cache=SingleFlightCache(cache_instance=TTLCache()))
        emendas = api.buscar_emendas(anos=[2024, 2025])

        self.assertEqual(len(emendas), 1, "Emenda com mesmo código deve ser deduplicada")
        self.assertEqual(emendas[0].pago, 200000.0, "Valor pago deve ser atualizado para o valor consolidado mais alto")
        self.assertEqual(emendas[0].status, "Concluída")

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

        api = PortalTransparenciaRsApi(client=mock_client, single_flight_cache=SingleFlightCache(cache_instance=TTLCache()))
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

    def test_cgu_transparencia_api_descarte_nao_viamao(self):
        """
        Garante que a API da CGU descarta categoricamente:
        1. Registros de outros estados (SP, PR, RJ, etc.)
        2. Registros de outros municípios do RS (Porto Alegre, Canoas, etc.)
        3. Registros genéricos de 'RS (UF)' ou 'Nacional'
        Retendo EXCLUSIVAMENTE registros com destinação comprovada a Viamão.
        """
        mock_client = MagicMock()
        mock_client.fetch_json.return_value = [
            {
                "codigoEmenda": "2024001",
                "ano": 2024,
                "nomeAutor": "Deputado A",
                "localidadeDoGasto": "LONDRINA - PR",
                "valorEmpenhado": 100000.0,
                "funcao": "Cultura"
            },
            {
                "codigoEmenda": "2024002",
                "ano": 2024,
                "nomeAutor": "Deputado B",
                "localidadeDoGasto": "PORTO ALEGRE - RS",
                "valorEmpenhado": 200000.0,
                "funcao": "Cultura"
            },
            {
                "codigoEmenda": "2024003",
                "ano": 2024,
                "nomeAutor": "Deputado C",
                "localidadeDoGasto": "RIO GRANDE DO SUL (UF)",
                "valorEmpenhado": 300000.0,
                "funcao": "Cultura"
            },
            {
                "codigoEmenda": "2024004",
                "ano": 2024,
                "nomeAutor": "Deputada D",
                "localidadeDoGasto": "Associação Hip-Hop de Viamão - RS",
                "valorEmpenhado": 150000.0,
                "funcao": "Cultura"
            }
        ]

        api = CguTransparenciaApi(api_key="teste-chave-cgu", client=mock_client, single_flight_cache=SingleFlightCache(cache_instance=TTLCache()))
        emendas = api.buscar_emendas(ano=2024)

        # Apenas a emenda nº 2024004 (Viamão) pode ser aceita
        self.assertEqual(len(emendas), 1)
        self.assertEqual(emendas[0].numero_emenda, "2024004")
        self.assertEqual(emendas[0].municipio, "Viamão")
        self.assertEqual(emendas[0].beneficiario, "Município de Viamão / RS")

    def test_portal_transparencia_rs_descarte_vazio_e_outros_municipios(self):
        """
        Garante que a API do Portal RS descarta:
        1. Registros sem município/localidade preenchidos (sem fallback perigoso)
        2. Registros de outros municípios gaúchos
        Retendo apenas registros estritamente comprovados de Viamão.
        """
        mock_client = MagicMock()
        mock_client.fetch_json.return_value = [
            {
                "numero_emenda": "0001",
                "objeto": "Obra sem localidade definida",
                # Omitidos propositalmente: municipio, beneficiario, localidade
                "valor_alocado": 50000.0
            },
            {
                "numero_emenda": "0002",
                "municipio": "Pelotas",
                "objeto": "Conservação de Praça em Pelotas",
                "valor_alocado": 80000.0
            },
            {
                "numero_emenda": "0003",
                "municipio": "Viamão",
                "objeto": "Restauro do Casarão Cultural de Viamão",
                "valor_alocado": 120000.0,
                "valor_pago": 120000.0
            }
        ]

        api = PortalTransparenciaRsApi(client=mock_client, single_flight_cache=SingleFlightCache(cache_instance=TTLCache()))
        emendas = api.buscar_emendas_estaduais(municipio="Viamão", anos=[2024])

        self.assertEqual(len(emendas), 1)
        self.assertEqual(emendas[0].numero_emenda, "Ep 0003")
        self.assertEqual(emendas[0].municipio, "Viamão")

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
