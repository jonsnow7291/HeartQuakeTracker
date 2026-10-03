#!/usr/bin/env node
// Publica content/guias y content/quiz como paquete de contenido en el servidor (POST /admin/content/publish).
// Uso: node scripts/publish-content.js --url http://localhost:3000 --token <ADMIN_TOKEN> --version 1.0.0 [--dry-run]
const fs = require('fs');
const path = require('path');

const arg = (n, d) => {
  const i = process.argv.indexOf('--' + n);
  return i > -1 ? process.argv[i + 1] : d;
};
const url = arg('url', process.env.API_URL);
const token = arg('token', process.env.ADMIN_TOKEN);
const version = arg('version');
const dry = process.argv.includes('--dry-run');
const root = path.join(__dirname, '..', 'content');

if (!version || !/^\d+\.\d+\.\d+$/.test(version) || (!dry && (!url || !token))) {
  console.error('Uso: node scripts/publish-content.js --url <API> --token <ADMIN_TOKEN> --version x.y.z [--dry-run]');
  process.exit(2);
}

const files = [];
const walk = (dir) => {
  for (const name of fs.readdirSync(dir).sort()) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (name !== '.gitkeep') files.push({ path: path.relative(root, full).split(path.sep).join('/'), contentBase64: fs.readFileSync(full).toString('base64') });
  }
};
for (const sub of ['guias', 'quiz']) if (fs.existsSync(path.join(root, sub))) walk(path.join(root, sub));

if (!files.length) {
  console.error('No hay archivos en content/guias ni content/quiz');
  process.exit(1);
}
console.log(`Paquete ${version}: ${files.length} archivos (${files.map((f) => f.path).join(', ')})`);
if (dry) process.exit(0);

fetch(`${url.replace(/\/$/, '')}/admin/content/publish`, {
  method: 'POST',
  headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
  body: JSON.stringify({ version, files }),
}).then(async (res) => {
  const body = await res.text();
  console.log(res.status, body);
  process.exit(res.ok ? 0 : 1);
}).catch((e) => { console.error('Error de red:', e.message); process.exit(1); });
