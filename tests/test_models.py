"""=============================================================================
TESTES UNITÁRIOS: MODELOS DE DADOS E VALIDAÇÕES
Módulo: tests/test_models.py
=============================================================================
"""

import unittest
from backend.models import (
    LPGProject,
    LPGMeta,
    EmendaRecord,
    validar_cnpj
)


class TestModels(unittest.TestCase):

    def test_validar_cnpj(self):
        # CNPJ oficial da Prefeitura de Viamão: 88.000.914/0001-01
        self.assertTrue(validar_cnpj("88.000.914/0001-01"))
        self.assertTrue(validar_cnpj("88000914000101"))
        # CNPJs inválidos
        self.assertFalse(validar_cnpj("00000000000000"))
        self.assertFalse(validar_cnpj("12345678901234"))
        self.assertFalse(validar_cnpj(""))

    def test_lpg_project_creation(self):
        lpg = LPGProject(
            id="lpg-viamao-10014",
            codigo_plano_acao="30882120230006-010014",
            objeto="Executar os artigos 6 (Audiovisual) e 8 (Demais Áreas) da LC 195/2022",
            valor_total_repasse=2046951.79,
            situacao="AUTORIZADO",
            data_inicio_vigencia="2023-06-12",
            data_fim_vigencia="2024-12-31",
            municipio="Viamão",
            uf="RS"
        )
        self.assertEqual(lpg.valor_total_repasse, 2046951.79)
        self.assertEqual(lpg.situacao, "AUTORIZADO")
        self.assertEqual(lpg.municipio, "Viamão")

    def test_emenda_record_creation(self):
        emenda = EmendaRecord(
            id="emenda-1",
            autor="Deputado Exemplo",
            partido="ABC",
            tipo="Individual",
            ano=2024,
            orgao="Ministério da Cultura",
            objeto="Reforma de Espaço Cultural",
            valor=250000.0,
            pago=250000.0,
            status="Liquidado",
            is_cultura=True,
            area_atuacao="Cultura & Turismo",
            municipio="Viamão"
        )
        self.assertTrue(emenda.is_cultura)
        self.assertEqual(emenda.valor, 250000.0)


if __name__ == "__main__":
    unittest.main()
