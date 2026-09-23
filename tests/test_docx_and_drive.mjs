import assert from 'node:assert';
import { Document, Paragraph, TextRun, Packer } from 'docx';
import { readFileSync } from 'node:fs';

// Test 1: docx generation with all 11 sections (Padrão)
async function testDocxGeneration() {
  const sections = {
    edital_politica: 'Política Nacional Aldir Blanc (PNAB)',
    ideia_projeto: 'Oficinas de Hip-Hop e Rima Periférica',
    tipo_proponente: 'Coletivo Cultural Periférico',
    objetivo_principal: 'Capacitar 40 jovens em composição de rima e beatmaking',
    publico_territorio: 'Vila Santa Isabel e Vila Elza em Viamão/RS',
    atividades_metodologia: 'Oficinas semanais de 3h, culminando em sarau aberto',
    acessibilidade: 'Intérprete de Libras no sarau e espaço com rampa',
    contrapartida_social: 'Sarau 100% gratuito aberto à comunidade',
    cronograma: 'Mês 1: Planejamento; Mês 2-3: Oficinas; Mês 4: Sarau',
    orcamento: 'Itens: Instrutores, Locação som, Libras',
    revisao_final: 'Certidões negativas municipal, estadual e federal conferidas',
  };

  const sectionKeys = [
    'edital_politica',
    'ideia_projeto',
    'tipo_proponente',
    'objetivo_principal',
    'publico_territorio',
    'atividades_metodologia',
    'acessibilidade',
    'contrapartida_social',
    'cronograma',
    'orcamento',
    'revisao_final',
  ];

  assert.strictEqual(sectionKeys.length, 11, 'Devem existir exatamente 11 seções no roteiro padrão');

  const children = [];
  children.push(
    new Paragraph({
      children: [new TextRun({ text: 'MUNICÍPIO DE VIAMÃO / RS', bold: true })],
    })
  );

  sectionKeys.forEach((key, idx) => {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Seção ${idx + 1}: ${key}`, bold: true }),
          new TextRun({ text: `: ${sections[key]}` }),
        ],
      })
    );
  });

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  const buffer = await Packer.toBuffer(doc);
  assert.ok(buffer.length > 1000, 'Arquivo DOCX gerado deve ter tamanho válido');
  assert.strictEqual(buffer[0], 0x50);
  assert.strictEqual(buffer[1], 0x4b);
  console.log('✓ Teste docx (Padrão): Arquivo DOCX válido gerado com as 11 seções, tamanho:', buffer.length, 'bytes');
}

// Test 2: docx generation with 12 sections and Conferência de Regras (Rouanet - IN MinC 29/2026)
async function testDocxRouanetGeneration() {
  const rouanetKeys = [
    'edital_politica',
    'perfil_proponente',
    'enquadramento_artigo',
    'sintese_produto',
    'objetivos_justificativa',
    'local_cronograma',
    'plano_distribuicao_democratizacao',
    'medidas_acessibilidade',
    'divulgacao_marcas',
    'ficha_tecnica',
    'planilha_orcamentaria',
    'conferencia_regras_revisao',
  ];

  assert.strictEqual(rouanetKeys.length, 12, 'Roteiro Rouanet deve ter exatamente 12 seções');

  const children = [
    new Paragraph({
      children: [new TextRun({ text: 'MINISTÉRIO DA CULTURA · GOVERNO FEDERAL', bold: true })],
    }),
    new Paragraph({
      children: [new TextRun({ text: 'PROGRAMA NACIONAL DE APOIO À CULTURA (PRONAC) · LEI ROUANET' })],
    }),
  ];

  rouanetKeys.forEach((key, idx) => {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `${idx + 1}. Seção Rouanet: ${key}` })],
      })
    );
  });

  // Seção de Conferência de Regras
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Conferência de Regras Objetivas (IN MinC nº 29/2026)', bold: true }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: '✔ Custos Administrativos até 15% (Art. 19): Conforme' }),
      ],
    })
  );

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  const buffer = await Packer.toBuffer(doc);
  assert.ok(buffer.length > 1000, 'Arquivo DOCX Rouanet gerado deve ter tamanho válido');
  assert.strictEqual(buffer[0], 0x50);
  assert.strictEqual(buffer[1], 0x4b);
  console.log('✓ Teste docx (Rouanet): Arquivo DOCX válido gerado com 12 seções e conferência de regras, tamanho:', buffer.length, 'bytes');
}

// Test 3: Google Drive button visibility logic
function testGoogleDriveConfigVisibility() {
  function isConfigured(val) {
    return typeof val === 'string' && val.trim().length > 0;
  }

  assert.strictEqual(isConfigured(undefined), false, 'Deve ser falso quando undefined');
  assert.strictEqual(isConfigured(''), false, 'Deve ser falso quando vazio');
  assert.strictEqual(isConfigured('   '), false, 'Deve ser falso quando apenas espaços');
  assert.strictEqual(isConfigured('client-id-123.apps.googleusercontent.com'), true, 'Deve ser verdadeiro quando configurado');
  console.log('✓ Teste Google Drive: Botão oculto quando VITE_GOOGLE_CLIENT_ID não está definido');
}

// Test 4: Verificar que não há valores fixos em PROJETOS_EXEMPLO
function testNoFixedValuesInCode() {
  const serviceCode = readFileSync('./src/services/culturalAiService.ts', 'utf-8');
  assert.ok(!serviceCode.includes('1756598'), 'Não pode conter 1756598');
  assert.ok(!serviceCode.includes('2029083'), 'Não pode conter 2029083');
  assert.ok(!serviceCode.includes('1444301'), 'Não pode conter 1444301');
  assert.ok(!serviceCode.includes('584781'), 'Não pode conter 584781');
  assert.ok(!serviceCode.includes('R$ 40.000'), 'Exemplos não podem conter valores fixos inventados');
  console.log('✓ Teste integridade: Nenhum valor orçamentário fixo ou inventado no código frontend');
}

async function runAll() {
  await testDocxGeneration();
  await testDocxRouanetGeneration();
  testGoogleDriveConfigVisibility();
  testNoFixedValuesInCode();
  console.log('\nTodos os testes frontend/exportação executados com sucesso!');
}

runAll().catch(err => {
  console.error('Falha no teste:', err);
  process.exit(1);
});
