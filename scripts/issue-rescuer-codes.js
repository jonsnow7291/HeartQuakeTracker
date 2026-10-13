#!/usr/bin/env node
/**
 * Emite códigos de socorrista de alta entropía (60 bits) y la lista firmada de sus hashes (D-06).
 *  - Lista firmada (solo hashes) → assets/bundle/rescuer/list.json: viaja en la app para validar sin conexión.
 *  - Hashes + organización → server/seed/rescuer_hashes.json: el servidor los carga para servir /v1/rescuer/list y revocar.
 *  - Los códigos EN CLARO solo se imprimen aquí, una vez. Entrégalos a cada organismo por un canal seguro; no se guardan.
 * Uso: node scripts/issue-rescuer-codes.js "Defensa Civil Colombiana" "Cruz Roja Colombiana" ...
 */
const fs = require('fs');
const path = require('path');
const { createHash, createPrivateKey, randomInt, sign } = require('crypto');

const root = path.join(__dirname, '..');
const trust = JSON.parse(fs.readFileSync(path.join(root, 'src/core/rescuer/trust.json'), 'utf8'));
const env = Object.fromEntries(fs.readFileSync(path.join(root, 'server/.env'), 'utf8').split('\n').filter((l) => l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]));
if (!env.SERVER_SIGNING_KEY) throw new Error('Falta SERVER_SIGNING_KEY: ejecuta primero scripts/rescuer-keys.js');
if (env.RESCUER_PEPPER !== trust.pepper) throw new Error('La pimienta de server/.env no coincide con trust.json');

const orgs = process.argv.slice(2);
if (!orgs.length) { console.error('Indica al menos un organismo.'); process.exit(1); }

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // sin 0/O/1/I/L para evitar errores al dictarlo
const block = () => Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
const prefix = (o) => o.normalize('NFD').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'ORG';
const hashCode = (c) => createHash('sha256').update(`${trust.pepper}:${c.trim().toUpperCase()}`).digest('hex');

const issuedAt = new Date().toISOString();
const expiresAt = new Date(Date.now() + 365 * 86_400_000).toISOString();
const rows = orgs.map((organization) => { const code = `${prefix(organization)}-${block()}-${block()}-${block()}`; return { organization, code, hash: hashCode(code) }; });
const hashes = rows.map((r) => r.hash);
const message = `${issuedAt}|${[...hashes].sort().join(',')}`;
const key = createPrivateKey({ key: Buffer.from(env.SERVER_SIGNING_KEY, 'base64'), format: 'der', type: 'pkcs8' });
const signature = sign(null, Buffer.from(message), key).toString('base64');

fs.mkdirSync(path.join(root, 'assets/bundle/rescuer'), { recursive: true });
fs.writeFileSync(path.join(root, 'assets/bundle/rescuer/list.json'), JSON.stringify({ issuedAt, hashes, signature }, null, 2) + '\n');
fs.writeFileSync(path.join(root, 'server/seed/rescuer_hashes.json'), JSON.stringify(rows.map((r) => ({ codeHash: r.hash, organization: r.organization, expiresAt, revoked: false })), null, 2) + '\n');

console.log(`Lista firmada emitida (${issuedAt}). ENTREGA estos códigos y no los guardes en el repositorio:\n`);
for (const r of rows) console.log(`  ${r.organization.padEnd(32)} ${r.code}`);
