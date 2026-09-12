const fs = require('fs');
const file = 'src/data/initialData.ts';
let code = fs.readFileSync(file, 'utf8');

const newExample = `{
  "sistema": "SalicNet - Ministério da Cultura",
  "versao_consulta": "2026.1",
  "municipio": "Viamão - RS",
  "status_pesquisa": "Aguardando sincronização oficial",
  "projetos_encontrados": 0,
  "mensagem": "Não há projetos validados para este município no momento.",
  "link_dados_oficiais": "https://aplicacoes.cultura.gov.br/comparar/salicnet/"
}`;

// I will replace the object inside exemploResposta
// First, find the block to replace
const regex = /"sistema": "SalicNet - Ministério da Cultura",[\s\S]*?"link_dados_oficiais": "https:\/\/aplicacoes\.cultura\.gov\.br\/comparar\/salicnet\/"/g;

code = code.replace(regex, `"sistema": "SalicNet - Ministério da Cultura",
  "versao_consulta": "2026.1",
  "municipio": "Viamão - RS",
  "status_pesquisa": "Aguardando sincronização oficial",
  "projetos_encontrados": 0,
  "mensagem": "Não há projetos validados para este município no momento.",
  "link_dados_oficiais": "https://aplicacoes.cultura.gov.br/comparar/salicnet/"`);

fs.writeFileSync(file, code);
