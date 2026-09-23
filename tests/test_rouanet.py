"""=============================================================================
CULTURA TRANSPARENTE - SUÍTE DE TESTES UNITÁRIOS DA LEI ROUANET (IN MINC 29/2026)
Arquivo: tests/test_rouanet.py
=============================================================================
Testes automatizados cobrindo os requisitos formais:
1. IN 23/2025 nunca é enviada ao modelo (status: revogada e filtrada);
2. Roteiro Rouanet é ativado ao escolher a política, e cada etapa tem citação de artigo/anexo;
3. Toda citação de regras_rouanet.json existe literalmente no texto da IN 29/2026;
4. Validação de orçamento acusa corretamente percentual acima do limite e aceita valor dentro dele;
5. Assistente orienta que não encontrou a informação quando a pergunta está fora da base;
6. Documento exportado usa a estrutura Rouanet e inclui a seção de conferência de regras.
"""

import unittest
from unittest.mock import patch, MagicMock
import json
import os
import sys
import re

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.conhecimento_retriever import (
    extrair_contexto_conhecimento,
    identificar_politica,
    carregar_indice
)
from backend.regras_rouanet import (
    carregar_regras_rouanet,
    validar_orcamento_rouanet,
    verificar_integridade_citacoes_literais
)
from api.chat import (
    ROTEIRO_ETAPAS_ROUANET,
    ROTEIRO_ETAPAS_PADRAO,
    CULTURAL_SYSTEM_PROMPT
)


class TestRouanetIntegration(unittest.TestCase):

    def test_in23_2025_nunca_e_enviada_ao_modelo(self):
        """1. A IN 23/2025 nunca entra no contexto enviado ao modelo de IA."""
        indice_docs = carregar_indice()
        in23_entries = [d for d in indice_docs if "23_2025" in d.get("id", "") or "23_2025" in d.get("arquivo", "")]
        self.assertGreater(len(in23_entries), 0, "A IN 23/2025 deve estar registrada no indice.json para rastreabilidade")
        for doc in in23_entries:
            self.assertEqual(
                doc.get("status"), "revogada",
                "A IN 23/2025 deve estar marcada estritamente como 'revogada' no indice.json"
            )

        contexto = extrair_contexto_conhecimento(
            politica="ROUANET",
            etapa_atual=1,
            user_query="Como apresentar proposta na Lei Rouanet conforme a IN do MinC?",
            limite_total_caracteres=20000
        )

        self.assertNotIn("in_minc_23_2025", contexto, "O arquivo da IN 23/2025 não pode ser incluído no contexto.")
        self.assertIn("Instrução Normativa MinC nº 29", contexto, "A IN 29/2026 deve ser incluída no contexto da Rouanet.")
        self.assertIn("LEI Nº 8.313", contexto, "A Lei 8.313/1991 deve ser incluída no contexto da Rouanet.")

    def test_roteiro_rouanet_ativado_e_etapas_fundamentadas(self):
        """2. O roteiro Rouanet é ativado ao escolher a política e todas as etapas têm citação legal."""
        pol_identificada = identificar_politica("Quero inscrever uma proposta na Lei Rouanet pelo Salic")
        self.assertEqual(pol_identificada, "ROUANET", "Deve identificar a política Rouanet")

        pol_identificada_pronac = identificar_politica("Gostaria de captar recursos via Pronac / Mecenato federal")
        self.assertEqual(pol_identificada_pronac, "ROUANET", "Deve identificar Rouanet pelo Pronac")

        self.assertEqual(len(ROTEIRO_ETAPAS_ROUANET), 12, "O roteiro Rouanet deve ter exatamente 12 etapas")

        for etapa in ROTEIRO_ETAPAS_ROUANET:
            self.assertIn("fundamentacao_legal", etapa, f"Etapa {etapa['etapa']} deve ter 'fundamentacao_legal'")
            fund = etapa["fundamentacao_legal"]
            self.assertTrue(
                ("Art." in fund or "Arts." in fund or "Anexo" in fund),
                f"Fundamentação legal da etapa {etapa['etapa']} ({etapa['nome']}) deve citar Artigo ou Anexo: {fund}"
            )

    def test_todas_citacoes_de_regras_rouanet_existem_literalmente_na_in29(self):
        """3. Toda citação literal em regras_rouanet.json existe literalmente no texto da IN 29/2026."""
        resultado = verificar_integridade_citacoes_literais()
        self.assertTrue(
            resultado.get("sucesso"),
            f"Falha na validação de citações literais da IN 29/2026: {resultado.get('falhas')}"
        )
        self.assertGreater(resultado.get("regras_validadas", 0), 0)

        # Verificação direta documento por documento
        caminho_in29 = os.path.join(os.path.dirname(__file__), "..", "backend", "conhecimento", "in_minc_29_2026_rouanet.txt")
        self.assertTrue(os.path.exists(caminho_in29))
        with open(caminho_in29, "r", encoding="utf-8") as f:
            texto_in29 = f.read()

        texto_norm = re.sub(r'\s+', ' ', texto_in29.lower())
        regras = carregar_regras_rouanet()
        for r in regras:
            cit = r.get("citacao_literal", "")
            self.assertTrue(cit, f"Regra {r.get('identificador')} deve conter citacao_literal")
            cit_norm = re.sub(r'\s+', ' ', cit.lower().strip())
            self.assertIn(
                cit_norm,
                texto_norm,
                f"Citação da regra {r.get('identificador')} não encontrada literalmente na IN 29/2026"
            )

    def test_validacao_orcamento_limites_excedidos_e_aceitos(self):
        """4. Validação de orçamento acusa corretamente percentual acima do limite e aceita valor dentro dele."""
        # Teste 1: Custos Administrativos a 20% (limite legal é 15% conforme Art. 22)
        dados_acima = {
            "valor_total": 100000.0,
            "custos_administrativos": 20000.0,  # 20% > 15%
            "tipo_proponente": "pj"
        }
        res_acima = validar_orcamento_rouanet(dados_acima)
        self.assertFalse(res_acima["valido"], "Orçamento com 20% de administração deve ser considerado irregular")
        infracoes_regras = [inf["regra"] for inf in res_acima["infracoes"]]
        self.assertIn("limite_custos_administracao", infracoes_regras)
        self.assertIn("Art. 22", res_acima["infracoes"][0]["referencia"])
        self.assertTrue(len(res_acima["infracoes"][0]["citacao"]) > 0)

        # Teste 2: Custos Administrativos a 12% (dentro do limite legal de 15%)
        dados_dentro = {
            "valor_total": 100000.0,
            "custos_administrativos": 12000.0,  # 12% <= 15%
            "remuneracao_captacao": 8000.0,      # 8% <= 10%
            "tipo_proponente": "pj"
        }
        res_dentro = validar_orcamento_rouanet(dados_dentro)
        aprovacoes_regras = [ap["regra"] for ap in res_dentro["aprovacoes"]]
        self.assertIn("limite_custos_administracao", aprovacoes_regras)
        self.assertIn("limite_remuneracao_captacao_recursos", aprovacoes_regras)

        # Teste 3: Cachê individual de R$ 30.000 (teto é R$ 25.000 conforme Art. 26)
        dados_cache_alto = {
            "valor_total": 100000.0,
            "caches_individuais": [30000.0]
        }
        res_cache = validar_orcamento_rouanet(dados_cache_alto)
        self.assertFalse(res_cache["valido"])
        infracoes_cache = [inf["regra"] for inf in res_cache["infracoes"]]
        self.assertIn("limite_cache_artista_individual", infracoes_cache)

        # Teste 4: Captação acima de R$ 150.000 (ex: R$ 200.000 em projeto de R$ 3 milhões)
        dados_captacao_alta = {
            "valor_total": 3000000.0,
            "remuneracao_captacao": 200000.0  # R$ 200 mil > R$ 150 mil
        }
        res_captacao = validar_orcamento_rouanet(dados_captacao_alta)
        self.assertFalse(res_captacao["valido"])
        infracoes_cap = [inf["regra"] for inf in res_captacao["infracoes"]]
        self.assertIn("limite_remuneracao_captacao_recursos", infracoes_cap)

    def test_assistente_orienta_quando_informacao_fora_da_base(self):
        """5. Assistente deve orientar que não encontrou informação quando fora da base oficial."""
        self.assertIn(
            'Não encontrei essa informação nos documentos oficiais disponíveis',
            CULTURAL_SYSTEM_PROMPT,
            "Prompt de sistema deve instruir o modelo a responder que não encontrou quando fora da base"
        )
        self.assertIn(
            'não garante aprovação',
            CULTURAL_SYSTEM_PROMPT.lower(),
            "Prompt de sistema deve orientar aviso de não garantia de aprovação"
        )
        self.assertIn(
            'autoriza a captação de recursos',
            CULTURAL_SYSTEM_PROMPT.lower(),
            "Prompt de sistema deve orientar que aprovação autoriza captação"
        )
        self.assertIn(
            'salic',
            CULTURAL_SYSTEM_PROMPT.lower(),
            "Prompt de sistema deve orientar que submissão é feita diretamente pela pessoa no Salic"
        )

    def test_documento_exportado_usa_estrutura_rouanet_e_conferencia_regras(self):
        """6. A exportação usa a estrutura de seções da Rouanet e inclui a conferência de regras."""
        try:
            from tests.src_compat_test import test_metadata_rouanet_sections
        except ImportError:
            from src_compat_test import test_metadata_rouanet_sections
        test_metadata_rouanet_sections(self)


if __name__ == "__main__":
    unittest.main()
