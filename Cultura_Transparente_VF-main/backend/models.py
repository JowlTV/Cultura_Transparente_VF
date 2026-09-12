"""=============================================================================
CULTURA TRANSPARENTE - MODELOS DE DADOS E FINANCIAMENTO CULTURAL
Módulo: backend/models.py
=============================================================================
Classes e contratos de dados para PNAB, FAC, LPG, Lei Rouanet, Emendas e Pontos
de Cultura com validação e conformidade institucional.
"""

from dataclasses import dataclass, field, asdict
from enum import Enum
from typing import Optional, List, Dict, Any
from datetime import datetime
import re


class TipoFinanciamento(str, Enum):
    PNAB = "PNAB"
    FAC = "FAC"
    LPG = "LPG"
    ROUANET = "ROUANET"
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
class PNABRecord:
    """Representa termo de adesão e recursos da Política Nacional Aldir Blanc."""
    id: str
    termo_numero: str
    cnpj_proponente: str
    municipio: str
    uf: str
    valor_global: float
    data_extrato: str
    banco_custodia: str
    conta_vinculada: str
    objeto: str
    base_legal: str
    fonte_auditada: str
    status_etapa: str
    sincronizacao_pendente: bool = False
    codigo_orgao_siafi: str = "42000"
    data_extracao: str = field(default_factory=lambda: datetime.now().isoformat())

    def __post_init__(self):
        if self.valor_global < 0:
            raise ValueError("Valor global do PNAB não pode ser negativo.")
        if not validar_cnpj(self.cnpj_proponente):
            # Normalizar ou emitir aviso de validação
            pass

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "PNABRecord":
        return cls(
            id=data.get("id", "pnab-01"),
            termo_numero=data.get("termo_numero", ""),
            cnpj_proponente=data.get("cnpj_proponente", "88.000.914/0001-01"),
            municipio=data.get("municipio", "Viamão"),
            uf=data.get("uf", "RS"),
            valor_global=float(data.get("valor_global", 0.0)),
            data_extrato=data.get("data_extrato", datetime.now().strftime("%d/%m/%Y")),
            banco_custodia=data.get("banco_custodia", "Conta Fiduciária Vinculada"),
            conta_vinculada=data.get("conta_vinculada", "Fundo Municipal de Cultura"),
            objeto=data.get("objeto", "Ações da PNAB (Lei nº 14.399/2022)"),
            base_legal=data.get("base_legal", "Lei nº 14.399/2022"),
            fonte_auditada=data.get("fonte_auditada", "Transferegov.br / MinC"),
            status_etapa=data.get("status_etapa", "Fase de Elaboração e Publicação de Editais"),
            sincronizacao_pendente=bool(data.get("sincronizacao_pendente", False)),
            codigo_orgao_siafi=data.get("codigo_orgao_siafi", "42000"),
            data_extracao=data.get("data_extracao", datetime.now().isoformat())
        )


@dataclass
class FACEdital:
    """Representa edital do Fundo de Apoio à Cultura (SEDAC-RS / Pró-Cultura)."""
    id: str
    numero_edital: str
    titulo: str
    status: str
    valor_total: float
    valor_maximo_projeto: float
    segmentos: List[str]
    elegibilidade: str
    link_oficial: str
    prazo_inscricao: str
    plataforma: str = "Sistema Pró-cultura RS"
    contrapartida_exigida: str = "Prestação de contas simplificada"
    municipio_alvo: str = "Viamão / RS"

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class LPGProject:
    """Representa projetos e repasses da Lei Paulo Gustavo (LC nº 195/2022)."""
    id: str
    mecanismo: str
    objeto: str
    valor_aprovado: float
    valor_executado: float
    artigo_legal: str  # Art. 6º (Audiovisual) ou Art. 8º (Demais Áreas)
    status: str
    municipio: str = "Viamão"
    fonte_oficial: str = "https://www.gov.br/cultura/pt-br/assuntos/lei-paulo-gustavo"
    periodo_execucao: str = "2024 - 2026"

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class RouanetProject:
    """Representa projetos homologados pelo PRONAC / Lei Rouanet (Lei nº 8.313/1991)."""
    id: str
    pronac_numero: str
    nome_projeto: str
    proponente: str
    municipio: str
    uf: str
    segmento: str
    valor_aprovado: float
    valor_captado: float
    percentual_captado: float
    status: str
    link_dados_oficiais: str = "https://aplicacoes.cultura.gov.br/comparar/salicnet/"
    mecanismo: str = "Mecenato Federal (Art. 18/26)"
    homologado: bool = True

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class EmendaRecord:
    """Representa emenda parlamentar municipal ou federal (CGU / ALRS)."""
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
    rouanet_status: Optional[Dict[str, Any]] = None
    fac_status: Optional[Dict[str, Any]] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
