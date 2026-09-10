const fs = require('fs');
const file = 'src/data/initialData.ts';
let code = fs.readFileSync(file, 'utf8');

const anchor1 = "periodo_execucao: '2024 - 2026',\n  },";
const anchor2 = "      links_referencia: [";

const index1 = code.indexOf(anchor1);
const index2 = code.indexOf(anchor2, index1);

if (index1 !== -1 && index2 !== -1) {
  const replacement = `\n];\n\nexport const INITIAL_PONTOS_CULTURAIS: PontoCultural[] = [\n  {\n    id: 'ponto-mestre-borel',\n    nome: 'Ponto de Cultura e Memória Centro Cultural Mestre Borel',\n    categoria: 'Ponto de Cultura',\n    endereco: 'Rua Antônio Vivaldi, 153 - Jardim Viamar',\n    destaque_comunitario: true,\n    google_maps_presente: false,\n    resumo_geral_cultura: 'Ponto de Cultura comunitário que atua na periferia de Viamão. Promove atividades de capoeira, percussão, artesanato afro-brasileiro e o projeto Sopa do Bem.',\n    o_que_costumam_fazer: 'Oficinas continuadas de capoeira angola e regional, aulas de atabaque e percussão, produção de artesanato e distribuição semanal de sopa comunitária (Sopa do Bem) para moradores em vulnerabilidade.',\n    descricao: 'Fundado na região do Jardim Viamar, o Centro Cultural Mestre Borel é um espaço de resistência e preservação da cultura afro-brasileira. Integra esporte, cultura e assistência social.',\n`;
  code = code.substring(0, index1 + anchor1.length) + replacement + code.substring(index2);
  fs.writeFileSync(file, code);
  console.log('Fixed!');
} else {
  console.log('Anchors not found', index1, index2);
}
