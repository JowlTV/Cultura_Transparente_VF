"""=============================================================================
CULTURA TRANSPARENTE - MODELOS DE DADOS E FINANCIAMENTO CULTURAL
Módulo: backend/models.py
=============================================================================
Classes e contratos de dados para PNAB (Lei nº 14.399/2022), LPG (LC nº 195/2022),
Emendas Parlamentares e Pontos de Cultura com validação e conformidade institucional.
"""

from dataclasses import dataclass, field, asdict
from enum import Enum
from typing import Optional, List, Dict, Any
from datetime import datetime
import re


class TipoFinanciamento(str, Enum):
    PNAB = "PNAB"
    LPG = "LPG"
    EMENDA = "EMENDA"


def validar_cnpj(cnpj: str) -> bool:
    """Valida formato e dígitos de CNPJ."""
    if not cnpj:
        return False
    limpo = re.sub(r"\D", "", cnpj)
    if len(limpo) != 14 or len(set(limpo)) == 1:
        return False
    
    multiplicadores_1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    multiplicadores_2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    
    # 1º Dígito
    soma = sum(int(limpo[i]) * multiplicadores_1[i] for i in range(12))
    resto = soma % 11
    d1 = 0 if resto < 2 else 11 - resto
    if int(limpo[12]) != d1:
        return False
    
    # 2º Dígito
    soma = sum(int(limpo[i]) * multiplicadores_2[i] for i in range(13))
    resto = soma % 11
    d2 = 0 if resto < 2 else 11 - resto
    return int(limpo[13]) == d2


@dataclass
class LPGMeta:
    """Meta oficial do Plano de Ação da Lei Paulo Gustavo no Transferegov."""
    numero_meta: str
    nome_meta: str
    descricao: str
    valor: float


@dataclass
class LPGProject:
    """Representa projetos e repasses da Lei Paulo Gustavo (LC nº 195/2022)."""
    id: str
    codigo_plano_acao: str
    objeto: str
    valor_total_repasse: float
    situacao: str
    data_inicio_vigencia: str
    data_fim_vigencia: str
    municipio: str = "Viamão"
    uf: str = "RS"
    cnpj_ente_recebedor: str = "88.000.914/0001-01"
    nome_ente_recebedor: str = "Município de Viamão"
    fundo_recebedor: str = "Secretaria Municipal da Cultura"
    fonte_oficial: str = "Transferegov.br (Fundo a Fundo / MinC)"
    metas: List[Dict[str, Any]] = field(default_factory=list)
    dados_bancarios: List[Dict[str, Any]] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class EmendaRecord:
    """Representa emenda parlamentar municipal, estadual ou federal (CGU / ALRS / RS)."""
    id: str
    autor: str
    partido: str
    tipo: str
    ano: int
    orgao: str
    objeto: str
    valor: float
    pago: float
    status: str
    is_cultura: bool
    area_atuacao: str
    municipio: str = "Viamão"
    esfera: str = "Federal (API CGU)"
    numero_emenda: Optional[str] = None
    beneficiario: Optional[str] = None
    fonte: str = "Portal da Transparência"
    fontes_cruzadas: List[str] = field(default_factory=list)
    subprojeto: Optional[str] = None
    tipo_projeto_cultural: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class AuditReport:
    """Relatório consolidado de auditoria de dados públicos."""
    timestamp: str
    total_recursos_mapeados: float
    orgao_auditado: str
    status_conformidade: str
    alertas_inconsistencia: List[str]
    pnab_status: Optional[Dict[str, Any]] = None
    lpg_status: Optional[Dict[str, Any]] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
