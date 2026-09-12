"""=============================================================================
TESTES UNITÁRIOS: MODELOS DE DADOS E VALIDAÇÕES
Módulo: tests/test_models.py
=============================================================================
"""

import unittest
from backend.models import (
    PNABRecord,
    FACEdital,
    LPGProject,
    RouanetProject,
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

    def test_pnab_record_creation_and_serialization(self):
        pnab = PNABRecord(
            id="pnab-01",
            termo_numero="123456/2024",
            cnpj_proponente="88.000.914/0001-01",
            municipio="Viamão",
            uf="RS",
            valor_global=1500000.0,
            data_extrato="10/09/2026",
            banco_custodia="Banco do Brasil",
            conta_vinculada="FMC Viamão",
            objeto="Ações de Fomento PNAB",
            base_legal="Lei nº 14.399/2022",
            fonte_auditada="Transferegov.br",
            status_etapa="Em execução"
        )
        data = pnab.to_dict()
        self.assertEqual(data["id"], "pnab-01")
        self.assertEqual(data["valor_global"], 1500000.0)
        self.assertEqual(data["municipio"], "Viamão")

        # Reconstrução a partir de dict
        reconstruido = PNABRecord.from_dict(data)
        self.assertEqual(reconstruido.id, pnab.id)
        self.assertEqual(reconstruido.valor_global, pnab.valor_global)

    def test_rouanet_project_creation(self):
        proj = RouanetProject(
            id="rouanet-123456",
            pronac_numero="123456",
            nome_projeto="Música na Praça",
            proponente="Associação Cultural",
            municipio="Viamão",
            uf="RS",
            segmento="Música",
            valor_aprovado=100000.0,
            valor_captado=50000.0,
            percentual_captado=50.0,
            status="Em Captação"
        )
        self.assertEqual(proj.percentual_captado, 50.0)
        self.assertEqual(proj.municipio, "Viamão")

    def test_fac_edital_creation(self):
        edital = FACEdital(
            id="fac-01",
            numero_edital="01/2026",
            titulo="FAC Regional",
            status="Aberto",
            valor_total=20000000.0,
            valor_maximo_projeto=100000.0,
            segmentos=["Artes Visuais", "Música"],
            elegibilidade="RS Amplo",
            link_oficial="https://procultura.rs.gov.br",
            prazo_inscricao="30/10/2026"
        )
        self.assertEqual(edital.valor_maximo_projeto, 100000.0)


if __name__ == "__main__":
    unittest.main()
