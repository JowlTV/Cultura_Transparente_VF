"""=============================================================================
CULTURA TRANSPARENTE - ATUALIZADOR AUTOMÁTICO DA BASE LEGAL
Módulo: backend/scrapers/recoletar_base_legal.py
=============================================================================
Executa a recoleta e saneamento de todas as normas federais da base legal,
eliminando trechos revogados (<strike>, <s>, <del>) e caracteres corrompidos,
gravando em UTF-8 e atualizando o indice.json.
=============================================================================
"""

import os
import json
from datetime import datetime
from backend.scrapers.legal_cleaner import baixar_e_limpar_documento_planalto

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONHECIMENTO_DIR = os.path.join(BASE_DIR, "conhecimento")
INDICE_PATH = os.path.join(CONHECIMENTO_DIR, "indice.json")


DOCUMENTOS_PLANALTO = [
    {
        "id": "lei_8313_1991_rouanet",
        "arquivo": "lei_8313_1991_rouanet.txt",
        "url": "https://www.planalto.gov.br/ccivil_03/leis/l8313cons.htm",
        "titulo": "Lei nº 8.313, de 23 de dezembro de 1991 (Lei Rouanet - Mecenato e Incentivo a Projetos Culturais - Texto Compilado Vigente)",
        "politica": "ROUANET"
    },
    {
        "id": "decreto_11453_2023_fomento",
        "arquivo": "decreto_11453_2023_fomento.txt",
        "url": "https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2023/decreto/d11453.htm",
        "titulo": "Decreto nº 11.453, de 23 de março de 2023 (Regulamenta os Mecanismos de Fomento do Sistema de Financiamento à Cultura - Base do Pronac)",
        "politica": "ROUANET"
    },
    {
        "id": "lei_14399_2022_pnab",
        "arquivo": "lei_14399_2022_pnab.txt",
        "url": "https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2022/lei/l14399.htm",
        "titulo": "Lei nº 14.399, de 8 de julho de 2022 (Institui a Política Nacional Aldir Blanc de Fomento à Cultura - PNAB)",
        "politica": "PNAB"
    },
    {
        "id": "decreto_11740_2023_pnab",
        "arquivo": "decreto_11740_2023_pnab.txt",
        "url": "https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2023/decreto/d11740.htm",
        "titulo": "Decreto nº 11.740, de 18 de outubro de 2023 (Regulamenta a PNAB)",
        "politica": "PNAB"
    },
    {
        "id": "lc_195_2022_lpg",
        "arquivo": "lc_195_2022_lpg.txt",
        "url": "https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp195.htm",
        "titulo": "Lei Complementar nº 195, de 8 de julho de 2022 (Lei Paulo Gustavo)",
        "politica": "LPG"
    },
    {
        "id": "decreto_11525_2023_lpg",
        "arquivo": "decreto_11525_2023_lpg.txt",
        "url": "https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2023/decreto/d11525.htm",
        "titulo": "Decreto nº 11.525, de 11 de maio de 2023 (Regulamenta a Lei Paulo Gustavo)",
        "politica": "LPG"
    },
    {
        "id": "lei_13019_2014_mrosc_fomento",
        "arquivo": "lei_13019_2014_mrosc_fomento.txt",
        "url": "https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l13019.htm",
        "titulo": "Lei nº 13.019, de 31 de julho de 2014 (Marco Regulatório das Organizações da Sociedade Civil - MROSC)",
        "politica": "EMENDAS"
    },
    {
        "id": "lei_14903_2024_marco_fomento",
        "arquivo": "lei_14903_2024_marco_fomento.txt",
        "url": "https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2024/lei/l14903.htm",
        "titulo": "Lei nº 14.903, de 27 de junho de 2024 (Marco Regulatório do Fomento à Cultura)",
        "politica": "FOMENTO CULTURAL"
    }
]


def recoletar_tudo():
    hoje = "2026-09-23"
    print(f"Iniciando recoleta e saneamento da base legal em {hoje}...")

    # Lê indice atual
    with open(INDICE_PATH, "r", encoding="utf-8") as f:
        indice = json.load(f)

    indice_map = {item["id"]: item for item in indice}

    for doc_info in DOCUMENTOS_PLANALTO:
        print(f"Recoletando {doc_info['id']} de {doc_info['url']}...")
        try:
            texto_limpo = baixar_e_limpar_documento_planalto(doc_info["url"])
            if len(texto_limpo) < 500:
                print(f"Aviso: texto muito curto para {doc_info['id']}, ignorando...")
                continue

            # Monta arquivo com cabeçalho canônico
            header = (
                f"# DOCUMENTO OFICIAL: {doc_info['titulo']}\n"
                f"# POLÍTICA: {doc_info['politica']}\n"
                f"# URL OFICIAL DE ORIGEM: {doc_info['url']}\n"
                f"# DATA DE COLETA: {hoje}\n"
                f"# STATUS: disponivel\n"
                f"{'='*80}\n\n"
            )
            conteudo_final = header + texto_limpo

            caminho_arquivo = os.path.join(CONHECIMENTO_DIR, doc_info["arquivo"])
            with open(caminho_arquivo, "w", encoding="utf-8") as out_f:
                out_f.write(conteudo_final)

            print(f"✓ Salvo {doc_info['arquivo']} ({len(conteudo_final)} caracteres UTF-8)")

            # Atualiza indice
            if doc_info["id"] in indice_map:
                indice_map[doc_info["id"]]["data_coleta"] = hoje
                indice_map[doc_info["id"]]["status"] = "disponivel"
        except Exception as e:
            print(f"Erro ao recoletar {doc_info['id']}: {e}")

    # Atualiza data de coleta em todos os documentos ativos do índice
    for item in indice:
        if item.get("status") == "disponivel":
            item["data_coleta"] = hoje

    with open(INDICE_PATH, "w", encoding="utf-8") as f:
        json.dump(indice, f, ensure_ascii=False, indent=2)

    print("✓ indice.json atualizado com sucesso!")


if __name__ == "__main__":
    recoletar_tudo()
