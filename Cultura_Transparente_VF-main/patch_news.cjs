const fs = require('fs');
const file = 'src/data/initialData.ts';
let code = fs.readFileSync(file, 'utf8');

const newsReplacement = `export const INITIAL_NEWS: NewsItem[] = [
  {
    id: 'news-mut-brasil-2026',
    data: '01/09/2026',
    origem: 'Controle Social',
    categoria_filtro: 'viamao',
    titulo: 'Viamão sedia Mostra Cultural dos Territórios MUT Brasil 2026',
    resumo: 'A cidade de Viamão sedia a Mostra Cultural dos Territórios MUT Brasil 2026 na Quadra da Unidos de Vila Isabel, promovendo formação, debates e apresentações artísticas voltadas a populações historicamente invisibilizadas através da arte e da cultura local.',
    link: 'https://www.sympla.com.br',
    etiqueta: 'Evento Comunitário',
    jurisdicao: 'Municipal (Viamão)',
    elegibilidade: 'Comunidade em geral e coletivos periféricos',
    prazo: '06 de setembro de 2026',
    plataforma: 'Quadra da Unidos de Vila Isabel / Viamão'
  },
  {
    id: 'news-talentos-da-terra',
    data: '15/06/2026',
    origem: 'Municipal (Viamão)',
    categoria_filtro: 'viamao',
    titulo: 'Câmara de Viamão aprova criação do Programa Talentos da Terra',
    resumo: 'Foi aprovado o Projeto de Lei 36/2026, criando o Programa Talentos da Terra. A iniciativa do poder legislativo municipal estabelece um espaço público voltado para a valorização de artistas da cidade, promovendo apresentações musicais e demonstrações culturais de talentos viamonenses.',
    link: 'https://camaraviamao.rs.gov.br',
    etiqueta: 'Políticas Públicas',
    jurisdicao: 'Municipal (Viamão)',
    elegibilidade: 'Artistas residentes ou com família em Viamão',
    prazo: 'Fluxo Contínuo / Institucional',
    plataforma: 'Câmara Municipal de Viamão'
  },
  {
    id: 'news-viamao-editais-pnab-2026',
    data: '08/09/2026',
    origem: 'Municipal (Viamão)',
    categoria_filtro: 'editais',
    titulo: 'Prefeitura de Viamão prorroga Editais da PNAB (Literatura, Artesanato e Pareceristas)',
    resumo: 'A Secretaria de Cultura de Viamão prorrogou os prazos de inscrição para os editais de fomento direto da Política Nacional Aldir Blanc (PNAB) 2026, com oportunidades para Literatura, Artesanato e formação do banco de Pareceristas do município.',
    link: 'https://www.viamao.rs.gov.br/noticia/detalhe/80942',
    etiqueta: 'Editais PNAB Viamão',
    jurisdicao: 'Municipal (Viamão)',
    elegibilidade: 'Fazedores de Cultura de Viamão e Pareceristas',
    prazo: 'Prorrogado até Setembro de 2026',
    plataforma: 'Portal Oficial da Prefeitura de Viamão',
    requisitos_praticos: [
      'Residência ou atuação comprovada em Viamão',
      'Inscrição na Plataforma Oficial do Município',
      'Cadastro no Mapeamento Cultural'
    ]
  },
  {
    id: 'news-conferencia-cultura',
    data: '15/11/2025',
    origem: 'Municipal (Viamão)',
    categoria_filtro: 'viamao',
    titulo: 'Conferência Municipal de Cultura de Viamão elege novo Conselho',
    resumo: 'Realizada no Centro Municipal de Cultura Dr. Carlos Pinto Mennet, a Etapa Municipal da Conferência Nacional de Cultura debateu diretrizes, políticas de patrimônio, diversidade e economia criativa, além de eleger os novos representantes do Conselho Municipal de Políticas Culturais de Viamão.',
    link: 'https://www.viamao.rs.gov.br/',
    etiqueta: 'Gestão Compartilhada',
    jurisdicao: 'Municipal (Viamão)',
    elegibilidade: 'Agentes Culturais, Sociedade Civil e Poder Público',
    prazo: 'Conselho Biênio 2025-2027',
    plataforma: 'Centro Municipal de Cultura Dr. Carlos Pinto Mennet'
  },
  {
    id: 'news-feira-literaria',
    data: '20/10/2025',
    origem: 'Controle Social',
    categoria_filtro: 'viamao',
    titulo: 'Antônio Carlos Côrtes é o patrono da Feira Literária Cultural de Viamão',
    resumo: 'Com grande participação das escolas da rede pública e exposição de trabalhos inspirados em obras literárias, Viamão realiza sua Feira Literária Cultural, tendo Antônio Carlos Côrtes como patrono, fortalecendo a literatura e a leitura na região.',
    link: 'https://diariodeviamao.com.br/',
    etiqueta: 'Feira Literária',
    jurisdicao: 'Municipal (Viamão)',
    elegibilidade: 'Estudantes, Professores e Público em Geral',
    prazo: 'Evento Literário Anual',
    plataforma: 'Diário de Viamão / Jornal Opinião'
  },
  {
    id: 'news-festejos-farroupilhas',
    data: '10/09/2025',
    origem: 'Estadual (SEDAC-RS)',
    categoria_filtro: 'sedac-rs',
    titulo: 'Viamão celebra Festejos Farroupilhas destacando arte e tradição no Setembrino',
    resumo: 'Viamão, historicamente o "Berço da História Gaúcha" e ex-capital, realiza intensa programação nos Festejos Farroupilhas, incluindo atividades musicais do projeto Arte e Tradição, cavalgadas, bailes e exibições para preservação do patrimônio gaúcho nas novas gerações.',
    link: 'https://www.viamao.rs.gov.br/',
    etiqueta: 'Tradição e Memória',
    jurisdicao: 'Municipal (Viamão)',
    elegibilidade: 'CTGs, Entidades Tradicionalistas e Sociedade',
    prazo: 'Setembro / Mês Farroupilha',
    plataforma: 'Prefeitura de Viamão / Sistema Pró-Cultura'
  }
];`;

const regex = /export const INITIAL_NEWS: NewsItem\[\] = \[[\s\S]*?\];\n\nexport const INITIAL_FAC_EDITAIS/g;

if (regex.test(code)) {
  code = code.replace(regex, newsReplacement + '\n\nexport const INITIAL_FAC_EDITAIS');
  fs.writeFileSync(file, code);
  console.log('Fixed INITIAL_NEWS');
} else {
  console.log('Could not find INITIAL_NEWS');
}
