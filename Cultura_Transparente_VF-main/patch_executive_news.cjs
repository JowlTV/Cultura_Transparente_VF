const fs = require('fs');
const file = 'src/components/ExecutiveSummary.tsx';
let code = fs.readFileSync(file, 'utf8');

// Change the header
code = code.replace(/Feed de Notícias & Editais Oficiais/g, 'Jornal Cultural de Viamão');
code = code.replace(/Fontes Primárias Oficiais/g, 'Resumos da Web / Notícias');
code = code.replace(/Atualizações normativas, chamamentos públicos e avisos técnicos do Ministério da Cultura \(MinC\), SEDAC-RS e Prefeitura de Viamão/g, 'Giro de notícias gerado através das últimas atualizações, eventos e movimentações da cultura na cidade de Viamão (Google Search)');

// Change the tabs
const tabsRegex = /\{\[\s*\{ id: 'todos', label: 'Todas as Fontes', count: noticias\.length \},[\s\S]*?\]\.map\(tab => \(/g;
const newTabs = `{[
              { id: 'todos', label: 'Últimas Notícias', count: noticias.length },
              { id: 'viamao', label: 'Cultura Viamão', count: noticias.filter(n => n.jurisdicao === 'Municipal (Viamão)').length },
              { id: 'editais', label: 'Editais & Fomento', count: noticias.filter(n => n.categoria_filtro === 'editais').length },
              { id: 'eventos', label: 'Festejos & Eventos', count: noticias.filter(n => n.etiqueta.includes('Evento') || n.etiqueta.includes('Tradição') || n.etiqueta.includes('Feira')).length },
            ].map(tab => (`;

code = code.replace(tabsRegex, newTabs);

fs.writeFileSync(file, code);
