const fs = require('fs');
const file = 'src/components/LeisIncentivoSection.tsx';
let code = fs.readFileSync(file, 'utf8');

const emptyState = `
        {itensFiltrados.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
              <Layers className="w-8 h-8 text-slate-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 font-['Outfit']">Nenhum projeto encontrado</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Aguardando sincronização oficial. Não foram encontrados registros validados para este mecanismo na base oficial do Ministério da Cultura.
              </p>
            </div>
          </div>
        )}
`;

code = code.replace(
  /\{itensFiltrados\.map\(item => \{/g,
  `${emptyState}\n        {itensFiltrados.map(item => {`
);

fs.writeFileSync(file, code);
