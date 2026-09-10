const fs = require('fs');
const file = 'src/data/initialData.ts';
let code = fs.readFileSync(file, 'utf8');

// We will use regex to remove google_nota, google_avaliacoes_total, google_maps_url, and set google_maps_presente to false for those without real location.
// Actually, let's just remove google_nota and google_avaliacoes_total from all of them since they were generated.
code = code.replace(/\s*google_nota:\s*[\d.]+,\n/g, '\n');
code = code.replace(/\s*google_avaliacoes_total:\s*\d+,\n/g, '\n');

fs.writeFileSync(file, code);
