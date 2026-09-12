const fs = require('fs');
const file = 'src/components/RouanetSection.tsx';
let code = fs.readFileSync(file, 'utf8');

// Replace "Exemplo em Viamão: Restauro e Conservação da Igreja Matriz (PRONAC 23.9012)"
code = code.replace(
  /<span>Exemplo em Viamão: Restauro e Conservação da Igreja Matriz \(PRONAC 23\.9012\)<\/span>/g,
  '<span>Projetos de Restauro e Conservação de Patrimônio Histórico</span>'
);

// If there are no projects, change total to "Aguardando sincronização oficial"
// Currently it uses formatBRL(totalAprovado). Let's change how it displays.
code = code.replace(
  /\{formatBRL\(totalAprovado\)\}/g,
  "{rouanetProjetos.length > 0 ? formatBRL(totalAprovado) : 'Aguardando sincronização'}"
);
code = code.replace(
  /\{formatBRL\(totalCaptado\)\}/g,
  "{rouanetProjetos.length > 0 ? formatBRL(totalCaptado) : 'Aguardando sincronização'}"
);
// Also reduce the text size when it says "Aguardando sincronização" to avoid overflow.
// Actually, let's just make it conditionally render a span with smaller text if it's 0.
code = code.replace(
  /<span className="text-xl sm:text-2xl font-black text-white font-\['Outfit'\] block mt-1">/g,
  '<span className={`font-black font-[\'Outfit\'] block mt-1 ${rouanetProjetos.length > 0 ? "text-xl sm:text-2xl text-white" : "text-sm text-white/70"}`}>'
);
code = code.replace(
  /<span className="text-xl sm:text-2xl font-black text-emerald-300 font-\['Outfit'\] block mt-1">/g,
  '<span className={`font-black font-[\'Outfit\'] block mt-1 ${rouanetProjetos.length > 0 ? "text-xl sm:text-2xl text-emerald-300" : "text-sm text-emerald-200/70"}`}>'
);

fs.writeFileSync(file, code);
