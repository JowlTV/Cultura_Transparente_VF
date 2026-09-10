const fs = require('fs');

// 1. Types
let typesFile = fs.readFileSync('src/types/culture.ts', 'utf8');
typesFile = typesFile.replace(/\| 'website'/g, '');
fs.writeFileSync('src/types/culture.ts', typesFile);

// 2. Initial Data
let dataFile = fs.readFileSync('src/data/initialData.ts', 'utf8');
dataFile = dataFile.replace(/tipo: 'website',/g, "tipo: 'outro',");
fs.writeFileSync('src/data/initialData.ts', dataFile);

// 3. MapeamentoCulturalSection
let mapFile = fs.readFileSync('src/components/MapeamentoCulturalSection.tsx', 'utf8');
mapFile = mapFile.replace(/setNovoTipo\('website'\)/g, "setNovoTipo('outro')");
mapFile = mapFile.replace(/useState<SharedCommunityLink\['tipo'\]>\('website'\)/g, "useState<SharedCommunityLink['tipo']>('outro')");
fs.writeFileSync('src/components/MapeamentoCulturalSection.tsx', mapFile);

// 4. RedesEngajamentoSection
let redesFile = fs.readFileSync('src/components/RedesEngajamentoSection.tsx', 'utf8');
redesFile = redesFile.replace(/<option value="website">Site Oficial \/ Portal MinC<\/option>/g, '');
fs.writeFileSync('src/components/RedesEngajamentoSection.tsx', redesFile);

