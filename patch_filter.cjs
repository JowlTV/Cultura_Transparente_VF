const fs = require('fs');
const file = 'src/components/ExecutiveSummary.tsx';
let code = fs.readFileSync(file, 'utf8');

// I need to change the useMemo logic to match the new tabs
const filterLogicRegex = /const noticiasFiltradas = useMemo\(\(\) => \{[\s\S]*?return matchesCategoria && matchesBusca;\n    \}\);\n  \}, \[noticias, filtroCategoria, buscaTexto\]\);/g;

const newFilterLogic = `const noticiasFiltradas = useMemo(() => {
    return noticias.filter(n => {
      // Filtro por Categoria / Origem
      let matchesCategoria = true;
      if (filtroCategoria === 'editais') {
        matchesCategoria = n.categoria_filtro === 'editais' || Boolean(n.prazo) || n.etiqueta.toLowerCase().includes('edital');
      } else if (filtroCategoria === 'viamao') {
        matchesCategoria = n.jurisdicao === 'Municipal (Viamão)' || n.categoria_filtro === 'viamao';
      } else if (filtroCategoria === 'eventos') {
        matchesCategoria = n.etiqueta.includes('Evento') || n.etiqueta.includes('Tradição') || n.etiqueta.includes('Feira');
      }

      // Filtro por Texto de Busca
      let matchesBusca = true;
      if (buscaTexto.trim()) {
        const query = buscaTexto.toLowerCase();
        matchesBusca =
          n.titulo.toLowerCase().includes(query) ||
          n.resumo.toLowerCase().includes(query) ||
          n.etiqueta.toLowerCase().includes(query) ||
          Boolean(n.elegibilidade && n.elegibilidade.toLowerCase().includes(query));
      }

      return matchesCategoria && matchesBusca;
    });
  }, [noticias, filtroCategoria, buscaTexto]);`;

code = code.replace(filterLogicRegex, newFilterLogic);
fs.writeFileSync(file, code);
