const fs = require('fs');
const path = require('path');
const lr = require('lucide-react');

let missingCount = 0;

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      scanDir(full);
    } else if (full.endsWith('.tsx') || full.endsWith('.ts')) {
      const content = fs.readFileSync(full, 'utf8');
      const regex = /import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"]/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        const names = match[1].split(',').map(s => s.trim().split(/\s+as\s+/)[0].trim()).filter(Boolean);
        for (const name of names) {
          if (!lr[name]) {
            console.log(`[MISSING ICON] in ${path.relative(__dirname, full)}: "${name}"`);
            missingCount++;
          }
        }
      }
    }
  }
}

scanDir(path.join(__dirname, '..', 'src'));
console.log(`Scan completed. Total missing icons: ${missingCount}`);
