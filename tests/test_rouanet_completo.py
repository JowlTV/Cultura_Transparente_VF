"""=============================================================================
CULTURA TRANSPARENTE - SUÍTE COMPLETA DE TESTES DA LEI ROUANET (PARTES A ATÉ I)
Arquivo: tests/test_rouanet_completo.py
=============================================================================
"""

import unittest
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
    verificar_integridade_citacoes_literais,
    calcular_custos_vinculados_e_cenarios,
    identificar_pendencias_salic,
    tratar_casos_especiais_rouanet
)
from api.chat import (
    ROTEIRO_ETAPAS_ROUANET,
    CULTURAL_SYSTEM_PROMPT
)


class TestRouanetCompleto(unittest.TestCase):

    def test_parte_a_qualidade_documentos_e_revogados(self):
        """PARTE A: Verifica ausência de caracteres corrompidos e exclusão de trechos revogados."""
        conhecimento_dir = os.path.join(os.path.dirname(__file__), "..", "backend", "conhecimento")

        # Nenhum caractere corrompido \ufffd em nenhum arquivo
        for fname in os.listdir(conhecimento_dir):
            if fname.endswith(".txt"):
                fpath = os.path.join(conhecimento_dir, fname)
                with open(fpath, "r", encoding="utf-8") as f:
                    content = f.read()
                self.assertNotIn("\ufffd", content, f"Arquivo {fname} contém caractere inválido (\\ufffd)")

        # Lei 8.313/1991: checagem de revogados e vigentes
        l8313_path = os.path.join(conhecimento_dir, "lei_8313_1991_rouanet.txt")
        with open(l8313_path, "r", encoding="utf-8") as f:
            l8313_text = f.read()

        # Frases revogadas ausentes
        self.assertNotIn(
            "apresentados à SEC/PR, ou a quem esta delegar a atribuição, acompanhados de planilha de custos",
            l8313_text,
            "Trecho revogado da redação original do art. 19 não pode estar presente."
        )
        self.assertNotIn(
            "música erudita ou instrumental;",
            l8313_text,
            "Trecho revogado do art. 18, § 3º, alínea 'd' não pode estar presente."
        )

        # Redação vigente presente
        self.assertIn("acompanhados do orçamento analítico", l8313_text)
        self.assertIn("música erudita, instrumental ou regional", l8313_text)

        # MROSC: checagem de revogado ausente
        mrosc_path = os.path.join(conhecimento_dir, "lei_13019_2014_mrosc_fomento.txt")
        with open(mrosc_path, "r", encoding="utf-8") as f:
            mrosc_text = f.read()
        self.assertNotIn(
            "Esta Lei institui normas gerais para as parcerias voluntárias",
            mrosc_text,
            "Redação de 2014 revogada do art. 1º do MROSC não pode estar presente."
        )

    def test_parte_b_citacoes_literais_regras_rouanet(self):
        """PARTE B: Toda citação literal em regras_rouanet.json existe na IN 29/2026."""
        res = verificar_integridade_citacoes_literais()
        self.assertTrue(res.get("sucesso"), f"Falhas encontradas: {res.get('falhas')}")
        self.assertEqual(res.get("total_regras"), 27)
        self.assertEqual(res.get("regras_validadas"), 27)

    def test_parte_c_requisitos_lei_8313_no_roteiro(self):
        """PARTE C: Testa casos especiais da Lei 8.313 (FNC/Ficart, mérito art. 22, segmento art. 25, acesso restrito art. 2º)."""
        # 1. Pergunta sobre FNC ou Ficart não inicia roteiro
        fnc_resp = tratar_casos_especiais_rouanet("Quero inscrever uma proposta no FNC ou Ficart")
        self.assertIsNotNone(fnc_resp)
        self.assertEqual(fnc_resp["caso"], "escopo_fnc_ficart")
        self.assertIn("distintos do Incentivo a Projetos Culturais", fnc_resp["mensagem"])
        self.assertIn("Arts. 2º, 4º e 8º", str(fnc_resp["fontes_citadas"]))

        # 2. Pedido de avaliação de ideia recebe explicação do art. 22
        merito_resp = tratar_casos_especiais_rouanet("Minha ideia é boa? Você acha que meu projeto tem mérito artístico?")
        self.assertIsNotNone(merito_resp)
        self.assertEqual(merito_resp["caso"], "merito_artistico_art22")
        self.assertIn("art. 22 da Lei nº 8.313/1991", merito_resp["mensagem"])
        self.assertIn("vedada qualquer apreciação subjetiva quanto ao seu mérito artístico", merito_resp["mensagem"])

        # 3. Segmento do art. 25, II (cinema, vídeo, discografia) exige confirmação de produção independente
        art25_resp = tratar_casos_especiais_rouanet("Nosso projeto prevê a produção de um curta-metragem e cinema comunitário")
        self.assertIsNotNone(art25_resp)
        self.assertEqual(art25_resp["caso"], "producao_independente_art25")
        self.assertIn("produção cultural independente", art25_resp["mensagem"])

        # 4. Acesso restrito dispara aviso do art. 2º, §§ 1º e 2º
        art2_resp = tratar_casos_especiais_rouanet("Será uma festa fechada com circuito privado apenas para convidados")
        self.assertIsNotNone(art2_resp)
        self.assertEqual(art2_resp["caso"], "acesso_restrito_art2")
        self.assertIn("art. 2º, §§ 1º e 2º da Lei nº 8.313/1991", art2_resp["mensagem"])
        self.assertIn("vedada a destinação a circuitos privados", art2_resp["mensagem"])

    def test_parte_f_calculos_custos_vinculados_e_cenarios(self):
        """PARTE F: Valida o cálculo por código dos custos vinculados e os 2 cenários."""
        # Teste com R$ 100.000,00
        calc = calcular_custos_vinculados_e_cenarios(100000.0)
        
        # Cenário A (R$ 100 mil como custo de atividades):
        # Acessibilidade 20% = R$ 20.000
        # Administração 15% = R$ 15.000
        # Captação 10% = R$ 10.000
        # Total Vinculados = R$ 45.000
        # Total Projeto = R$ 145.000
        cen_a = calc["cenario_a_atividades_para_total"]
        self.assertEqual(cen_a["custo_atividades"], 100000.0)
        self.assertEqual(cen_a["custo_acessibilidade"], 20000.0)
        self.assertEqual(cen_a["custo_administracao"], 15000.0)
        self.assertEqual(cen_a["remuneracao_captacao"], 10000.0)
        self.assertEqual(cen_a["total_custos_vinculados"], 45000.0)
        self.assertEqual(cen_a["total_geral_projeto"], 145000.0)

        # Cenário B (R$ 100 mil como total do projeto):
        # Acessibilidade 20% = R$ 20.000
        # Administração 15% = R$ 15.000
        # Captação 10% = R$ 10.000
        # Saldo para atividades = R$ 55.000
        cen_b = calc["cenario_b_total_para_atividades"]
        self.assertEqual(cen_b["total_geral_projeto"], 100000.0)
        self.assertEqual(cen_b["saldo_para_atividades"], 55000.0)

        # Teste teto fixo de R$ 150.000 na captação (Art. 19 da IN 29/2026)
        calc_grande = calcular_custos_vinculados_e_cenarios(3000000.0)
        self.assertEqual(calc_grande["cenario_b_total_para_atividades"]["remuneracao_captacao"], 150000.0)

    def test_parte_i_caso_de_teste_hiphop_2027(self):
        """PARTE I: Executa o caso de teste completo 'Hip Hop 2027'."""
        fixture_path = os.path.join(os.path.dirname(__file__), "fixtures", "hiphop_2027.json")
        self.assertTrue(os.path.exists(fixture_path), "Fixture hiphop_2027.json deve existir")

        with open(fixture_path, "r", encoding="utf-8") as f:
            hiphop_data = json.load(f)

        # 1. Confere soma dos itens: R$ 400.000,00
        itens = hiphop_data["itens_orcamento"]
        soma_calculada = sum(i["valor"] for i in itens)
        self.assertEqual(soma_calculada, 400000.00)
        self.assertEqual(soma_calculada, hiphop_data["valor_informado"])

        # 2. Cálculos dos dois cenários para R$ 400.000,00
        cenarios = calcular_custos_vinculados_e_cenarios(400000.00)

        # Cenário A (R$ 400.000 como atividades):
        # Acessibilidade (20%) = 80.000
        # Administração (15%) = 60.000
        # Captação (10%) = 40.000
        # Total Vinculados = 180.000
        # Total Projeto = 580.000
        cen_a = cenarios["cenario_a_atividades_para_total"]
        self.assertEqual(cen_a["custo_atividades"], 400000.00)
        self.assertEqual(cen_a["custo_acessibilidade"], 80000.00)
        self.assertEqual(cen_a["custo_administracao"], 60000.00)
        self.assertEqual(cen_a["remuneracao_captacao"], 40000.00)
        self.assertEqual(cen_a["total_custos_vinculados"], 180000.00)
        self.assertEqual(cen_a["total_geral_projeto"], 580000.00)

        # Cenário B (R$ 400.000 como total geral):
        # Acessibilidade (20%) = 80.000
        # Administração (15%) = 60.000
        # Captação (10%) = 40.000
        # Total Vinculados = 180.000
        # Saldo para Atividades = 220.000
        cen_b = cenarios["cenario_b_total_para_atividades"]
        self.assertEqual(cen_b["total_geral_projeto"], 400000.00)
        self.assertEqual(cen_b["total_custos_vinculados"], 180000.00)
        self.assertEqual(cen_b["saldo_para_atividades"], 220000.00)

        # 3. Detecta campos não informados como pendências '[a preencher]'
        proposta_hiphop = {
            "titulo": hiphop_data["titulo"],
            "valor_informado": hiphop_data["valor_informado"],
            # Campos deliberadamente não preenchidos no fixture
        }
        pendencias = identificar_pendencias_salic(proposta_hiphop)
        self.assertGreater(len(pendencias), 15)
        chaves_pendentes = [p["campo"] for p in pendencias]

        self.assertIn("local_realizacao", chaves_pendentes)
        self.assertIn("publico_estimado", chaves_pendentes)
        self.assertIn("sinopse_obra", chaves_pendentes)
        self.assertIn("especificacao_tecnica", chaves_pendentes)
        self.assertIn("acessibilidade_fisica", chaves_pendentes)
        self.assertIn("acessibilidade_conteudo", chaves_pendentes)
        self.assertIn("democratizacao_acesso", chaves_pendentes)
        self.assertIn("curriculos_equipe", chaves_pendentes)
        self.assertIn("duracao_pre_producao", chaves_pendentes)
        self.assertIn("duracao_pos_producao", chaves_pendentes)
        self.assertIn("produto_principal", chaves_pendentes)

        for p in pendencias:
            self.assertEqual(p["status"], "[a preencher]")

        # 4. Conferência de regras sobre os valores de Hip Hop 2027
        dados_conferencia = {
            "valor_total": 400000.00,
            "tipo_proponente": "pj",
            "custos_administrativos": 60000.00,   # 15%
            "remuneracao_captacao": 40000.00,     # 10%
            "acessibilidade_divulgacao": 80000.00 # 20%
        }
        val_res = validar_orcamento_rouanet(dados_conferencia)
        self.assertTrue(val_res["valido"], f"Orçamento do Hip Hop 2027 deve ser válido: {val_res.get('infracoes')}")
        aprovacoes_regras = [a["regra"] for a in val_res["aprovacoes"]]
        self.assertIn("limite_custos_administracao", aprovacoes_regras)
        self.assertIn("limite_remuneracao_captacao_recursos", aprovacoes_regras)
        self.assertIn("limite_custos_acessibilidade_divulgacao", aprovacoes_regras)
        self.assertIn("teto_por_projeto_pessoa_juridica", aprovacoes_regras)


if __name__ == "__main__":
    unittest.main()
