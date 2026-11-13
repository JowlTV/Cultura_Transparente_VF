"""=============================================================================
CULTURA TRANSPARENTE - CARREGADOR CENTRAL DE ROTEIROS (FONTE ÚNICA)
Arquivo: backend/roteiros_loader.py
=============================================================================
Lê src/config/roteiros.json como fonte única de verdade compartilhada
entre o backend (Python) e o frontend (TypeScript/React).
"""

import json
import os
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger("RoteirosLoader")

ROTEIROS_FILE_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "src", "config", "roteiros.json")
)

_ROTEIROS_CACHE: Optional[Dict[str, Any]] = None


def carregar_roteiros(force_reload: bool = False) -> Dict[str, Any]:
    """Carrega o arquivo src/config/roteiros.json com cache em memória."""
    global _ROTEIROS_CACHE
    if _ROTEIROS_CACHE is not None and not force_reload:
        return _ROTEIROS_CACHE

    if not os.path.exists(ROTEIROS_FILE_PATH):
        raise FileNotFoundError(f"Arquivo central de roteiros não encontrado em: {ROTEIROS_FILE_PATH}")

    with open(ROTEIROS_FILE_PATH, "r", encoding="utf-8") as f:
        _ROTEIROS_CACHE = json.load(f)

    return _ROTEIROS_CACHE


def obter_modelo_politica(politica: str) -> Optional[Dict[str, Any]]:
    """Retorna o modelo da política especificada (ex: 'ROUANET', 'PNAB', 'LPG', 'EMENDAS', 'MUNICIPAL')."""
    roteiros = carregar_roteiros()
    pol_upper = (politica or "").strip().upper()
    return roteiros.get(pol_upper)


def obter_campos_politica(politica: str) -> List[Dict[str, Any]]:
    """Retorna a lista ordenada de campos da política."""
    modelo = obter_modelo_politica(politica)
    if not modelo:
        return []
    return modelo.get("campos", [])


def obter_ids_campos_politica(politica: str) -> List[str]:
    """Retorna a lista de IDs válidos para a política."""
    return [c["id"] for c in obter_campos_politica(politica) if "id" in c]


def obter_campo_def(politica: str, campo_id: str) -> Optional[Dict[str, Any]]:
    """Retorna a definição de um campo específico da política."""
    campos = obter_campos_politica(politica)
    for c in campos:
        if c.get("id") == campo_id:
            return c
    return None


def obter_primeiro_campo_obrigatorio(politica: str, campos_estado: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
    """
    Retorna o primeiro campo obrigatório da política ainda não preenchido nem pulado.
    Se todos estiverem preenchidos ou pendentes, retorna o último campo (ex: revisão final).
    """
    campos = obter_campos_politica(politica)
    campos_estado = campos_estado or {}

    for c in campos:
        if c.get("obrigatorio"):
            cid = c["id"]
            estado = campos_estado.get(cid)
            if isinstance(estado, dict):
                status = estado.get("status", "")
                if status not in ["preenchido", "pendente"]:
                    return c
            elif not estado:
                return c

    # Se todos obrigatórios estão completos/pendentes, retorna o último campo do roteiro (revisão)
    if campos:
        return campos[-1]
    return None


def filtrar_e_validar_outros_campos(politica: str, outros_campos: Any) -> Dict[str, str]:
    """
    Filtra chaves de outros_campos, mantendo apenas aquelas que pertencem ao modelo da política.
    Chaves inválidas são descartadas e registradas em log.
    """
    if not isinstance(outros_campos, dict):
        return {}

    ids_validos = set(obter_ids_campos_politica(politica))
    resultado: Dict[str, str] = {}

    for chave, valor in outros_campos.items():
        if chave in ids_validos:
            if isinstance(valor, str) and valor.strip():
                resultado[chave] = valor.strip()
        else:
            logger.warning(
                f"[RoteirosLoader] Chave '{chave}' descartada de outros_campos pois não pertence ao modelo da política '{politica}'."
            )

    return resultado
