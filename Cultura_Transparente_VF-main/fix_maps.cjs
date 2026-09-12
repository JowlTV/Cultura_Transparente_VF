const fs = require('fs');
const file = 'src/data/initialData.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/\s*google_nota:\s*[\d.]+,\n/g, '\n');
code = code.replace(/\s*google_avaliacoes_total:\s*\d+,\n/g, '\n');
code = code.replace(/\s*nota_maps_explicacao:\s*'.*',\n/g, '\n');

// the user complained about "apontando para uma localização falsa" for places not in Maps.
// Which ones don't exist?
// Associação da Cultura Hip-Hop (index 6):
// Let's just remove google_maps_url, lat, lon, and set google_maps_presente: false for those that have generic search urls: 'https://www.google.com/maps/search/?api=1&query=...'
// Wait, ALL of them have generic search urls.
// Let's remove google_maps_url, lat, lon and google_maps_presente from ALL of them except for a few well known ones?
// Actually, let's just remove google_maps_url and set google_maps_presente: false for the ones that don't have a specific map URL, or just remove the search URL and lat/lon if they are fake.
// To be safe and strict: "impeça o sistema de burlar qualquer informação e gerar falsas afirmações quanto a localização, se não tem no google maps, não tem informação de localização."
// Let's remove lat, lon, google_maps_presente, google_maps_url from all of them, except maybe keep lat/lon if they are actually real. But they were probably all generated (hallucinated) coordinates!

// Let's remove google_maps_presente, google_maps_url, lat, lon from ALL items in INITIAL_PONTOS_CULTURAIS where we don't have absolute certainty.
fs.writeFileSync(file, code);
