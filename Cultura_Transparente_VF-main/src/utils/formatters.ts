import { Emenda } from '../types/culture';

export function formatBRL(valor: number): string {
  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  } catch {
    return `R$ ${valor.toFixed(2)}`;
  }
}

export function formatNumber(valor: number): string {
  return new Intl.NumberFormat('pt-BR').format(valor);
}

export const TERMOS_CULTURA = [
  'cultura',
  'apoio cultural',
  'arte',
  'hip-hop',
  'teatro',
  'cinema',
  'biblioteca',
  'livro',
  'leitura',
  'patrimônio',
  'patrimonio',
  'música',
  'musica',
  'dança',
  'danca',
  'memória',
  'memoria',
  'ponto de cultura',
  'show',
  'evento cultural',
  'acervo',
  'audiovisual',
  'igreja matriz',
  'mitra',
  'arquidiocese',
  'soc benef cult',
  'mocidade',
  'tradição',
  'tradicao',
  'folclore',
  'centro espírita',
  'centro espirita',
  'piquete',
  'cabanha',
  'carnaval',
  'artesanato',
  'sarau',
  'aldir blanc',
  'paulo gustavo',
];

export function classificarSetorEmenda(
  orgao: string,
  projeto: string,
  subprojeto: string,
  funcao = ''
): { isCultura: boolean; area: string; justificativa: string } {
  const texto = `${orgao} ${projeto} ${subprojeto} ${funcao}`.toLowerCase();

  if (
    texto.includes('cultura') ||
    texto.includes('sedac') ||
    texto.includes('minc') ||
    texto.includes('função 13') ||
    texto.includes('funcao 13')
  ) {
    return {
      isCultura: true,
      area: 'Cultura, Arte e Patrimônio',
      justificativa: 'Enquadramento direto pela Secretaria/Ministério da Cultura (Função 13)',
    };
  }

  for (const termo of TERMOS_CULTURA) {
    const regex = new RegExp(`\\b${termo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(texto)) {
      return {
        isCultura: true,
        area: 'Cultura, Arte e Patrimônio',
        justificativa: `Termo identificador localizado: '${termo}' no projeto ou beneficiário`,
      };
    }
  }

  if (texto.includes('educação') || texto.includes('educacao') || texto.includes('escola') || texto.includes('ensino')) {
    return {
      isCultura: false,
      area: 'Educação e Ensino',
      justificativa: 'Alocado na área da Educação Pública',
    };
  } else if (texto.includes('saúde') || texto.includes('saude') || texto.includes('hospital') || texto.includes('sus') || texto.includes('ubs')) {
    return {
      isCultura: false,
      area: 'Saúde Pública',
      justificativa: 'Alocado na área da Saúde Pública / SUS',
    };
  } else if (texto.includes('justiça') || texto.includes('justica') || texto.includes('mulher') || texto.includes('direitos humanos')) {
    return {
      isCultura: false,
      area: 'Cidadania e Direitos Humanos',
      justificativa: 'Alocado na área de Direitos Humanos e Cidadania',
    };
  } else if (texto.includes('obras') || texto.includes('pavimentação') || texto.includes('pavimentacao') || texto.includes('infraestrutura') || texto.includes('esporte')) {
    return {
      isCultura: false,
      area: 'Infraestrutura, Esporte e Obras',
      justificativa: 'Alocado na área de Infraestrutura Urbana / Esporte Comunitário',
    };
  }

  return {
    isCultura: false,
    area: 'Desenvolvimento Social / Outros',
    justificativa: 'Outras destinações orçamentárias gerais',
  };
}

export function exportEmendasToCSV(emendas: Emenda[]): void {
  const headers = ['ID', 'Ano', 'Parlamentar', 'Esfera', 'Órgão', 'Programa/Projeto', 'Subprojeto/Beneficiário', 'Valor (R$)', 'Status', 'Segmento Cultural', 'Área', 'Fonte'];
  const rows = emendas.map(e => [
    e.id,
    e.ano,
    `"${e.parlamentar.replace(/"/g, '""')}"`,
    `"${e.esfera}"`,
    `"${e.orgao.replace(/"/g, '""')}"`,
    `"${e.projeto.replace(/"/g, '""')}"`,
    `"${e.subprojeto.replace(/"/g, '""')}"`,
    e.valor.toFixed(2),
    `"${e.status}"`,
    e.is_cultura ? 'SIM' : 'NÃO',
    `"${e.area_atuacao}"`,
    `"${e.fonte}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `emendas_viamao_transparencia_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
