"""=============================================================================
CULTURA TRANSPARENTE - RECUPERADOR DA BASE DE CONHECIMENTO OFICIAL
Módulo: backend/conhecimento_retriever.py
=============================================================================
Carrega os documentos oficiais da base de conhecimento (backend/conhecimento/),
indexados por política e tipo, e seleciona os trechos regulamentares oficiais
pertinentes para alimentar o contexto do assistente de IA.
Garante que normas revogadas (como a IN MinC nº 23/2025) NUNCA sejam
enviadas ao modelo.
"""

import os
import json
import re
from typing import Dict, List, Any, Optional

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CONHECIMENTO_DIR = os.path.join(BASE_DIR, "conhecimento")
INDICE_PATH = os.path.join(CONHECIMENTO_DIR, "indice.json")


def carregar_indice() -> List[Dict[str, Any]]:
    """Carrega o índice oficial dos documentos em backend/conhecimento/indice.json."""
    if not os.path.exists(INDICE_PATH):
        return []
    try:
        with open(INDICE_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []


def carregar_conteudo_documento(nome_arquivo: str) -> str:
    """Lê o conteúdo textual de um documento da base oficial."""
    if not nome_arquivo:
        return ""
    caminho = os.path.join(CONHECIMENTO_DIR, nome_arquivo)
    if not os.path.exists(caminho):
        return ""
    try:
        with open(caminho, "r", encoding="utf-8") as f:
            return f.read()
    except Exception:
        return ""


def identificar_politica(texto_usuario: str) -> Optional[str]:
    """Identifica se o usuário já mencionou ou escolheu uma política específica."""
    txt = (texto_usuario or "").lower()
    if any(k in txt for k in ["rouanet", "pronac", "8.313", "8313", "salic", "in 29", "in29", "mecenato", "incentivo a projetos culturais"]):
        return "ROUANET"
    if any(k in txt for k in ["pnab", "aldir blanc", "14.399", "14399"]):
        return "PNAB"
    if any(k in txt for k in ["lpg", "paulo gustavo", "195", "audiovisual"]):
        return "LPG"
    if any(k in txt for k in ["emenda", "parlamentar", "mrosc", "13.019", "13019", "termo de fomento"]):
        return "EMENDAS"
    if any(k in txt for k in ["municipal", "viamao", "viamão", "secult", "prefeitura"]):
        return "MUNICIPAL"
    return None


def obter_documentos_por_politica(politica: Optional[str]) -> List[Dict[str, Any]]:
    """
    Retorna os metadados dos documentos do índice correspondentes à política escolhida.
    NUNCA inclui documentos com status 'revogada' (ex: IN 23/2025).
    """
    indice = carregar_indice()
    # Filtro de segurança absoluto: exclui qualquer documento revogado
    docs_ativos = [doc for doc in indice if str(doc.get("status", "")).lower() != "revogada"]

    if not politica:
        return docs_ativos

    politica_norm = politica.upper()
    docs_filtrados = []
    for doc in docs_ativos:
        p = doc.get("politica", "").upper()
        if politica_norm == "ROUANET" and ("ROUANET" in p or "FOMENTO CULTURAL" in p):
            docs_filtrados.append(doc)
        elif politica_norm == "PNAB" and ("PNAB" in p or "FOMENTO CULTURAL" in p):
            docs_filtrados.append(doc)
        elif politica_norm == "LPG" and ("LPG" in p or "FOMENTO CULTURAL" in p):
            docs_filtrados.append(doc)
        elif politica_norm == "EMENDAS" and ("EMENDAS" in p or "MROSC" in p or "FOMENTO CULTURAL" in p):
            docs_filtrados.append(doc)
        elif politica_norm == "MUNICIPAL" and ("MUNICIPAL" in p or "FOMENTO CULTURAL" in p):
            docs_filtrados.append(doc)

    return docs_filtrados if docs_filtrados else docs_ativos


def extrair_trechos_relevantes(
    texto_doc: str,
    palavras_chave: List[str],
    tamanho_max_caracteres: int = 4000
) -> str:
    """Extrai parágrafos ou artigos que contenham palavras-chave pertinentes."""
    if not texto_doc:
        return ""

    linhas = texto_doc.splitlines()
    blocos = []
    bloco_atual = []

    for linha in linhas:
        if re.match(r'^(#|Art\.|CAPÍTULO|Seção|ANEXO)', linha.strip(), re.IGNORECASE) and bloco_atual:
            blocos.append("\n".join(bloco_atual))
            bloco_atual = [linha]
        else:
            bloco_atual.append(linha)
    if bloco_atual:
        blocos.append("\n".join(bloco_atual))

    blocos_selecionados = []
    caracteres_acumulados = 0

    for b in blocos:
        b_lower = b.lower()
        if any(pk.lower() in b_lower for pk in palavras_chave):
            if caracteres_acumulados + len(b) > tamanho_max_caracteres:
                break
            blocos_selecionados.append(b)
            caracteres_acumulados += len(b)

    if not blocos_selecionados:
        return texto_doc[:tamanho_max_caracteres]

    return "\n---\n".join(blocos_selecionados)


def extrair_contexto_conhecimento(
    politica: Optional[str] = None,
    etapa_atual: int = 1,
    user_query: str = "",
    limite_total_caracteres: int = 20000
) -> str:
    """
    Monta o contexto oficial a ser injetado no prompt de sistema do Gemini,
    filtrando pelos documentos da política e tópicos da etapa do projeto.
    Garante que documentos com status 'revogada' jamais sejam carregados.
    """
    docs = obter_documentos_por_politica(politica)
    if not docs:
        return ""

    if (politica or "").upper() == "ROUANET":
        palavras_por_etapa = {
            1: ["rouanet", "pronac", "8.313", "salic", "in 29", "apresentação", "período"],
            2: ["proponente", "pessoa física", "microempreendedor", "pessoa jurídica", "cnae", "portfólio", "carteira", "limite"],
            3: ["artigo 18", "artigo 26", "enquadramento", "segmento", "área cultural", "dedução fiscal"],
            4: ["produto principal", "produto secundário", "proposta", "ação cultural", "sintese"],
            5: ["objetivos", "justificativa", "interesse público", "impacto cultural", "difusão"],
            6: ["local", "município", "cronograma", "36 meses", "fases", "pré-produção", "produção", "pós-produção"],
            7: ["distribuição", "gratuita", "democratização", "social", "educativo", "ingressos", "50,00", "250,00", "cota"],
            8: ["acessibilidade", "libras", "audiodescrição", "guia de acessibilidade", "deficiência", "mobilidade reduzida", "anexo iii"],
            9: ["marcas", "pronac", "lei rouanet", "manual", "ministério da cultura", "governo federal", "5 dias úteis"],
            10: ["ficha técnica", "currículo", "direitos autorais", "equipe", "anexo ii"],
            11: ["administração", "15%", "captação", "10%", "150.000", "acessibilidade", "20%", "cachês", "25.000", "50.000", "orçamento analítico"],
            12: ["admissibilidade", "portaria de autorização", "captação", "salic", "prestação de contas", "conferência"]
        }
    else:
        palavras_por_etapa = {
            1: ["objeto", "finalidade", "institui", "abrangência", "recurso"],
            2: ["projeto", "ação", "linguagem", "iniciativa"],
            3: ["proponente", "pessoa física", "coletivo", "sociedade civil", "vedação", "inscrição"],
            4: ["objetivo", "finalidade", "interesse público", "impacto"],
            5: ["descentralização", "território", "periferia", "comunidade", "acesso"],
            6: ["execução", "atividades", "plano de trabalho", "etapas"],
            7: ["acessibilidade", "libras", "audiodescrição", "deficiência", "mobilidade"],
            8: ["contrapartida", "democratização", "gratuito", "escola pública"],
            9: ["cronograma", "vigência", "prazo", "fases"],
            10: ["orçamento", "despesas", "rubrica", "vedação", "prestação de contas"],
            11: ["documento", "certidão", "prestação de contas", "comprovação"]
        }

    keywords = palavras_por_etapa.get(etapa_atual, ["artigo", "edital", "regra"])
    if user_query:
        keywords.extend([w for w in re.findall(r'\b\w{4,}\b', user_query.lower()) if w not in keywords][:3])

    partes_contexto = []
    caracteres_restantes = limite_total_caracteres

    for doc in docs:
        if str(doc.get("status", "")).lower() == "revogada":
            continue

        conteudo = carregar_conteudo_documento(doc.get("arquivo", ""))
        if not conteudo:
            continue

        titulo = doc.get("titulo", "Documento Oficial")
        url = doc.get("url_oficial", "")
        status = doc.get("status", "")

        if status == "pendente_adicao_manual":
            partes_contexto.append(
                f"[DOCUMENTO OFICIAL: {titulo}]\n"
                f"Status: Pendente de inclusão pelo gestor cultural.\n"
                f"URL de acompanhamento: {url}\n"
                f"Nota: Se o usuário perguntar por regras específicas deste edital que não constem na base, informe que o edital ainda não está indexado na íntegra e indique a URL oficial.\n"
            )
            continue

        cota_doc = max(1500, caracteres_restantes // max(1, len(docs)))
        trecho = extrair_trechos_relevantes(conteudo, keywords, tamanho_max_caracteres=cota_doc)

        header_doc = f"=== DOCUMENTO OFICIAL: {titulo} (Origem: {url}) ===\n"
        bloco_doc = header_doc + trecho + "\n\n"

        if len(bloco_doc) > caracteres_restantes:
            bloco_doc = bloco_doc[:caracteres_restantes]

        partes_contexto.append(bloco_doc)
        caracteres_restantes -= len(bloco_doc)
        if caracteres_restantes <= 500:
            break

    return (
        "\n=== BASE DE CONHECIMENTO OFICIAL (LEGISLAÇÃO E DOCUMENTOS FEDERAIS/MUNICIPAIS) ===\n"
        "TODAS as respostas sobre regras, prazos, critérios e requisitos DEVEM ser fundamentadas unicamente nestes documentos oficiais.\n\n"
        + "".join(partes_contexto)
    )
