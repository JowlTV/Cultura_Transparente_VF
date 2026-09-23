import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  Packer,
} from 'docx';

export interface ProjectDraftSections {
  edital_politica?: string;
  ideia_projeto?: string;
  tipo_proponente?: string;
  objetivo_principal?: string;
  publico_territorio?: string;
  atividades_metodologia?: string;
  acessibilidade?: string;
  contrapartida_social?: string;
  cronograma?: string;
  orcamento?: string;
  revisao_final?: string;
  // Campos específicos do Roteiro Rouanet (IN MinC nº 29/2026)
  perfil_proponente?: string;
  enquadramento_artigo?: string;
  sintese_produto?: string;
  objetivos_justificativa?: string;
  local_cronograma?: string;
  plano_distribuicao_democratizacao?: string;
  medidas_acessibilidade?: string;
  divulgacao_marcas?: string;
  ficha_tecnica?: string;
  planilha_orcamentaria?: string;
  conferencia_regras_revisao?: string;
  [key: string]: string | undefined;
}

export interface ConferenciaRegrasResult {
  valido: boolean;
  total_regras: number;
  infracoes: Array<{ regra_id: string; descricao: string; limite: any; valor_informado: any; citacao: string; referencia: string }>;
  aprovacoes: Array<{ regra_id: string; descricao: string; limite: any; valor_informado: any; citacao: string; referencia: string }>;
  pendencias: Array<{ regra_id: string; descricao: string; pendencia: string; citacao: string; referencia: string }>;
  resumo: string;
}

export interface DocxExportOptions {
  projectName?: string;
  proponentName?: string;
  sections: ProjectDraftSections;
  fontesCitadas?: Array<{ documento: string; trecho: string }>;
  politica?: string;
  conferenciaRegras?: ConferenciaRegrasResult;
}

export const SECTION_METADATA_PADRAO = [
  { key: 'edital_politica', num: '1', title: 'Edital ou Política Cultural' },
  { key: 'ideia_projeto', num: '2', title: 'Ideia Central e Síntese da Proposta' },
  { key: 'tipo_proponente', num: '3', title: 'Identificação e Perfil do Proponente' },
  { key: 'objetivo_principal', num: '4', title: 'Objetivo Principal e Justificativa de Impacto Cultural' },
  { key: 'publico_territorio', num: '5', title: 'Público-Alvo e Abrangência Territorial em Viamão' },
  { key: 'atividades_metodologia', num: '6', title: 'Atividades e Metodologia de Execução' },
  { key: 'acessibilidade', num: '7', title: 'Plano de Acessibilidade (Física, Comunicacional e Atitudinal)' },
  { key: 'contrapartida_social', num: '8', title: 'Contrapartida Social Gratuita para a Comunidade' },
  { key: 'cronograma', num: '9', title: 'Cronograma de Execução' },
  { key: 'orcamento', num: '10', title: 'Planilha Orçamentária Detalhada' },
  { key: 'revisao_final', num: '11', title: 'Revisão Final e Documentos de Habilitação' },
];

export const SECTION_METADATA_ROUANET = [
  { key: 'identificacao_proposta_proponente', fallbackKeys: ['perfil_proponente', 'edital_politica'], num: '1', title: 'Identificação da Proposta e do Proponente' },
  { key: 'objetivo_justificativa_enquadramento', fallbackKeys: ['objetivos_justificativa', 'enquadramento_artigo'], num: '2', title: 'Objetivo, Justificativa e Enquadramento Legal' },
  { key: 'produtos', fallbackKeys: ['sintese_produto'], num: '3', title: 'Produtos' },
  { key: 'responsabilidade_social', fallbackKeys: ['medidas_acessibilidade', 'plano_distribuicao_democratizacao'], num: '4', title: 'Responsabilidade Social: Acessibilidade (Física e de Conteúdo) e Democratização de Acesso' },
  { key: 'etapas_trabalho', fallbackKeys: ['local_cronograma', 'cronograma'], num: '5', title: 'Etapas de Trabalho' },
  { key: 'ficha_tecnica', fallbackKeys: ['ficha_tecnica'], num: '6', title: 'Ficha Técnica' },
  { key: 'por_produto', fallbackKeys: ['por_produto', 'sintese_produto'], num: '7', title: 'Por Produto: Sinopse da Obra, Especificação Técnica e Descrição da Atividade' },
  { key: 'plano_distribuicao', fallbackKeys: ['plano_distribuicao', 'plano_distribuicao_democratizacao'], num: '8', title: 'Plano de Distribuição' },
  { key: 'planilha_orcamentaria', fallbackKeys: ['planilha_orcamentaria', 'orcamento'], num: '9', title: 'Planilha Orçamentária por Produto e Etapa, com Custos Vinculados e Totais' },
  { key: 'conferencia_regras_revisao', fallbackKeys: ['conferencia_regras_revisao', 'conferencia_regras'], num: '10', title: 'Conferência de Regras' },
  { key: 'pendencias_salic', fallbackKeys: ['pendencias_salic', 'pendencias'], num: '11', title: 'Pendências ([a preencher])' },
  { key: 'avisos_legais', fallbackKeys: ['avisos_legais', 'divulgacao_marcas'], num: '12', title: 'Avisos e Responsabilidades Legais do Proponente' },
];

export function isRouanetPolicy(sections: ProjectDraftSections, explicitPolitica?: string): boolean {
  if (explicitPolitica === 'ROUANET') return true;
  const edital = (sections.edital_politica || '').toLowerCase();
  if (edital.includes('rouanet') || edital.includes('pronac') || edital.includes('8.313') || edital.includes('in 29')) {
    return true;
  }
  // Se preencheu seções exclusivas da Rouanet
  if (sections.perfil_proponente || sections.enquadramento_artigo || sections.sintese_produto || sections.planilha_orcamentaria) {
    return true;
  }
  return false;
}

export async function generateProjectDocxBlob(options: DocxExportOptions): Promise<Blob> {
  const { projectName, proponentName, sections, fontesCitadas, politica, conferenciaRegras } = options;
  const isRouanet = isRouanetPolicy(sections, politica);
  const metadataList = isRouanet ? SECTION_METADATA_ROUANET : SECTION_METADATA_PADRAO;

  const projectTitle = projectName || sections.sintese_produto?.slice(0, 60) || sections.ideia_projeto?.slice(0, 60) || (isRouanet ? 'Proposta Cultural - Lei Rouanet (Pronac)' : 'Projeto Cultural');
  const editalTitle = sections.edital_politica || (isRouanet ? 'Lei Rouanet - Pronac / Mecenato (IN MinC nº 29/2026)' : 'Instrumento / Edital a Definir');
  const proponentDisplay = proponentName || sections.perfil_proponente?.slice(0, 80) || sections.tipo_proponente || '[Nome do Proponente / Razão Social]';
  const dataHoje = new Date().toLocaleDateString('pt-BR');

  const children: (Paragraph | Table)[] = [];

  // Cabeçalho Institucional
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: isRouanet ? 'MINISTÉRIO DA CULTURA · GOVERNO FEDERAL' : 'MUNICÍPIO DE VIAMÃO / RS',
          bold: true,
          size: 26,
          color: '2D0652',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: isRouanet
            ? 'PROGRAMA NACIONAL DE APOIO À CULTURA (PRONAC) · LEI ROUANET (LEI Nº 8.313/1991 · IN MINC Nº 29/2026)'
            : 'PLATAFORMA CULTURA TRANSPARENTE · AUXÍLIO AO FAZEDOR DE CULTURA',
          size: 19,
          color: '6A0DAD',
          bold: true,
        }),
      ],
      spacing: { after: 300 },
    }),
    new Paragraph({
      text: projectTitle.toUpperCase(),
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    })
  );

  // Tabela de Metadados do Projeto
  const metaRows = [
    ['Instrumento / Mecanismo', editalTitle],
    ['Proponente', proponentDisplay],
    ['Território de Realização', sections.local_cronograma || sections.publico_territorio || 'Viamão/RS e Região'],
    ['Data de Elaboração', dataHoje],
    ['Plataforma de Suporte Técnico', 'Cult Circuito Viamão · Auxílio ao Fazedor de Cultura'],
  ];

  const metaTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: metaRows.map(([label, value]) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 30, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [new TextRun({ text: label, bold: true, size: 20, color: '2D0652' })],
              }),
            ],
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
              left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
              right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
            },
          }),
          new TableCell({
            width: { size: 70, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [new TextRun({ text: value, size: 20 })],
              }),
            ],
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
              left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
              right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
            },
          }),
        ],
      })
    ),
  });

  children.push(metaTable);
  children.push(new Paragraph({ text: '', spacing: { after: 300 } }));

  // Seções Estruturadas do Projeto
  metadataList.forEach(sec => {
    children.push(
      new Paragraph({
        text: `${sec.num}. ${sec.title}`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
      })
    );

    let contentText = sections[sec.key];
    if (!contentText && (sec as any).fallbackKeys) {
      for (const fk of (sec as any).fallbackKeys) {
        if (sections[fk] && sections[fk]!.trim()) {
          contentText = sections[fk];
          break;
        }
      }
    }

    if (contentText && contentText.trim()) {
      const paragraphs = contentText.split('\n\n');
      paragraphs.forEach(p => {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: p.trim(), size: 22 })],
            spacing: { after: 120 },
          })
        );
      });
    } else {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: isRouanet ? '[a preencher]' : '[Esta seção ainda não foi preenchida. Complete antes do envio ao órgão responsável.]',
              italics: true,
              color: '888888',
              size: 20,
            }),
          ],
          spacing: { after: 120 },
        })
      );
    }
  });

  // Seção Especial: Conferência de Regras (obrigatória para Lei Rouanet)
  if (isRouanet || conferenciaRegras) {
    children.push(
      new Paragraph({
        text: 'Conferência de Regras Objetivas (IN MinC nº 29/2026)',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 140 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'Relatório automatizado de conformidade orçamentária e limites legais aferidos a partir da Instrução Normativa MinC nº 29/2026:',
            italics: true,
            size: 20,
            color: '555555',
          }),
        ],
        spacing: { after: 140 },
      })
    );

    if (conferenciaRegras) {
      if (conferenciaRegras.aprovacoes && conferenciaRegras.aprovacoes.length > 0) {
        children.push(
          new Paragraph({
            text: '✔ Itens Conformes com a Legislação:',
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 140, after: 80 },
          })
        );
        conferenciaRegras.aprovacoes.forEach(ap => {
          children.push(
            new Paragraph({
              bullet: { level: 0 },
              children: [
                new TextRun({ text: `${ap.descricao}: `, bold: true, size: 20, color: '166534' }),
                new TextRun({ text: `${ap.referencia} - "${ap.citacao}"`, size: 20 }),
              ],
              spacing: { after: 60 },
            })
          );
        });
      }

      if (conferenciaRegras.infracoes && conferenciaRegras.infracoes.length > 0) {
        children.push(
          new Paragraph({
            text: '⚠ Inconformidades Detectadas nos Limites Legais:',
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 140, after: 80 },
          })
        );
        conferenciaRegras.infracoes.forEach(inf => {
          children.push(
            new Paragraph({
              bullet: { level: 0 },
              children: [
                new TextRun({ text: `${inf.descricao}: `, bold: true, size: 20, color: 'B91C1C' }),
                new TextRun({ text: `${inf.referencia} - "${inf.citacao}"`, size: 20 }),
              ],
              spacing: { after: 60 },
            })
          );
        });
      }

      if (conferenciaRegras.pendencias && conferenciaRegras.pendencias.length > 0) {
        children.push(
          new Paragraph({
            text: 'ℹ Informações Pendentes de Fornecimento pelo Proponente:',
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 140, after: 80 },
          })
        );
        conferenciaRegras.pendencias.forEach(pen => {
          children.push(
            new Paragraph({
              bullet: { level: 0 },
              children: [
                new TextRun({ text: `${pen.descricao}: `, bold: true, size: 20, color: 'D97706' }),
                new TextRun({ text: `${pen.pendencia} (${pen.referencia})`, size: 20 }),
              ],
              spacing: { after: 60 },
            })
          );
        });
      }
    } else {
      // Regras gerais de conferência da IN 29/2026
      const regrasGerais = [
        { desc: 'Custos Administrativos', ref: 'Art. 19', cit: 'Os custos administrativos ficam limitados a 15% (quinze por cento) do valor total do projeto.' },
        { desc: 'Remuneração para Captação de Recursos', ref: 'Art. 23', cit: 'A remuneração para captação de recursos fica limitada a 10% (dez por cento) do valor total aprovado para captação, até o valor máximo de R$ 150.000,00 (cento e cinquenta mil reais).' },
        { desc: 'Cachê Artístico Individual', ref: 'Art. 26', cit: 'O valor máximo para pagamento de cachê artístico com recursos incentivados é de R$ 25.000,00 (vinte e cinco mil reais) por artista.' },
        { desc: 'Cotas Gratuitas de Democratização', ref: 'Art. 41', cit: 'A distribuição gratuita de ingressos ou produtos culturais deve destinar no mínimo 10% (dez por cento) para ações socioeducativas ou comunitárias e no mínimo 20% (vinte por cento) com preços populares de até R$ 50,00.' },
        { desc: 'Submissão e Responsabilidade no Salic', ref: 'Art. 4º e Art. 48', cit: 'A proposta deve ser apresentada pelo próprio proponente no Salic. A aprovação da proposta no Pronac autoriza a captação de recursos junto a patrocinadores e não garante a captação nem o recebimento de verba direta.' },
      ];

      regrasGerais.forEach(r => {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: `${r.desc} (${r.ref}): `, bold: true, size: 20 }),
              new TextRun({ text: `"${r.cit}"`, italics: true, size: 20 }),
            ],
            spacing: { after: 60 },
          })
        );
      });
    }
  }

  // Fontes Oficiais Citadas
  if (fontesCitadas && fontesCitadas.length > 0) {
    children.push(
      new Paragraph({
        text: 'Documentos Oficiais Citados e Fundamentação Legal',
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 300, after: 120 },
      })
    );

    fontesCitadas.forEach(f => {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          children: [
            new TextRun({ text: `${f.documento}: `, bold: true, size: 20 }),
            new TextRun({ text: f.trecho, size: 20 }),
          ],
          spacing: { after: 80 },
        })
      );
    });
  }

  // Rodapé e Avisos Institucionais
  const avisoRodape = isRouanet
    ? 'AVISO INSTITUCIONAL E LEGAL (LEI ROUANET · IN MINC Nº 29/2026): A presente proposta foi estruturada tecnicamente com auxílio do assistente de inteligência especializada da plataforma Cultura Transparente, em estrita observância à Lei nº 8.313/1991, Decreto nº 11.453/2023 e Instrução Normativa MinC nº 29/2026. A elaboração orientada NÃO garante aprovação da proposta pelo Ministério da Cultura nem pela Comissão Nacional de Incentivo à Cultura (CNIC), aos quais compete privativamente o exame de admissibilidade e mérito técnico. A aprovação no Pronac autoriza a captação de recursos com incentivadores fiscais, cuja execução depende do êxito dessa captação. A submissão da proposta deve ser realizada exclusivamente pela própria pessoa diretamente no Sistema de Apoio às Leis de Incentivo à Cultura (Salic - https://salic.cultura.gov.br). Nenhuma informação de dados bancários, CPF ou CNPJ foi gravada em servidor externo; insira os dados cadastrais diretamente no Salic.'
    : 'NOTA DE RESPONSABILIDADE E PRIVACIDADE: Este documento foi estruturado com o auxílio do assistente de IA do Cultura Transparente Viamão, fundamentado estritamente na legislação oficial de fomento cultural (PNAB - Lei 14.399/2022, LPG - LC 195/2022, Marco Regulatório da Cultura - Lei 14.903/2024 e MROSC - Lei 13.019/2014). Nenhuma informação de dados bancários, CPF ou RG é solicitada ou gravada em servidor; complete os dados cadastrais antes de submeter ao órgão gestor.';

  children.push(
    new Paragraph({
      text: '',
      spacing: { before: 400 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: avisoRodape,
          italics: true,
          size: 18,
          color: '555555',
        }),
      ],
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  return await Packer.toBlob(doc);
}

export async function downloadProjectDocx(options: DocxExportOptions): Promise<void> {
  const blob = await generateProjectDocxBlob(options);
  const cleanName = (options.projectName || (options.politica === 'ROUANET' ? 'Proposta_Lei_Rouanet_Salic' : 'Projeto_Cultural_Viamao'))
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${cleanName}_${new Date().toISOString().slice(0, 10)}.docx`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 15000);
}
