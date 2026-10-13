#!/usr/bin/env node
/**
 * Genera el par de claves Ed25519 que firma la lista de códigos de socorrista (D-06) y la pimienta del hash.
 *  - Clave PÚBLICA y pimienta → src/core/rescuer/trust.json (se compilan en la app; no son secretas).
 *  - Clave PRIVADA → server/.env (SERVER_SIGNING_KEY), que .gitignore excluye. NUNCA se commitea ni se imprime.
 * Uso: node scripts/rescuer-keys.js [--force]
 */
const fs = require('fs');
const path = require('path');
const { generateKeyPairSync, randomBytes } = require('crypto');

const root = path.join(__dirname, '..');
const envPath = path.join(root, 'server', '.env');
const trustPath = path.join(root, 'src', 'core', 'rescuer', 'trust.json');

if (fs.existsSync(envPath) && /SERVER_SIGNING_KEY=/.test(fs.readFileSync(envPath, 'utf8')) && !process.argv.includes('--force')) {
  console.error('Ya existe una clave de firma en server/.env. Usa --force solo si quieres INVALIDAR todos los códigos emitidos.');
  process.exit(1);
}
const { publicKey, privateKey } = generateKeyPairSync('ed25519');
const pubB64 = publicKey.export({ format: 'der', type: 'spki' }).subarray(-32).toString('base64');
const privB64 = privateKey.export({ format: 'der', type: 'pkcs8' }).toString('base64');
const pepper = randomBytes(24).toString('hex');

fs.mkdirSync(path.dirname(trustPath), { recursive: true });
fs.writeFileSync(trustPath, JSON.stringify({ publicKey: pubB64, pepper, maxAgeDays: 90 }, null, 2) + '\n');

let env = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
env = env.split('\n').filter((l) => !/^(SERVER_SIGNING_KEY|RESCUER_PEPPER)=/.test(l)).join('\n').replace(/\n*$/, '\n');
env += `SERVER_SIGNING_KEY=${privB64}\nRESCUER_PEPPER=${pepper}\n`;
fs.writeFileSync(envPath, env, { mode: 0o600 });
console.log('Claves generadas.\n  Pública y pimienta → src/core/rescuer/trust.json\n  Privada → server/.env (no se muestra)');
