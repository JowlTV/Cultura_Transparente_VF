const fs = require('fs');
const file = 'src/data/initialData.ts';
let code = fs.readFileSync(file, 'utf8');

const regex = /periodo_execucao: '2024 - 2026',\s*},\s*links_referencia: \[/g;

const replacement = `periodo_execucao: '2024 - 2026',
  }
];

export const INITIAL_PONTOS_CULTURAIS: PontoCultural[] = [
  {
    id: 'ponto-mestre-borel',
    nome: 'Ponto de Cultura e Memória Centro Cultural Mestre Borel',
    categoria: 'Ponto de Cultura',
    endereco: 'Rua Antônio Vivaldi, 153 - Jardim Viamar',
    destaque_comunitario: true,
    google_maps_presente: false,
    resumo_geral_cultura: 'Ponto de Cultura comunitário que atua na periferia de Viamão. Promove atividades de capoeira, percussão, artesanato afro-brasileiro e o projeto Sopa do Bem.',
    o_que_costumam_fazer: 'Oficinas continuadas de capoeira angola e regional, aulas de atabaque e percussão, produção de artesanato e distribuição semanal de sopa comunitária (Sopa do Bem) para moradores em vulnerabilidade.',
    descricao: 'Fundado na região do Jardim Viamar, o Centro Cultural Mestre Borel é um espaço de resistência e preservação da cultura afro-brasileira. Integra esporte, cultura e assistência social.',
    links_referencia: [`;

if (regex.test(code)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync(file, code);
  console.log('Fixed!');
} else {
  console.log('Regex not matched');
}
