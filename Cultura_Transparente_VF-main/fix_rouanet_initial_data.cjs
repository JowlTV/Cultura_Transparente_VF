const fs = require('fs');
const file = 'src/data/initialData.ts';
let code = fs.readFileSync(file, 'utf8');

// We will remove the entire object for rouanet-01.
// Let's use a regex to replace the object block.
const regex = /\{\s*id:\s*'rouanet-01'[\s\S]*?\},/g;
code = code.replace(regex, '');

fs.writeFileSync(file, code);
