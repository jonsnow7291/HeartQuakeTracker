#!/usr/bin/env node

/**
 * scripts/validate-content.js
 *
 * Validador de contenido educativo para EarthQuakeTracker (MW-2026).
 * Node puro SIN dependencias externas.
 * Valida:
 *  - content/guias/*.md (front-matter YAML) contra content/schema/guide.schema.json
 *  - content/quiz/*.json contra content/schema/quizbank.schema.json
 *  - content/manifest.json (si existe) contra content/schema/manifest.schema.json
 *
 * Tolera carpetas vacías o inexistentes.
 * Sale con código 1 en caso de error y 0 si todo es válido.
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const SCHEMAS_DIR = path.join(REPO_ROOT, 'content', 'schema');
const GUIAS_DIR = path.join(REPO_ROOT, 'content', 'guias');
const QUIZ_DIR = path.join(REPO_ROOT, 'content', 'quiz');
const MANIFEST_PATH = path.join(REPO_ROOT, 'content', 'manifest.json');

// --- Validador mínimo de JSON Schema draft-07 ---

function getJsonType(val) {
  if (val === null) return 'null';
  if (Array.isArray(val)) return 'array';
  return typeof val;
}

function validateSchema(value, schema, pathStr = '') {
  const errors = [];
  const currentPath = pathStr || '(raíz)';

  if (!schema) return errors;

  // Validación de tipo
  if (schema.type) {
    const expectedType = schema.type;
    const actualType = getJsonType(value);

    if (expectedType === 'integer') {
      if (typeof value !== 'number' || !Number.isInteger(value)) {
        errors.push(`${currentPath}: Se esperaba un número entero ('integer'), pero se recibió '${actualType}'`);
        return errors;
      }
    } else if (expectedType === 'number') {
      if (typeof value !== 'number' || isNaN(value)) {
        errors.push(`${currentPath}: Se esperaba un valor numérico ('number'), pero se recibió '${actualType}'`);
        return errors;
      }
    } else if (actualType !== expectedType) {
      errors.push(`${currentPath}: Se esperaba tipo '${expectedType}', pero se recibió '${actualType}'`);
      return errors;
    }
  }

  // Validación de objetos
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    if (Array.isArray(schema.required)) {
      for (const requiredKey of schema.required) {
        if (!(requiredKey in value) || value[requiredKey] === undefined) {
          errors.push(`${currentPath}: Falta el campo obligatorio '${requiredKey}'`);
        }
      }
    }

    if (schema.additionalProperties === false) {
      const allowedKeys = new Set(Object.keys(schema.properties || {}));
      for (const actualKey of Object.keys(value)) {
        if (!allowedKeys.has(actualKey)) {
          errors.push(`${currentPath}: Propiedad no permitida '${actualKey}'`);
        }
      }
    }

    if (schema.properties) {
      for (const [propName, propSchema] of Object.entries(schema.properties)) {
        if (propName in value && value[propName] !== undefined) {
          const childPath = pathStr ? `${pathStr}.${propName}` : propName;
          errors.push(...validateSchema(value[propName], propSchema, childPath));
        }
      }
    }
  }

  // Validación de arreglos
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      errors.push(`${currentPath}: Debe contener al menos ${schema.minItems} elemento(s) (actual: ${value.length})`);
    }
    if (schema.maxItems !== undefined && value.length > schema.maxItems) {
      errors.push(`${currentPath}: No puede contener más de ${schema.maxItems} elemento(s) (actual: ${value.length})`);
    }
    if (schema.items) {
      for (let i = 0; i < value.length; i++) {
        const childPath = `${pathStr}[${i}]`;
        errors.push(...validateSchema(value[i], schema.items, childPath));
      }
    }
  }

  // Validación de cadenas
  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push(`${currentPath}: El texto no puede estar vacío (longitud mínima: ${schema.minLength})`);
    }
    if (schema.pattern) {
      const regex = new RegExp(schema.pattern);
      if (!regex.test(value)) {
        errors.push(`${currentPath}: El valor '${value}' no cumple con el patrón requerido: ${schema.pattern}`);
      }
    }
    if (schema.enum && !schema.enum.includes(value)) {
      errors.push(`${currentPath}: El valor '${value}' no es válido. Opciones permitidas: [${schema.enum.join(', ')}]`);
    }
    if (schema.format === 'date-time') {
      const parsed = Date.parse(value);
      if (isNaN(parsed)) {
        errors.push(`${currentPath}: '${value}' no tiene formato de fecha/hora ISO 8601 válido (date-time)`);
      }
    }
  }

  // Validación de números
  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push(`${currentPath}: El valor ${value} es menor al mínimo permitido (${schema.minimum})`);
    }
    if (schema.maximum !== undefined && value > schema.maximum) {
      errors.push(`${currentPath}: El valor ${value} es mayor al máximo permitido (${schema.maximum})`);
    }
    if (schema.enum && !schema.enum.includes(value)) {
      errors.push(`${currentPath}: El valor ${value} no es válido. Opciones permitidas: [${schema.enum.join(', ')}]`);
    }
  }

  return errors;
}

// --- Parser YAML Front-matter ligero en Node puro ---

function parseScalar(val) {
  const trimmed = val.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null') return null;
  if (/^-?\d+$/.test(trimmed)) return parseInt(trimmed, 10);
  if (/^-?\d+\.\d+$/.test(trimmed)) return parseFloat(trimmed);
  return trimmed;
}

function splitYamlArray(str) {
  const items = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if ((char === '"' || char === "'") && (i === 0 || str[i - 1] !== '\\')) {
      if (!inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (quoteChar === char) {
        inQuotes = false;
      }
      current += char;
    } else if (char === ',' && !inQuotes) {
      items.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) {
    items.push(current.trim());
  }
  return items;
}

function parseYamlValue(val) {
  const trimmed = val.trim();
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    const inner = trimmed.slice(1, -1).trim();
    if (inner === '') return [];
    try {
      return JSON.parse(trimmed);
    } catch (_) {
      return splitYamlArray(inner).map(parseScalar);
    }
  }
  return parseScalar(trimmed);
}

function parseFrontMatter(fileContent, filePath) {
  const cleanContent = fileContent.replace(/^\uFEFF/, '');
  const match = cleanContent.match(/^---\r?\n([\s\S]*?)\r?\n---\s*(\r?\n|$)/);

  if (!match) {
    return {
      error: `El archivo '${filePath}' no contiene un bloque front-matter YAML inicial delimitado por '---'`,
      data: null
    };
  }

  const rawYaml = match[1];
  const lines = rawYaml.split(/\r?\n/);
  const data = {};
  let currentKey = null;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) {
      continue;
    }

    const arrayItemMatch = line.match(/^-\s+(.*)$/);
    if (arrayItemMatch) {
      if (!currentKey || !Array.isArray(data[currentKey])) {
        return {
          error: `Línea ${i + 1} en '${filePath}': Elemento de lista sin clave previa`,
          data: null
        };
      }
      data[currentKey].push(parseScalar(arrayItemMatch[1]));
      continue;
    }

    const kvMatch = line.match(/^([a-zA-Z0-9_-]+)\s*:\s*(.*)$/);
    if (!kvMatch) {
      return {
        error: `Línea ${i + 1} en '${filePath}': Formato YAML inválido: '${line}'`,
        data: null
      };
    }

    const key = kvMatch[1].trim();
    const rawVal = kvMatch[2].trim();

    if (rawVal === '') {
      currentKey = key;
      data[key] = [];
    } else {
      currentKey = key;
      data[key] = parseYamlValue(rawVal);
    }
  }

  return { error: null, data };
}

// --- Ejecución principal ---

function loadSchema(schemaFileName) {
  const schemaPath = path.join(SCHEMAS_DIR, schemaFileName);
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Esquema requerido no encontrado: ${schemaPath}`);
  }
  return JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
}

function main() {
  console.log('🔍 Iniciando validación de contenido (EarthQuakeTracker)...');

  let guideSchema;
  let quizBankSchema;
  let manifestSchema;

  try {
    guideSchema = loadSchema('guide.schema.json');
    quizBankSchema = loadSchema('quizbank.schema.json');
    manifestSchema = loadSchema('manifest.schema.json');
  } catch (err) {
    console.error(`❌ Error al cargar esquemas JSON: ${err.message}`);
    process.exit(1);
  }

  let totalFilesChecked = 0;
  let totalErrors = 0;
  const errorReport = [];

  // 1. Validar guías en content/guias/*.md
  if (!fs.existsSync(GUIAS_DIR)) {
    console.log('ℹ️  Carpeta content/guias/ no existe aún (omitida sin error).');
  } else {
    const files = fs.readdirSync(GUIAS_DIR).filter(f => f.endsWith('.md'));
    if (files.length === 0) {
      console.log('ℹ️  Carpeta content/guias/ está vacía (omitida sin error).');
    } else {
      console.log(`📄 Validando ${files.length} guía(s) en content/guias/...`);
      for (const file of files) {
        totalFilesChecked++;
        const filePath = path.join(GUIAS_DIR, file);
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const { error: fmError, data } = parseFrontMatter(content, file);
          if (fmError) {
            totalErrors++;
            errorReport.push({ file: `content/guias/${file}`, errors: [fmError] });
            continue;
          }

          const validationErrors = validateSchema(data, guideSchema);
          if (validationErrors.length > 0) {
            totalErrors += validationErrors.length;
            errorReport.push({ file: `content/guias/${file}`, errors: validationErrors });
          }
        } catch (err) {
          totalErrors++;
          errorReport.push({ file: `content/guias/${file}`, errors: [`Error de lectura: ${err.message}`] });
        }
      }
    }
  }

  // 2. Validar cuestionarios en content/quiz/*.json
  if (!fs.existsSync(QUIZ_DIR)) {
    console.log('ℹ️  Carpeta content/quiz/ no existe aún (omitida sin error).');
  } else {
    const files = fs.readdirSync(QUIZ_DIR).filter(f => f.endsWith('.json'));
    if (files.length === 0) {
      console.log('ℹ️  Carpeta content/quiz/ está vacía (omitida sin error).');
    } else {
      console.log(`❓ Validando ${files.length} archivo(s) de quiz en content/quiz/...`);
      for (const file of files) {
        totalFilesChecked++;
        const filePath = path.join(QUIZ_DIR, file);
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          let json;
          try {
            json = JSON.parse(content);
          } catch (jsonErr) {
            totalErrors++;
            errorReport.push({ file: `content/quiz/${file}`, errors: [`JSON inválido: ${jsonErr.message}`] });
            continue;
          }

          const validationErrors = validateSchema(json, quizBankSchema);
          if (validationErrors.length > 0) {
            totalErrors += validationErrors.length;
            errorReport.push({ file: `content/quiz/${file}`, errors: validationErrors });
          }
        } catch (err) {
          totalErrors++;
          errorReport.push({ file: `content/quiz/${file}`, errors: [`Error de lectura: ${err.message}`] });
        }
      }
    }
  }

  // 3. Validar content/manifest.json si existe
  if (fs.existsSync(MANIFEST_PATH)) {
    totalFilesChecked++;
    console.log('📦 Validando content/manifest.json...');
    try {
      const content = fs.readFileSync(MANIFEST_PATH, 'utf8');
      const json = JSON.parse(content);
      const validationErrors = validateSchema(json, manifestSchema);
      if (validationErrors.length > 0) {
        totalErrors += validationErrors.length;
        errorReport.push({ file: 'content/manifest.json', errors: validationErrors });
      }
    } catch (err) {
      totalErrors++;
      errorReport.push({ file: 'content/manifest.json', errors: [`Error al procesar manifiesto: ${err.message}`] });
    }
  }

  // Resultados
  if (totalErrors > 0) {
    console.error('\n❌ Se encontraron errores de validación de contenido:');
    for (const item of errorReport) {
      console.error(`\n  Archivo: ${item.file}`);
      for (const err of item.errors) {
        console.error(`    • ${err}`);
      }
    }
    console.error(`\nTotal: ${totalErrors} error(es) en ${errorReport.length} archivo(s).`);
    process.exit(1);
  }

  console.log(`\n✓ Validación exitosa: ${totalFilesChecked} archivo(s) verificado(s) correctamente, 0 errores.`);
  process.exit(0);
}

main();
