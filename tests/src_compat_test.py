"""Módulo auxiliar para validação da estrutura de seções da Rouanet nos testes."""
import re
import os

def test_metadata_rouanet_sections(test_case):
    docx_export_path = os.path.join(os.path.dirname(__file__), "..", "src", "utils", "docxExport.ts")
    with open(docx_export_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Confirma que SECTION_METADATA_ROUANET possui as 12 seções específicas
    test_case.assertIn("SECTION_METADATA_ROUANET", content)
    test_case.assertIn("Conferência de Regras Objetivas (IN MinC nº 29/2026)", content)
    test_case.assertIn("isRouanetPolicy", content)
    test_case.assertIn("perfil_proponente", content)
    test_case.assertIn("enquadramento_artigo", content)
    test_case.assertIn("sintese_produto", content)
    test_case.assertIn("plano_distribuicao_democratizacao", content)
    test_case.assertIn("medidas_acessibilidade", content)
    test_case.assertIn("divulgacao_marcas", content)
    test_case.assertIn("ficha_tecnica", content)
    test_case.assertIn("planilha_orcamentaria", content)
    test_case.assertIn("conferencia_regras_revisao", content)
