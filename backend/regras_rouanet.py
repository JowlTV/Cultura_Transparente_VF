"""=============================================================================
CULTURA TRANSPARENTE - MOTOR DE REGRAS VERIFICÁVEIS DA LEI ROUANET
Módulo: backend/regras_rouanet.py
=============================================================================
Carrega as regras oficiais da Lei Rouanet (IN MinC nº 29/2026 e Lei 8.313/1991)
armazenadas em backend/conhecimento/regras_rouanet.json e executa validações
orçamentárias e de conformidade exclusivamente por código, sem delegar
cálculos ou interpretação de limites ao modelo de linguagem.
"""

import os
import json
from typing import Dict, List, Any, Optional

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CONHECIMENTO_DIR = os.path.join(BASE_DIR, "conhecimento")
REGRAS_PATH = os.path.join(CONHECIMENTO_DIR, "regras_rouanet.json")
IN29_PATH = os.path.join(CONHECIMENTO_DIR, "in_minc_29_2026_rouanet.txt")


def carregar_regras_rouanet() -> List[Dict[str, Any]]:
    """Carrega o catálogo de regras verificáveis da Rouanet."""
    if not os.path.exists(REGRAS_PATH):
        return []
    try:
        with open(REGRAS_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []


def obter_regra_por_id(identificador: str) -> Optional[Dict[str, Any]]:
    """Retorna uma regra específica pelo seu identificador."""
    for regra in carregar_regras_rouanet():
        if regra.get("identificador") == identificador:
            return regra
    return None


def verificar_integridade_citacoes_literais() -> Dict[str, Any]:
    """
    Confirma programaticamente que cada citação literal registrada em
    regras_rouanet.json existe exatamente no texto oficial armazenado
    da IN MinC nº 29/2026. Regra sem correspondência exata falha a checagem.
    """
    if not os.path.exists(IN29_PATH):
        return {
            "sucesso": False,
            "erro": f"Arquivo da IN 29/2026 não encontrado em {IN29_PATH}",
            "regras_validadas": 0,
            "falhas": []
        }

    with open(IN29_PATH, "r", encoding="utf-8") as f:
        in29_texto = f.read()

    regras = carregar_regras_rouanet()
    if not regras:
        return {
            "sucesso": False,
            "erro": "Nenhuma regra encontrada em regras_rouanet.json",
            "regras_validadas": 0,
            "falhas": []
        }

    falhas = []
    validadas = 0

    for r in regras:
        citacao = r.get("citacao_literal", "")
        if not citacao:
            falhas.append({
                "identificador": r.get("identificador"),
                "motivo": "Campo citacao_literal ausente ou vazio"
            })
            continue

        if citacao not in in29_texto:
            falhas.append({
                "identificador": r.get("identificador"),
                "referencia": r.get("referencia"),
                "citacao_esperada": citacao,
                "motivo": "Citação literal não encontrada exatamente no texto da IN 29/2026"
            })
        else:
            validadas += 1

    return {
        "sucesso": len(falhas) == 0,
        "total_regras": len(regras),
        "regras_validadas": validadas,
        "falhas": falhas
    }


def validar_orcamento_rouanet(dados: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validação matemática e programática do orçamento da Lei Rouanet (IN MinC nº 29/2026).
    
    Campos aceitos em dados:
    - valor_total: float (obrigatório para cálculos percentuais)
    - tipo_proponente: 'pf' | 'mei' | 'pj' | str
    - custos_administrativos: float (opcional)
    - remuneracao_captacao: float (opcional)
    - acessibilidade_divulgacao: float (opcional)
    - remuneracao_proponente: float (opcional)
    - caches_individuais: List[float] (opcional)
    - caches_grupos: List[float] (opcional)
    - percentual_distribuicao_social: float (opcional, % de ingressos gratuitos sociais)
    - percentual_ingressos_populares: float (opcional, % de ingressos até R$ 50,00)
    - preco_medio_ingressos: float (opcional)
    """
    regras = {r["identificador"]: r for r in carregar_regras_rouanet()}
    
    infracoes = []
    aprovacoes = []
    pendencias = []

    valor_total = dados.get("valor_total")
    if valor_total is None or valor_total <= 0:
        pendencias.append({
            "campo": "valor_total",
            "mensagem": "Valor total do projeto ainda não informado para cálculo dos percentuais regulamentares."
        })
        return {
            "valido": False,
            "infracoes": infracoes,
            "aprovacoes": aprovacoes,
            "pendencias": pendencias,
            "resumo": "Aguardando definição do valor total do projeto pelo proponente."
        }

    tipo_prop = str(dados.get("tipo_proponente", "")).lower().strip()

    # 1. Teto do projeto por perfil do proponente (Art. 11)
    if "pf" in tipo_prop or "física" in tipo_prop or "fisica" in tipo_prop:
        r_teto_pf = regras.get("teto_por_projeto_pessoa_fisica", {})
        limite_pf = float(r_teto_pf.get("valor", 500000.0))
        if valor_total > limite_pf:
            infracoes.append({
                "regra": "teto_por_projeto_pessoa_fisica",
                "referencia": r_teto_pf.get("referencia", "Art. 11, I"),
                "citacao": r_teto_pf.get("citacao_literal", ""),
                "valor_informado": valor_total,
                "limite_permitido": limite_pf,
                "mensagem": f"O valor total de R$ {valor_total:,.2f} excede o limite máximo de R$ {limite_pf:,.2f} para proponente pessoa física (Art. 11, inciso I da IN 29/2026)."
            })
        else:
            aprovacoes.append({
                "regra": "teto_por_projeto_pessoa_fisica",
                "referencia": r_teto_pf.get("referencia", "Art. 11, I"),
                "mensagem": f"Valor total de R$ {valor_total:,.2f} dentro do teto de R$ {limite_pf:,.2f} para pessoa física."
            })
    elif "pj" in tipo_prop or "jurídica" in tipo_prop or "juridica" in tipo_prop or "empresa" in tipo_prop or "associação" in tipo_prop or "associacao" in tipo_prop:
        r_teto_pj = regras.get("teto_por_projeto_pessoa_juridica", {})
        limite_pj = float(r_teto_pj.get("valor", 1500000.0))
        if valor_total > limite_pj:
            # Nota: alguns projetos específicos superam esse teto (Art. 12/13/14), mas o teto padrão é R$ 1.500.000,00
            infracoes.append({
                "regra": "teto_por_projeto_pessoa_juridica",
                "referencia": r_teto_pj.get("referencia", "Art. 11, II"),
                "citacao": r_teto_pj.get("citacao_literal", ""),
                "valor_informado": valor_total,
                "limite_permitido": limite_pj,
                "mensagem": f"O valor total de R$ {valor_total:,.2f} excede o limite geral de R$ {limite_pj:,.2f} para projetos de pessoa jurídica (Art. 11, inciso II da IN 29/2026)."
            })
        else:
            aprovacoes.append({
                "regra": "teto_por_projeto_pessoa_juridica",
                "referencia": r_teto_pj.get("referencia", "Art. 11, II"),
                "mensagem": f"Valor total de R$ {valor_total:,.2f} dentro do teto geral de R$ {limite_pj:,.2f} para pessoa jurídica."
            })
    else:
        pendencias.append({
            "campo": "tipo_proponente",
            "mensagem": "Tipo de proponente (Pessoa Física, MEI ou Pessoa Jurídica) não identificado para checagem do teto orçamentário do Art. 11."
        })

    # 2. Custos Administrativos (Art. 22 - máx 15%)
    custos_admin = dados.get("custos_administrativos")
    if custos_admin is not None:
        r_admin = regras.get("limite_custos_administracao", {})
        teto_pct_admin = float(r_admin.get("valor", 15.0))
        pct_admin = (custos_admin / valor_total) * 100.0
        limite_valor_admin = valor_total * (teto_pct_admin / 100.0)

        if pct_admin > teto_pct_admin + 0.001:
            infracoes.append({
                "regra": "limite_custos_administracao",
                "referencia": r_admin.get("referencia", "Art. 22"),
                "citacao": r_admin.get("citacao_literal", ""),
                "percentual_calculado": round(pct_admin, 2),
                "percentual_limite": teto_pct_admin,
                "valor_informado": custos_admin,
                "valor_maximo_permitido": limite_valor_admin,
                "mensagem": f"Custos de administração (R$ {custos_admin:,.2f}) representam {pct_admin:.2f}% do projeto, superando o limite legal de {teto_pct_admin:.0f}% (máximo permitido de R$ {limite_valor_admin:,.2f}) conforme Art. 22 da IN 29/2026."
            })
        else:
            aprovacoes.append({
                "regra": "limite_custos_administracao",
                "referencia": r_admin.get("referencia", "Art. 22"),
                "percentual_calculado": round(pct_admin, 2),
                "mensagem": f"Custos de administração (R$ {custos_admin:,.2f} = {pct_admin:.2f}%) em conformidade com o limite de até {teto_pct_admin:.0f}% (Art. 22)."
            })
    else:
        pendencias.append({
            "campo": "custos_administrativos",
            "mensagem": "Valor de custos administrativos ainda não especificado pelo proponente para conferência do teto de 15% (Art. 22)."
        })

    # 3. Remuneração para Captação de Recursos (Art. 19 - máx 10% e teto R$ 150.000,00)
    remun_capt = dados.get("remuneracao_captacao")
    if remun_capt is not None:
        r_capt = regras.get("limite_remuneracao_captacao_recursos", {})
        teto_pct_capt = float(r_capt.get("valor", 10.0))
        teto_abs_capt = float(r_capt.get("teto_monetario", 150000.0))
        pct_capt = (remun_capt / valor_total) * 100.0
        limite_valor_capt = min(valor_total * (teto_pct_capt / 100.0), teto_abs_capt)

        if pct_capt > teto_pct_capt + 0.001 or remun_capt > teto_abs_capt + 0.001:
            motivo = []
            if pct_capt > teto_pct_capt + 0.001:
                motivo.append(f"{pct_capt:.2f}% excede o limite de {teto_pct_capt:.0f}%")
            if remun_capt > teto_abs_capt + 0.001:
                motivo.append(f"R$ {remun_capt:,.2f} excede o teto fixo de R$ {teto_abs_capt:,.2f}")

            infracoes.append({
                "regra": "limite_remuneracao_captacao_recursos",
                "referencia": r_capt.get("referencia", "Art. 19"),
                "citacao": r_capt.get("citacao_literal", ""),
                "percentual_calculado": round(pct_capt, 2),
                "valor_informado": remun_capt,
                "limite_permitido": limite_valor_capt,
                "mensagem": f"Remuneração para captação de recursos (R$ {remun_capt:,.2f}) irregular: {', e '.join(motivo)} (Art. 19 da IN 29/2026)."
            })
        else:
            aprovacoes.append({
                "regra": "limite_remuneracao_captacao_recursos",
                "referencia": r_capt.get("referencia", "Art. 19"),
                "percentual_calculado": round(pct_capt, 2),
                "mensagem": f"Remuneração para captação (R$ {remun_capt:,.2f} = {pct_capt:.2f}%) em conformidade com o limite de 10% e teto de R$ {teto_abs_capt:,.2f} (Art. 19)."
            })
    else:
        pendencias.append({
            "campo": "remuneracao_captacao",
            "mensagem": "Valor destinado à remuneração para captação de recursos ainda não informado (Art. 19)."
        })

    # 4. Custos de Acessibilidade, Comunicação e Divulgação Acessíveis (Art. 20 - máx 20%)
    acess_div = dados.get("acessibilidade_divulgacao")
    if acess_div is not None:
        r_acess = regras.get("limite_custos_acessibilidade_divulgacao", {})
        teto_pct_acess = float(r_acess.get("valor", 20.0))
        pct_acess = (acess_div / valor_total) * 100.0
        limite_valor_acess = valor_total * (teto_pct_acess / 100.0)

        if pct_acess > teto_pct_acess + 0.001:
            infracoes.append({
                "regra": "limite_custos_acessibilidade_divulgacao",
                "referencia": r_acess.get("referencia", "Art. 20"),
                "citacao": r_acess.get("citacao_literal", ""),
                "percentual_calculado": round(pct_acess, 2),
                "valor_informado": acess_div,
                "limite_permitido": limite_valor_acess,
                "mensagem": f"Custos de acessibilidade e divulgação acessíveis (R$ {acess_div:,.2f} = {pct_acess:.2f}%) excedem o limite de {teto_pct_acess:.0f}% (máximo permitido de R$ {limite_valor_acess:,.2f}) conforme Art. 20 da IN 29/2026."
            })
        else:
            aprovacoes.append({
                "regra": "limite_custos_acessibilidade_divulgacao",
                "referencia": r_acess.get("referencia", "Art. 20"),
                "percentual_calculado": round(pct_acess, 2),
                "mensagem": f"Custos de acessibilidade e divulgação (R$ {acess_div:,.2f} = {pct_acess:.2f}%) dentro do teto de {teto_pct_acess:.0f}% (Art. 20)."
            })
    else:
        pendencias.append({
            "campo": "acessibilidade_divulgacao",
            "mensagem": "Custos de acessibilidade e comunicação ainda não discriminados para conferência do teto de 20% (Art. 20)."
        })

    # 5. Remuneração do Proponente (Art. 23 - máx 20% geral ou 30% PF/MEI)
    remun_prop = dados.get("remuneracao_proponente")
    if remun_prop is not None:
        is_pf_mei = any(k in tipo_prop for k in ["pf", "física", "fisica", "mei"])
        r_prop = regras.get("limite_remuneracao_proponente_pf_mei" if is_pf_mei else "limite_remuneracao_proponente_geral", {})
        teto_pct_prop = 30.0 if is_pf_mei else 20.0
        pct_prop = (remun_prop / valor_total) * 100.0
        limite_valor_prop = valor_total * (teto_pct_prop / 100.0)

        if pct_prop > teto_pct_prop + 0.001:
            infracoes.append({
                "regra": "limite_remuneracao_proponente",
                "referencia": r_prop.get("referencia", "Art. 23"),
                "citacao": r_prop.get("citacao_literal", ""),
                "percentual_calculado": round(pct_prop, 2),
                "valor_informado": remun_prop,
                "limite_permitido": limite_valor_prop,
                "mensagem": f"Remuneração do proponente (R$ {remun_prop:,.2f} = {pct_prop:.2f}%) excede o limite de {teto_pct_prop:.0f}% previsto no Art. 23 da IN 29/2026."
            })
        else:
            aprovacoes.append({
                "regra": "limite_remuneracao_proponente",
                "referencia": r_prop.get("referencia", "Art. 23"),
                "percentual_calculado": round(pct_prop, 2),
                "mensagem": f"Remuneração do proponente (R$ {remun_prop:,.2f} = {pct_prop:.2f}%) dentro do limite de {teto_pct_prop:.0f}% (Art. 23)."
            })

    # 6. Cachês Artísticos Individuais (Art. 26, I - máx R$ 25.000,00 por apresentação)
    caches_ind = dados.get("caches_individuais", [])
    if isinstance(caches_ind, list):
        r_cache_ind = regras.get("limite_cache_artista_individual", {})
        teto_cache_ind = float(r_cache_ind.get("valor", 25000.0))
        for idx, cache in enumerate(caches_ind):
            if cache > teto_cache_ind:
                infracoes.append({
                    "regra": "limite_cache_artista_individual",
                    "referencia": r_cache_ind.get("referencia", "Art. 26, I"),
                    "citacao": r_cache_ind.get("citacao_literal", ""),
                    "valor_informado": cache,
                    "limite_permitido": teto_cache_ind,
                    "mensagem": f"Cachê individual de artista informado (R$ {cache:,.2f}) excede o limite de R$ {teto_cache_ind:,.2f} por apresentação com recursos incentivados (Art. 26, I da IN 29/2026)."
                })

    # 7. Cachês Artísticos para Grupos (Art. 26, II - máx R$ 50.000,00 por apresentação)
    caches_grp = dados.get("caches_grupos", [])
    if isinstance(caches_grp, list):
        r_cache_grp = regras.get("limite_cache_grupo_coletivo", {})
        teto_cache_grp = float(r_cache_grp.get("valor", 50000.0))
        for idx, cache in enumerate(caches_grp):
            if cache > teto_cache_grp:
                infracoes.append({
                    "regra": "limite_cache_grupo_coletivo",
                    "referencia": r_cache_grp.get("referencia", "Art. 26, II"),
                    "citacao": r_cache_grp.get("citacao_literal", ""),
                    "valor_informado": cache,
                    "limite_permitido": teto_cache_grp,
                    "mensagem": f"Cachê de grupo/coletivo informado (R$ {cache:,.2f}) excede o limite de R$ {teto_cache_grp:,.2f} por apresentação com recursos incentivados (Art. 26, II da IN 29/2026)."
                })

    # 8. Democratização: Distribuição gratuita social (Art. 41, III - mín 10%)
    pct_social = dados.get("percentual_distribuicao_social")
    if pct_social is not None:
        r_social = regras.get("distribuicao_gratuita_carater_social_educativo", {})
        min_social = float(r_social.get("valor", 10.0))
        if pct_social < min_social - 0.001:
            infracoes.append({
                "regra": "distribuicao_gratuita_carater_social_educativo",
                "referencia": r_social.get("referencia", "Art. 41, III"),
                "citacao": r_social.get("citacao_literal", ""),
                "percentual_calculado": round(pct_social, 2),
                "minimo_exigido": min_social,
                "mensagem": f"A cota de distribuição gratuita com caráter social ou educativo ({pct_social:.1f}%) está abaixo do mínimo exigido de {min_social:.0f}% (Art. 41, inciso III da IN 29/2026)."
            })
        else:
            aprovacoes.append({
                "regra": "distribuicao_gratuita_carater_social_educativo",
                "referencia": r_social.get("referencia", "Art. 41, III"),
                "mensagem": f"Cota de distribuição gratuita social ({pct_social:.1f}%) cumpre o mínimo de {min_social:.0f}% (Art. 41, III)."
            })

    # 9. Democratização: Ingressos Populares (Art. 41, IV - mín 20% com teto R$ 50,00)
    pct_pop = dados.get("percentual_ingressos_populares")
    if pct_pop is not None:
        r_pop = regras.get("comercializacao_ingressos_populares", {})
        min_pop = float(r_pop.get("valor", 20.0))
        if pct_pop < min_pop - 0.001:
            infracoes.append({
                "regra": "comercializacao_ingressos_populares",
                "referencia": r_pop.get("referencia", "Art. 41, IV"),
                "citacao": r_pop.get("citacao_literal", ""),
                "percentual_calculado": round(pct_pop, 2),
                "minimo_exigido": min_pop,
                "mensagem": f"A cota de ingressos a preços populares até R$ 50,00 ({pct_pop:.1f}%) está abaixo do mínimo obrigatório de {min_pop:.0f}% (Art. 41, inciso IV da IN 29/2026)."
            })
        else:
            aprovacoes.append({
                "regra": "comercializacao_ingressos_populares",
                "referencia": r_pop.get("referencia", "Art. 41, IV"),
                "mensagem": f"Cota de ingressos populares ({pct_pop:.1f}%) atende ao piso de {min_pop:.0f}% com teto de R$ 50,00 (Art. 41, IV)."
            })

    # 10. Democratização: Preço médio (Art. 41, § 3º - máx R$ 250,00)
    preco_medio = dados.get("preco_medio_ingressos")
    if preco_medio is not None:
        r_pmedio = regras.get("teto_preco_medio_ingressos", {})
        teto_pmedio = float(r_pmedio.get("valor", 250.0))
        if preco_medio > teto_pmedio:
            infracoes.append({
                "regra": "teto_preco_medio_ingressos",
                "referencia": r_pmedio.get("referencia", "Art. 41, § 3º"),
                "citacao": r_pmedio.get("citacao_literal", ""),
                "valor_informado": preco_medio,
                "limite_permitido": teto_pmedio,
                "mensagem": f"O preço médio dos ingressos informados (R$ {preco_medio:,.2f}) excede o limite legal de R$ {teto_pmedio:,.2f} (Art. 41, § 3º da IN 29/2026)."
            })
        else:
            aprovacoes.append({
                "regra": "teto_preco_medio_ingressos",
                "referencia": r_pmedio.get("referencia", "Art. 41, § 3º"),
                "mensagem": f"Preço médio dos ingressos (R$ {preco_medio:,.2f}) dentro do teto de R$ {teto_pmedio:,.2f} (Art. 41, § 3º)."
            })

    valido = len(infracoes) == 0

    return {
        "valido": valido,
        "valor_total_analisado": valor_total,
        "total_aprovacoes": len(aprovacoes),
        "total_infracoes": len(infracoes),
        "total_pendencias": len(pendencias),
        "infracoes": infracoes,
        "aprovacoes": aprovacoes,
        "pendencias": pendencias,
        "resumo": "Orçamento aprovado nas regras verificadas da IN 29/2026." if valido else f"Identificadas {len(infracoes)} infração(ões) orçamentária(s) aos limites da IN 29/2026."
    }


def calcular_custos_vinculados_e_cenarios(
    valor_informado: float,
    pct_acessibilidade: float = 20.0,
    pct_administracao: float = 15.0,
    pct_captacao: float = 10.0,
    incluir_acessibilidade: bool = True,
    incluir_administracao: bool = True,
    incluir_captacao: bool = True
) -> Dict[str, Any]:
    """
    Calcula os custos vinculados da Lei Rouanet e apresenta os dois cenários:
    - Cenário A: O valor informado é o custo direto das atividades. Os custos vinculados
      são adicionados ao projeto, gerando o total global.
    - Cenário B: O valor informado é o total geral do projeto. Os custos vinculados são
      subtraídos para encontrar o saldo disponível para as atividades culturais.
    
    Limites da IN MinC nº 29/2026:
    - Acessibilidade: máx. 20% (Art. 20)
    - Administração: máx. 15% (Art. 22)
    - Captação: máx. 10% limitado a R$ 150.000,00 (Art. 19)
    """
    p_acess = min(max(0.0, pct_acessibilidade), 20.0) if incluir_acessibilidade else 0.0
    p_admin = min(max(0.0, pct_administracao), 15.0) if incluir_administracao else 0.0
    p_capt = min(max(0.0, pct_captacao), 10.0) if incluir_captacao else 0.0

    # Cenário A: valor_informado é CUSTO DAS ATIVIDADES
    acess_a = valor_informado * (p_acess / 100.0)
    admin_a = valor_informado * (p_admin / 100.0)
    capt_a = min(valor_informado * (p_capt / 100.0), 150000.0)
    total_vinculados_a = acess_a + admin_a + capt_a
    total_projeto_a = valor_informado + total_vinculados_a

    # Cenário B: valor_informado é TOTAL DO PROJETO COM VINCULADOS INCLUSOS
    acess_b = valor_informado * (p_acess / 100.0)
    admin_b = valor_informado * (p_admin / 100.0)
    capt_b = min(valor_informado * (p_capt / 100.0), 150000.0)
    total_vinculados_b = acess_b + admin_b + capt_b
    atividades_disponiveis_b = max(0.0, valor_informado - total_vinculados_b)

    return {
        "valor_informado": valor_informado,
        "percentuais_aplicados": {
            "acessibilidade": p_acess,
            "administracao": p_admin,
            "captacao": p_capt
        },
        "cenario_a_atividades_para_total": {
            "descricao": "Valor informado considerado como Custo Direto das Atividades",
            "custo_atividades": valor_informado,
            "custo_acessibilidade": round(acess_a, 2),
            "custo_administracao": round(admin_a, 2),
            "remuneracao_captacao": round(capt_a, 2),
            "total_custos_vinculados": round(total_vinculados_a, 2),
            "total_geral_projeto": round(total_projeto_a, 2)
        },
        "cenario_b_total_para_atividades": {
            "descricao": "Valor informado considerado como Total do Projeto com Vinculados Inclusos",
            "total_geral_projeto": valor_informado,
            "custo_acessibilidade": round(acess_b, 2),
            "custo_administracao": round(admin_b, 2),
            "remuneracao_captacao": round(capt_b, 2),
            "total_custos_vinculados": round(total_vinculados_b, 2),
            "saldo_para_atividades": round(atividades_disponiveis_b, 2)
        }
    }


def identificar_pendencias_salic(proposta: Dict[str, Any]) -> List[Dict[str, str]]:
    """
    Identifica todos os campos obrigatórios do Salic que não foram informados
    pelo usuário e devem ser marcados explicitamente como '[a preencher]'.
    """
    campos_obrigatorios = [
        ("identificacao_proponente", "Nome do Proponente / Razão Social", "Identificação da Proposta"),
        ("cpf_cnpj", "CPF ou CNPJ do Proponente", "Identificação da Proposta"),
        ("dados_bancarios", "Conta Bancária Específica no Banco do Brasil", "Identificação da Proposta"),
        ("endereco_completo", "Endereço Completo do Proponente", "Identificação da Proposta"),
        ("declaracao_pendencias_minc", "Declaração de Inexistência de Pendências com o MinC", "Identificação da Proposta"),
        ("objetivo_geral", "Objetivo Geral do Projeto (Art. 3º da Lei 8.313/1991)", "Objetivo e Justificativa"),
        ("justificativa", "Justificativa e Impacto Cultural", "Objetivo e Justificativa"),
        ("enquadramento_artigo", "Enquadramento Legal (Art. 18 ou Art. 26 da Lei 8.313/1991)", "Objetivo e Justificativa"),
        ("produto_principal", "Definição do Produto Cultural Principal (apenas um)", "Produtos"),
        ("produto_tipo", "Tipo de Produto (selecionar na lista oficial do Salic)", "Produtos"),
        ("area_cultural", "Área Cultural (selecionar na lista oficial do Salic)", "Produtos"),
        ("segmento_cultural", "Segmento Cultural (selecionar na lista oficial do Salic)", "Produtos"),
        ("transmissao_canal_aberto", "Transmissão em Canal Aberto (Sim/Não)", "Produtos"),
        ("sinopse_obra", "Sinopse da Obra e Classificação Indicativa", "Por Produto"),
        ("especificacao_tecnica", "Especificação Técnica do Produto (duração, tiragem, carga horária)", "Por Produto"),
        ("descricao_atividade", "Descrição da Atividade e Programação", "Por Produto"),
        ("acessibilidade_fisica", "Acessibilidade Física (locomoção, rampas, banheiros acessíveis)", "Responsabilidade Social"),
        ("acessibilidade_conteudo", "Acessibilidade de Conteúdo (Libras, audiodescrição, Braille)", "Responsabilidade Social"),
        ("democratizacao_acesso", "Democratização de Acesso e Medidas de Ampliação", "Responsabilidade Social"),
        ("duracao_pre_producao", "Duração e Atividades da Pré-produção", "Etapas de Trabalho"),
        ("duracao_execucao", "Duração e Atividades da Execução", "Etapas de Trabalho"),
        ("duracao_pos_producao", "Duração e Atividades da Pós-produção", "Etapas de Trabalho"),
        ("atividade_dirigente", "Atividade do Dirigente ou Proponente no Projeto", "Ficha Técnica"),
        ("curriculos_equipe", "Currículo Resumido dos Principais Participantes", "Ficha Técnica"),
        ("local_realizacao", "Local de Realização das Atividades", "Plano de Distribuição"),
        ("publico_estimado", "Público Estimado de Beneficiários", "Plano de Distribuição"),
        ("quantidade_produtos", "Quantidade de Produtos ou Ingressos", "Plano de Distribuição"),
        ("distribuicao_gratuita", "Plano de Distribuição Gratuita Social (mín. 10%)", "Plano de Distribuição"),
        ("comercializacao_ingressos", "Plano de Comercialização e Ingressos Populares (mín. 20% até R$ 50)", "Plano de Distribuição"),
        ("natureza_valor_informado", "Natureza do Valor Informado (Custo de Atividades vs Total do Projeto)", "Planilha Orçamentária")
    ]

    pendencias = []
    for chave, rotulo, secao in campos_obrigatorios:
        val = proposta.get(chave)
        if val is None or str(val).strip() in ("", "[a preencher]", "null", "None"):
            pendencias.append({
                "campo": chave,
                "rotulo_salic": rotulo,
                "secao_salic": secao,
                "status": "[a preencher]"
            })

    return pendencias


def tratar_casos_especiais_rouanet(texto_usuario: str) -> Optional[Dict[str, Any]]:
    """
    Trata casos legais específicos da Lei 8.313/1991 e da IN MinC nº 29/2026:
    1. Escopo FNC / Ficart (Art. 2º, 4º e 8º): não conduzir proposta, explicar mecanismos distintos.
    2. Avaliação de Mérito Artístico (Art. 22): esclarecer vedação legal a apreciações subjetivas.
    3. Segmento do Art. 25, II (audiovisual/cinema/discografia): checar produção independente.
    4. Acesso Público Restrito (Art. 2º, §§ 1º e 2º): advertir vedação a circuitos privados.
    """
    if not texto_usuario:
        return None

    txt = texto_usuario.lower()

    # 1. FNC ou FICART
    if any(k in txt for k in ["fnc", "ficart", "fundo nacional de cultura", "fundos de investimento cultural"]):
        return {
            "caso": "escopo_fnc_ficart",
            "mensagem": (
                "O Fundo Nacional de Cultura (FNC) e os Fundos de Investimento Cultural e Artístico (Ficart) "
                "são mecanismos da Lei nº 8.313/1991 (arts. 4º e 8º) distintos do Incentivo a Projetos Culturais "
                "(Mecenato - Capítulo IV, arts. 18 a 30). Este assistente conduz propostas exclusivamente para "
                "o mecanismo de Incentivo a Projetos Culturais no Salic, regulamentado pela IN MinC nº 29/2026 "
                "e Decreto nº 11.453/2023. Você deseja preparar uma proposta para o Incentivo a Projetos Culturais da Lei Rouanet?"
            ),
            "etapa_atual": 1,
            "fontes_citadas": [
                {"documento": "Lei nº 8.313/1991", "trecho": "Arts. 2º, 4º e 8º"},
                {"documento": "Decreto nº 11.453/2023", "trecho": "Regulamentação do Fomento Cultural"}
            ]
        }

    # 2. Avaliação de Mérito Artístico (Art. 22 da Lei 8.313/1991)
    if any(k in txt for k in ["minha ideia é boa", "minha proposta é boa", "ideia é boa", "o que acha da ideia", "avaliar mérito", "avaliar qualidade", "acha que o projeto é bom"]):
        return {
            "caso": "merito_artistico_art22",
            "mensagem": (
                "De acordo com o art. 22 da Lei nº 8.313/1991, na análise de projetos culturais é expressamente "
                "vedada qualquer apreciação subjetiva quanto ao seu mérito artístico. A análise do Ministério da Cultura "
                "e da Comissão Nacional de Incentivo à Cultura (CNIC) é estritamente documental, orçamentária e de conformidade legal. "
                "Deseja estruturar os objetivos técnicos e justificativa de impacto cultural da sua proposta?"
            ),
            "fontes_citadas": [
                {"documento": "Lei nº 8.313/1991", "trecho": "Art. 22"}
            ]
        }

    # 3. Circuito restrito ou privado (Art. 2º, §§ 1º e 2º)
    if any(k in txt for k in ["circuito privado", "apenas convidados", "festa fechada", "evento privado", "somente associados", "coleção particular"]):
        return {
            "caso": "acesso_restrito_art2",
            "mensagem": (
                "Atenção: o art. 2º, §§ 1º e 2º da Lei nº 8.313/1991 estabelece que é expressamente vedada a destinação a circuitos privados "
                "ou a coleções particulares, exigindo que o produto cultural seja franqueado ao público em geral. "
                "Como o seu projeto garantirá o livre acesso e a democratização para a comunidade?"
            ),
            "fontes_citadas": [
                {"documento": "Lei nº 8.313/1991", "trecho": "Art. 2º, §§ 1º e 2º"}
            ]
        }

    # 4. Produção independente para audiovisual/cinema/foto/disco (Art. 25, II)
    if any(k in txt for k in ["cinema", "vídeo", "video", "curta-metragem", "longa-metragem", "documentário", "fotografia", "discografia", "disco"]) and not any(k in txt for k in ["independente", "produção independente"]):
        return {
            "caso": "producao_independente_art25",
            "mensagem": (
                "Para projetos na área de cinema, vídeo, fotografia e discografia (Art. 25, inciso II da Lei nº 8.313/1991), "
                "o parágrafo único estabelece que os incentivos somente serão concedidos a produções culturais independentes. "
                "Você confirma que a sua obra se enquadra como produção cultural independente?"
            ),
            "fontes_citadas": [
                {"documento": "Lei nº 8.313/1991", "trecho": "Art. 25, inciso II e parágrafo único"}
            ]
        }

    return None


