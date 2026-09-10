const fs = require('fs');
const file = 'src/data/initialData.ts';
let code = fs.readFileSync(file, 'utf8');

// The array is INITIAL_PONTOS_CULTURAIS
// We can use a regex to match items and remove properties, but since it's a TS file, a simple regex over the block might work.
// Since we want to remove the ones with generic search URLs:
code = code.replace(/\s*google_maps_presente:\s*true,\n\s*google_maps_url:\s*'https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=[^']+',/g, '\n    google_maps_presente: false,');

// Removing lat/lon as well:
code = code.replace(/\s*lat:\s*-?[\d.]+,\n\s*lon:\s*-?[\d.]+,\n/g, '\n');
code = code.replace(/\s*apoios_comunitarios:\s*\d+,\n/g, '\n');


fs.writeFileSync(file, code);
