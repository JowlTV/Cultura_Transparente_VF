"""=============================================================================
CULTURA TRANSPARENTE - TESTES DE ROTEIROS E FLUXO DO ASSISTENTE
Arquivo: tests/test_roteiros_fluxo.py
=============================================================================
Testa:
1. Fonte única de verdade: src/config/roteiros.json compartilhado.
2. Loader do backend carrega todas as 5 políticas com campos válidos.
3. Obtenção do primeiro campo obrigatório e cálculo de avanço por código.
4. Descarte de chaves inválidas em outros_campos.
5. Inexistência absoluta de len(user_texts) no cálculo de etapas do backend.
"""

import os
import json
import unittest
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.roteiros_loader import (
    carregar_roteiros,
    obter_modelo_politica,
    obter_campos_politica,
    obter_ids_campos_politica,
    obter_campo_def,
    obter_primeiro_campo_obrigatorio,
    filtrar_e_validar_outros_campos,
    ROTEIROS_FILE_PATH,
)


class TestRoteirosFluxo(unittest.TestCase):

    def test_01_fonte_unica_roteiros_existe_e_valida(self):
        """Confirma que o arquivo src/config/roteiros.json existe e é válido."""
        self.assertTrue(os.path.exists(ROTEIROS_FILE_PATH), f"Arquivo não encontrado: {ROTEIROS_FILE_PATH}")
        roteiros = carregar_roteiros(force_reload=True)
        self.assertIsInstance(roteiros, dict)

        politicas_esperadas = ["PNAB", "LPG", "ROUANET", "EMENDAS", "MUNICIPAL"]
        for pol in politicas_esperadas:
            self.assertIn(pol, roteiros, f"Política {pol} ausente em roteiros.json")
            modelo = roteiros[pol]
            self.assertIn("nome", modelo)
            self.assertIn("campos", modelo)
            self.assertIsInstance(modelo["campos"], list)
            self.assertGreater(len(modelo["campos"]), 0)

    def test_02_campos_possuem_propriedades_obrigatorias(self):
        """Confirma que cada campo possui id, rotulo, pergunta_base, obrigatorio e tipo."""
        roteiros = carregar_roteiros()
        for pol, modelo in roteiros.items():
            ids_vistos = set()
            for campo in modelo["campos"]:
                self.assertIn("id", campo, f"Campo sem id na política {pol}")
                self.assertIn("rotulo", campo, f"Campo {campo.get('id')} sem rotulo")
                self.assertIn("pergunta_base", campo, f"Campo {campo.get('id')} sem pergunta_base")
                self.assertIn("obrigatorio", campo, f"Campo {campo.get('id')} sem obrigatorio")
                self.assertIn("tipo", campo, f"Campo {campo.get('id')} sem tipo")
                cid = campo["id"]
                self.assertNotIn(cid, ids_vistos, f"ID duplicado '{cid}' na política {pol}")
                ids_vistos.add(cid)

    def test_03_rouanet_possui_campos_salic_especificados(self):
        """Confirma que a Rouanet possui os campos do Salic especificados."""
        ids_rouanet = obter_ids_campos_politica("ROUANET")
        campos_obrigatorios_esperados = [
            "perfil_proponente",
            "pendencias_minc",
            "objetivo_pronac",
            "segmento_enquadramento",
            "produtos_cadastro",
            "acessibilidade_fisica",
            "acessibilidade_conteudo",
            "democratizacao_acesso",
            "etapas_trabalho",
            "ficha_tecnica",
            "sinopse_especificacao_atividades",
            "plano_distribuicao",
            "planilha_orcamentaria_vinculados",
            "plano_captacao",
            "revisao_final_salic",
        ]
        for cid in campos_obrigatorios_esperados:
            self.assertIn(cid, ids_rouanet, f"Campo Salic '{cid}' ausente na Rouanet")

    def test_04_obter_primeiro_campo_obrigatorio(self):
        """Testa o avanço pelo estado dos campos: primeiro obrigatório pendente."""
        campos_estado = {}
        primeiro = obter_primeiro_campo_obrigatorio("ROUANET", campos_estado)
        self.assertIsNotNone(primeiro)
        self.assertEqual(primeiro["id"], "perfil_proponente")

        # Quando perfil_proponente é preenchido, avança para o próximo
        campos_estado["perfil_proponente"] = {"valor": "Artista individual", "status": "preenchido"}
        segundo = obter_primeiro_campo_obrigatorio("ROUANET", campos_estado)
        self.assertEqual(segundo["id"], "pendencias_minc")

        # Quando pendencias_minc é marcado como pendente (pulado), avança para o terceiro
        campos_estado["pendencias_minc"] = {"valor": "[a preencher]", "status": "pendente"}
        terceiro = obter_primeiro_campo_obrigatorio("ROUANET", campos_estado)
        self.assertEqual(terceiro["id"], "objetivo_pronac")

    def test_05_filtrar_e_validar_outros_campos(self):
        """Confirma que chaves que não pertencem ao modelo da política são descartadas."""
        outros_campos_recebidos = {
            "acessibilidade_fisica": "Rampa de acesso e piso tátil no local",
            "campo_inventado_pela_ia": "Dado inventado",
            "outra_chave_estranha": "Mais dados",
        }
        filtrados = filtrar_e_validar_outros_campos("ROUANET", outros_campos_recebidos)
        self.assertIn("acessibilidade_fisica", filtrados)
        self.assertNotIn("campo_inventado_pela_ia", filtrados)
        self.assertNotIn("outra_chave_estranha", filtrados)

    def test_06_nenhum_len_user_texts_no_backend(self):
        """Garante que nenhum valor de etapa é calculado a partir de len(user_texts)."""
        chat_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "api", "chat.py"))
        with open(chat_path, "r", encoding="utf-8") as f:
            conteudo = f.read()
        self.assertNotIn("len(user_texts)", conteudo, "Encontrado len(user_texts) em api/chat.py!")


if __name__ == "__main__":
    unittest.main()
