#!/usr/bin/env node
/**
 * scripts/bundle-content.js
 *
 * Empaqueta el contenido educativo de content/ (guias, quiz) como un asset estático JSON
 * compatible con PackageData / BundledContent para el primer arranque de la app sin red.
 *
 * Uso:
 *   node scripts/bundle-content.js [--version 1.0.0] [--out content/bundle/content.json]
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const arg = (name, def) => {
  const idx = process.argv.indexOf('--' + name);
  return idx > -1 && process.argv[idx + 1] ? process.argv[idx + 1] : def;
};

const version = arg('version', '1.0.0');
const rootDir = path.resolve(__dirname, '..');
const contentDir = path.join(rootDir, 'content');
const defaultOut = path.join(contentDir, 'bundle', 'content.json');
const outFile = path.resolve(arg('out', defaultOut));

const sha256Hex = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');

const filesToBundle = [];
const walk = (dir) => {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir).sort();
  for (const name of entries) {
    if (name.startsWith('.') || name === '.gitkeep') continue;
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      walk(full);
    } else {
      const relPath = path.relative(contentDir, full).split(path.sep).join('/');
      const buffer = fs.readFileSync(full);
      const sha256 = sha256Hex(buffer);
      filesToBundle.push({
        path: relPath,
        sha256,
        bytes: buffer.length,
        dataBase64: buffer.toString('base64'),
      });
    }
  }
};

for (const sub of ['guias', 'quiz']) {
  walk(path.join(contentDir, sub));
}

if (filesToBundle.length === 0) {
  console.error('❌ Error: No se encontraron archivos para empaquetar en content/guias ni content/quiz');
  process.exit(1);
}

const manifest = {
  version,
  generatedAt: new Date().toISOString(),
  files: filesToBundle.map((f) => ({
    path: f.path,
    sha256: f.sha256,
    bytes: f.bytes,
  })),
};

const bundleData = {
  manifest,
  files: filesToBundle.map((f) => ({
    path: f.path,
    dataBase64: f.dataBase64,
  })),
};

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(bundleData, null, 2), 'utf8');

console.log(`✓ Paquete de contenido generado exitosamente en: ${path.relative(rootDir, outFile)}`);
console.log(`  Versión: ${version}`);
console.log(`  Archivos (${filesToBundle.length}):`);
for (const f of filesToBundle) {
  console.log(`    - ${f.path} (${f.bytes} B, sha256: ${f.sha256.substring(0, 12)}...)`);
}
