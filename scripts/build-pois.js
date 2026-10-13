#!/usr/bin/env node
/**
 * Genera el catálogo de puntos de socorro de Bogotá (RF-10) a partir de datos abiertos REALES:
 *  - Portal de Datos Abiertos de Bogotá (CKAN): «Red adscrita de salud» (Secretaría Distrital de Salud) → verified: true.
 *  - OpenStreetMap (Overpass): hospitales y centros de salud, estaciones de bomberos, puntos de encuentro,
 *    albergues y parques grandes (espacios abiertos) → verified: false, con su fuente.
 *
 * Salida: assets/bundle/poi/pois.json (viaja en la app, funciona sin conexión) y server/seed/pois.json (servidor).
 * Uso: node scripts/build-pois.js        (necesita red; el portal oficial es intermitente: si no responde, se omite y se avisa)
 *
 * Licencias: OSM ODbL (© OpenStreetMap contributors); portal de Bogotá, la licencia de cada conjunto (CC BY 4.0 o similar).
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const BBOX = '4.45,-74.25,4.85,-73.95'; // sur,oeste,norte,este (Bogotá D.C. y alrededores)
const UA = 'EarthQuakeTracker-academic/0.1 (UNIMINUTO software engineering project)';
const OVERPASS = 'https://overpass-api.de/api/interpreter';
const CKAN = 'https://datosabiertos.bogota.gov.co/api/3/action';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function http(url, opts = {}, tries = 3) {
  let last;
  for (let i = 1; i <= tries; i++) {
    try {
      const res = await fetch(url, { ...opts, headers: { 'User-Agent': UA, Accept: 'application/json', ...(opts.headers || {}) }, signal: AbortSignal.timeout(150_000) });
      if (res.ok) return res;
      last = new Error(`HTTP ${res.status}`);
    } catch (e) {
      last = e;
    }
    await sleep(8000 * i);
  }
  throw last;
}

async function overpass(body, label = '') {
  // Overpass puede responder 200 con un resultado PARCIAL cuando está saturado (campo `remark`): se trata como fallo y se reintenta.
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await http(OVERPASS, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'data=' + encodeURIComponent(`[out:json][timeout:120];${body};out center bb tags;`) });
    const data = await res.json();
    await sleep(8000); // cortesía con el servicio público
    if (!data.remark || !/runtime error|timed out|out of memory|too many/i.test(data.remark)) {
      console.log(`  ${label || 'consulta'}: ${data.elements.length} elementos`);
      return data.elements;
    }
    console.warn(`  ${label || 'consulta'}: resultado parcial (${data.remark.slice(0, 80)}), reintento ${attempt}/4`);
    await sleep(20000 * attempt);
  }
  throw new Error(`Overpass no devolvió un resultado completo para «${label}»`);
}

const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
// Con `out center bb` las áreas pueden llegar solo con su rectángulo: el centro se calcula desde él.
const center = (e) => ({
  lat: e.lat ?? e.center?.lat ?? (e.bounds ? (e.bounds.minlat + e.bounds.maxlat) / 2 : undefined),
  lon: e.lon ?? e.center?.lon ?? (e.bounds ? (e.bounds.minlon + e.bounds.maxlon) / 2 : undefined),
});
const meters = (a, b) => {
  const R = 6371000, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};
const areaM2 = (b) => (b ? meters({ lat: b.minlat, lon: b.minlon }, { lat: b.minlat, lon: b.maxlon }) * meters({ lat: b.minlat, lon: b.minlon }, { lat: b.maxlat, lon: b.minlon }) : 0);
const addr = (t) => [t['addr:street'], t['addr:housenumber']].filter(Boolean).join(' ') || undefined;

function fromOsm(elements, type, label, extra = () => ({})) {
  return elements
    .filter((e) => e.tags?.name && center(e).lat != null)
    .map((e) => {
      const c = center(e);
      return {
        id: `osm-${e.type[0]}${e.id}`,
        type,
        name: e.tags.name.slice(0, 190),
        lat: +c.lat.toFixed(6),
        lon: +c.lon.toFixed(6),
        address: addr(e.tags),
        phone: (e.tags.phone || e.tags['contact:phone'] || '').slice(0, 40) || undefined,
        active: true,
        source: `OpenStreetMap (${label})`,
        verified: false,
        ...extra(e),
      };
    });
}

async function officialHealth() {
  try {
    const q = await (await http(`${CKAN}/package_search?q=${encodeURIComponent('Red adscrita de salud')}&rows=3`)).json();
    const pkg = q.result.results.find((p) => /red adscrita de salud/i.test(p.title));
    const res = pkg?.resources.find((r) => /geojson/i.test(r.format));
    if (!res) throw new Error('sin recurso GeoJSON');
    const gj = await (await http(res.url)).json();
    const out = [];
    for (const f of gj.features || []) {
      const g = f.geometry; const p = f.properties || {};
      if (!g || g.type !== 'Point') continue;
      const name = p.nombre_ips || p.NOMBRE || p.nombre || p.Nombre || p.NOMBRE_IPS || p.nom_ips;
      if (!name) continue;
      out.push({ id: `sds-${out.length + 1}`, type: 'SALUD', name: String(name).slice(0, 190), lat: +g.coordinates[1].toFixed(6), lon: +g.coordinates[0].toFixed(6), address: (p.direccion || p.DIRECCION || p.Direccion || '').slice(0, 290) || undefined, phone: undefined, active: true, source: `Secretaría Distrital de Salud · Datos Abiertos Bogotá (${pkg.license_id || 'licencia del portal'})`, verified: true });
    }
    console.log(`  portal oficial: ${out.length} instituciones de salud`);
    return out;
  } catch (e) {
    console.warn(`  portal oficial no disponible (${e.message}); se omite en esta corrida`);
    return [];
  }
}

(async () => {
  console.log('Descargando datos abiertos…');
  const official = await officialHealth();

  const hospitals = fromOsm(await overpass(`(nwr[amenity=hospital](${BBOX});)`, 'hospitales'), 'SALUD', 'hospital');
  const clinics = fromOsm(await overpass(`(nwr[amenity=clinic]["name"](${BBOX});nwr[healthcare=centre]["name"](${BBOX});)`, 'clínicas'), 'SALUD', 'clínica o centro de salud');
  const fire = fromOsm(await overpass(`(nwr[amenity=fire_station](${BBOX});)`, 'bomberos'), 'BOMBEROS', 'estación de bomberos');
  const assembly = fromOsm(await overpass(`(nwr[emergency=assembly_point](${BBOX});)`, 'puntos de encuentro'), 'ZONA_SEGURA', 'punto de encuentro');
  const parksRaw = await overpass(`(way[leisure=park]["name"](${BBOX});relation[leisure=park]["name"](${BBOX});)`, 'parques');
  const parks = fromOsm(parksRaw.filter((e) => areaM2(e.bounds) >= 30_000), 'ZONA_SEGURA', 'parque, espacio abierto', () => ({ note: 'Espacio abierto (parque); no es un punto de encuentro oficial.' }));
  const sheltersRaw = await overpass(`(nwr[social_facility=shelter](${BBOX});nwr[emergency=shelter](${BBOX});nwr[amenity=shelter]["name"~"albergue|refugio|hogar de paso|alojamiento",i](${BBOX});nwr[amenity=social_facility]["name"~"albergue|refugio|hogar de paso|acogida",i](${BBOX});)`, 'albergues');
  const shelters = fromOsm(sheltersRaw, 'ALBERGUE', 'albergue o refugio');
  const acopio = fromOsm(await overpass(`(nwr["name"~"centro de acopio|acopio",i](${BBOX});)`, 'acopio'), 'ACOPIO', 'centro de acopio');

  // Salud: el registro oficial manda; un punto de OSM a menos de 120 m con el mismo nombre se descarta.
  const dedupe = (cands, base) => cands.filter((c) => !base.some((b) => b.type === c.type && meters(b, c) < 120 && (norm(b.name).includes(norm(c.name)) || norm(c.name).includes(norm(b.name)))));
  const health = [...official, ...dedupe([...hospitals, ...clinics], official)];
  const all = [...health, ...fire, ...assembly, ...parks, ...shelters, ...acopio];

  // Sin duplicados exactos por id; orden estable.
  const seen = new Set(); const pois = all.filter((p) => !seen.has(p.id) && seen.add(p.id)).sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
  const count = pois.reduce((m, p) => ((m[p.type] = (m[p.type] || 0) + 1), m), {});
  console.log('Resultado:', count, '| total', pois.length, '| verificados', pois.filter((p) => p.verified).length);

  const meta = { generatedAt: new Date().toISOString(), bbox: BBOX, attribution: '© OpenStreetMap contributors (ODbL); Datos Abiertos Bogotá' };
  fs.mkdirSync(path.join(root, 'assets/bundle/poi'), { recursive: true });
  fs.writeFileSync(path.join(root, 'assets/bundle/poi/pois.json'), JSON.stringify({ ...meta, pois }) + '\n');
  fs.writeFileSync(path.join(root, 'server/seed/pois.json'), JSON.stringify(pois, null, 1) + '\n');
  console.log('Escrito assets/bundle/poi/pois.json y server/seed/pois.json');
})().catch((e) => { console.error('Fallo:', e); process.exit(1); });
