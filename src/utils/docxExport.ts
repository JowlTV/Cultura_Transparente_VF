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
  [key: string]: string | undefined;
}

export interface DocxExportOptions {
  projectName?: string;
  proponentName?: string;
  sections: ProjectDraftSections;
  fontesCitadas?: Array<{ documento: string; trecho: string }>;
}

const SECTION_METADATA = [
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

export async function generateProjectDocxBlob(options: DocxExportOptions): Promise<Blob> {
  const { projectName, proponentName, sections, fontesCitadas } = options;
  const projectTitle = projectName || sections.ideia_projeto?.slice(0, 60) || 'Projeto Cultural';
  const editalTitle = sections.edital_politica || 'Instrumento / Edital a Definir';
  const proponentDisplay = proponentName || sections.tipo_proponente || '[Nome do Proponente / Coletivo]';
  const dataHoje = new Date().toLocaleDateString('pt-BR');

  const children: (Paragraph | Table)[] = [];

  // Cabeçalho Institucional
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'MUNICÍPIO DE VIAMÃO / RS',
          bold: true,
          size: 28, // 14pt
          color: '2D0652',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'PLATAFORMA CULTURA TRANSPARENTE · AUXÍLIO AO FAZEDOR DE CULTURA',
          size: 20, // 10pt
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
    ['Instrumento / Edital', editalTitle],
    ['Proponente', proponentDisplay],
    ['Território de Realização', sections.publico_territorio || 'Município de Viamão/RS'],
    ['Data de Elaboração', dataHoje],
    ['Plataforma de Suporte', 'Cult Circuito Viamão · Apoio ao Fomento Cultural'],
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

  // Seções de 1 a 11
  SECTION_METADATA.forEach(sec => {
    children.push(
      new Paragraph({
        text: `${sec.num}. ${sec.title}`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
      })
    );

    const contentText = sections[sec.key];
    if (contentText && contentText.trim()) {
      // Divide por linhas/parágrafos
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
              text: `[Esta seção ainda não foi preenchida. Edite diretamente ou responda ao assistente de IA.]`,
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

  // Rodapé e Aviso de Proteção LGPD
  children.push(
    new Paragraph({
      text: '',
      spacing: { before: 400 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'NOTA DE RESPONSABILIDADE E PRIVACIDADE: Este documento foi estruturado com o auxílio do assistente de IA do Cultura Transparente Viamão, fundamentado estritamente na legislação oficial de fomento cultural (PNAB - Lei 14.399/2022, LPG - LC 195/2022, Marco Regulatório da Cultura - Lei 14.903/2024 e MROSC - Lei 13.019/2014). Nenhuma informação de dados bancários, CPF ou RG é solicitada ou gravada em servidor; complete os dados cadastrais antes de submeter ao órgão gestor.',
          italics: true,
          size: 18, // 9pt
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
  const cleanName = (options.projectName || 'Projeto_Cultural_Viamao')
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
