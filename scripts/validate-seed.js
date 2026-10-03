#!/usr/bin/env node

/**
 * scripts/validate-seed.js
 *
 * Validador de datos semilla para EarthQuakeTracker (MW-2026).
 * Node puro SIN dependencias externas.
 * Valida:
 *  - server/seed/pois.json (Poi contract + source + verified + límites geográficos de Bogotá)
 *  - server/seed/entidades_ayuda.json (AidEntity contract + verified)
 *  - server/seed/necesidades.json (AidNeed contract)
 *
 * Requisitos comprobados:
 *  - Tipos y presencia de campos obligatorios
 *  - Enums: PoiType, AidEntity.kind, AidChannel.type, AidNeed.urgency
 *  - Coordenadas geográficas dentro de Bogotá (Lat: 4.4 a 4.9, Lon: -74.3 a -73.9)
 *  - Unicidad estricta de IDs en cada archivo
 *
 * Sale con código 1 si hay fallos y 0 si todo es válido.
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const SEED_DIR = path.join(REPO_ROOT, 'server', 'seed');

const POIS_PATH = path.join(SEED_DIR, 'pois.json');
const ENTIDADES_PATH = path.join(SEED_DIR, 'entidades_ayuda.json');
const NECESIDADES_PATH = path.join(SEED_DIR, 'necesidades.json');

// Enums permitidos según src/contracts/
const POI_TYPES = new Set(['ALBERGUE', 'ACOPIO', 'BOMBEROS', 'SALUD', 'ZONA_SEGURA']);
const AID_KINDS = new Set(['GOBIERNO', 'ONG', 'SOCORRO']);
const CHANNEL_TYPES = new Set(['WEB', 'TEL', 'CUENTA', 'EMAIL']);
const AID_URGENCIES = new Set(['ALTA', 'MEDIA', 'BAJA']);

// Límites geográficos para Bogotá D.C.
const BOGOTA_BOUNDS = {
  minLat: 4.4,
  maxLat: 4.9,
  minLon: -74.3,
  maxLon: -73.9,
};

function readJsonFile(filePath, label) {
  if (!fs.existsSync(filePath)) {
    return { error: `El archivo ${label} no existe en ${filePath}`, data: null };
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);
    return { error: null, data };
  } catch (err) {
    return { error: `Error al parsear JSON en ${label}: ${err.message}`, data: null };
  }
}

function isISODate(str) {
  if (typeof str !== 'string') return false;
  const time = Date.parse(str);
  return !isNaN(time);
}

function validatePois(pois) {
  const errors = [];
  if (!Array.isArray(pois)) {
    return ['pois.json debe contener un arreglo de puntos de interés (Poi)'];
  }
  if (pois.length < 20) {
    errors.push(`Se esperaban al menos 20 POIs, pero se encontraron ${pois.length}`);
  }

  const seenIds = new Set();

  pois.forEach((poi, index) => {
    const prefix = `pois[${index}] (${poi.id || 'sin id'})`;

    // ID
    if (!poi.id || typeof poi.id !== 'string') {
      errors.push(`${prefix}: 'id' es requerido y debe ser una cadena`);
    } else if (seenIds.has(poi.id)) {
      errors.push(`${prefix}: 'id' duplicado '${poi.id}'`);
    } else {
      seenIds.add(poi.id);
    }

    // Type
    if (!poi.type || typeof poi.type !== 'string' || !POI_TYPES.has(poi.type)) {
      errors.push(`${prefix}: 'type' debe ser uno de [${Array.from(POI_TYPES).join(', ')}]. Recibido: '${poi.type}'`);
    }

    // Name
    if (!poi.name || typeof poi.name !== 'string' || poi.name.trim() === '') {
      errors.push(`${prefix}: 'name' es requerido y debe ser una cadena no vacía`);
    }

    // Latitud
    if (typeof poi.lat !== 'number' || isNaN(poi.lat)) {
      errors.push(`${prefix}: 'lat' debe ser un número`);
    } else if (poi.lat < BOGOTA_BOUNDS.minLat || poi.lat > BOGOTA_BOUNDS.maxLat) {
      errors.push(
        `${prefix}: 'lat' (${poi.lat}) está fuera del rango permitido para Bogotá [${BOGOTA_BOUNDS.minLat}, ${BOGOTA_BOUNDS.maxLat}]`
      );
    }

    // Longitud
    if (typeof poi.lon !== 'number' || isNaN(poi.lon)) {
      errors.push(`${prefix}: 'lon' debe ser un número`);
    } else if (poi.lon < BOGOTA_BOUNDS.minLon || poi.lon > BOGOTA_BOUNDS.maxLon) {
      errors.push(
        `${prefix}: 'lon' (${poi.lon}) está fuera del rango permitido para Bogotá [${BOGOTA_BOUNDS.minLon}, ${BOGOTA_BOUNDS.maxLon}]`
      );
    }

    // Active
    if (typeof poi.active !== 'boolean') {
      errors.push(`${prefix}: 'active' debe ser un booleano`);
    }

    // Source (campo extra)
    if (!poi.source || typeof poi.source !== 'string') {
      errors.push(`${prefix}: 'source' es requerido como cadena`);
    }

    // Verified (campo extra)
    if (typeof poi.verified !== 'boolean') {
      errors.push(`${prefix}: 'verified' debe ser un booleano`);
    }

    // Opcionales
    if (poi.address !== undefined && typeof poi.address !== 'string') {
      errors.push(`${prefix}: 'address' debe ser una cadena si está presente`);
    }
    if (poi.phone !== undefined && typeof poi.phone !== 'string') {
      errors.push(`${prefix}: 'phone' debe ser una cadena si está presente`);
    }
  });

  return errors;
}

function validateEntidades(entidades) {
  const errors = [];
  if (!Array.isArray(entidades)) {
    return ['entidades_ayuda.json debe contener un arreglo de entidades (AidEntity)'];
  }

  const seenIds = new Set();

  entidades.forEach((ent, index) => {
    const prefix = `entidades[${index}] (${ent.id || 'sin id'})`;

    // ID
    if (!ent.id || typeof ent.id !== 'string') {
      errors.push(`${prefix}: 'id' es requerido y debe ser una cadena`);
    } else if (seenIds.has(ent.id)) {
      errors.push(`${prefix}: 'id' duplicado '${ent.id}'`);
    } else {
      seenIds.add(ent.id);
    }

    // Name
    if (!ent.name || typeof ent.name !== 'string' || ent.name.trim() === '') {
      errors.push(`${prefix}: 'name' es requerido y debe ser una cadena no vacía`);
    }

    // Kind
    if (!ent.kind || typeof ent.kind !== 'string' || !AID_KINDS.has(ent.kind)) {
      errors.push(`${prefix}: 'kind' debe ser uno de [${Array.from(AID_KINDS).join(', ')}]. Recibido: '${ent.kind}'`);
    }

    // Active
    if (typeof ent.active !== 'boolean') {
      errors.push(`${prefix}: 'active' debe ser un booleano`);
    }

    // verifiedAt
    if (!ent.verifiedAt || !isISODate(ent.verifiedAt)) {
      errors.push(`${prefix}: 'verifiedAt' debe ser una fecha ISO 8601 válida`);
    }

    // Verified (campo extra)
    if (typeof ent.verified !== 'boolean') {
      errors.push(`${prefix}: 'verified' debe ser un booleano`);
    }

    // Description opcional
    if (ent.description !== undefined && typeof ent.description !== 'string') {
      errors.push(`${prefix}: 'description' debe ser una cadena`);
    }

    // Channels
    if (!Array.isArray(ent.channels) || ent.channels.length === 0) {
      errors.push(`${prefix}: 'channels' debe ser un arreglo con al menos un canal`);
    } else {
      ent.channels.forEach((ch, chIdx) => {
        const chPrefix = `${prefix}.channels[${chIdx}]`;
        if (!ch.type || !CHANNEL_TYPES.has(ch.type)) {
          errors.push(`${chPrefix}: 'type' debe ser uno de [${Array.from(CHANNEL_TYPES).join(', ')}]`);
        }
        if (!ch.value || typeof ch.value !== 'string') {
          errors.push(`${chPrefix}: 'value' debe ser una cadena no vacía`);
        }
        if (typeof ch.active !== 'boolean') {
          errors.push(`${chPrefix}: 'active' debe ser un booleano`);
        }
        if (ch.requirements !== undefined && typeof ch.requirements !== 'string') {
          errors.push(`${chPrefix}: 'requirements' debe ser una cadena`);
        }
      });
    }
  });

  return errors;
}

function validateNecesidades(necesidades) {
  const errors = [];
  if (!Array.isArray(necesidades)) {
    return ['necesidades.json debe contener un arreglo de necesidades (AidNeed)'];
  }
  if (necesidades.length !== 8) {
    errors.push(`Se esperaban exactamente 8 necesidades, pero se encontraron ${necesidades.length}`);
  }

  const seenIds = new Set();

  necesidades.forEach((need, index) => {
    const prefix = `necesidades[${index}] (${need.id || 'sin id'})`;

    // ID
    if (!need.id || typeof need.id !== 'string') {
      errors.push(`${prefix}: 'id' es requerido y debe ser una cadena`);
    } else if (seenIds.has(need.id)) {
      errors.push(`${prefix}: 'id' duplicado '${need.id}'`);
    } else {
      seenIds.add(need.id);
    }

    // Category
    if (!need.category || typeof need.category !== 'string' || need.category.trim() === '') {
      errors.push(`${prefix}: 'category' es requerida y debe ser una cadena no vacía`);
    }

    // Label
    if (!need.label || typeof need.label !== 'string' || need.label.trim() === '') {
      errors.push(`${prefix}: 'label' es requerido y debe ser una cadena no vacía`);
    }

    // Urgency
    if (!need.urgency || typeof need.urgency !== 'string' || !AID_URGENCIES.has(need.urgency)) {
      errors.push(
        `${prefix}: 'urgency' debe ser uno de [${Array.from(AID_URGENCIES).join(', ')}]. Recibido: '${need.urgency}'`
      );
    }
  });

  return errors;
}

function main() {
  console.log('🌱 Iniciando validación de datos semilla (server/seed/)...');

  let totalErrors = 0;
  const report = {};

  // 1. Validar pois.json
  const poisResult = readJsonFile(POIS_PATH, 'pois.json');
  if (poisResult.error) {
    report['server/seed/pois.json'] = [poisResult.error];
    totalErrors++;
  } else {
    const errors = validatePois(poisResult.data);
    if (errors.length > 0) {
      report['server/seed/pois.json'] = errors;
      totalErrors += errors.length;
    } else {
      console.log(`  ✓ pois.json: ${poisResult.data.length} POIs válidos dentro de Bogotá.`);
    }
  }

  // 2. Validar entidades_ayuda.json
  const entResult = readJsonFile(ENTIDADES_PATH, 'entidades_ayuda.json');
  if (entResult.error) {
    report['server/seed/entidades_ayuda.json'] = [entResult.error];
    totalErrors++;
  } else {
    const errors = validateEntidades(entResult.data);
    if (errors.length > 0) {
      report['server/seed/entidades_ayuda.json'] = errors;
      totalErrors += errors.length;
    } else {
      console.log(`  ✓ entidades_ayuda.json: ${entResult.data.length} entidades de ayuda válidas.`);
    }
  }

  // 3. Validar necesidades.json
  const necResult = readJsonFile(NECESIDADES_PATH, 'necesidades.json');
  if (necResult.error) {
    report['server/seed/necesidades.json'] = [necResult.error];
    totalErrors++;
  } else {
    const errors = validateNecesidades(necResult.data);
    if (errors.length > 0) {
      report['server/seed/necesidades.json'] = errors;
      totalErrors += errors.length;
    } else {
      console.log(`  ✓ necesidades.json: ${necResult.data.length} necesidades de ayuda válidas.`);
    }
  }

  // Reporte final
  if (totalErrors > 0) {
    console.error('\n❌ Errores en la validación de datos semilla:');
    for (const [file, errs] of Object.entries(report)) {
      console.error(`\n  Archivo: ${file}`);
      for (const err of errs) {
        console.error(`    • ${err}`);
      }
    }
    console.error(`\nTotal: ${totalErrors} error(es) detectado(s).`);
    process.exit(1);
  }

  console.log('\n✓ Validación de datos semilla completada exitosamente sin errores.');
  process.exit(0);
}

main();
