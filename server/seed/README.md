# Datos Semilla (Seed) – EarthQuakeTracker (MW-2026)

Este directorio contiene los conjuntos de datos iniciales en formato JSON utilizados para desarrollo local, pruebas de integración y carga inicial de la base de datos del servidor y la caché offline de la aplicación.

> [!CAUTION]
> **DATOS SEMILLA NO VERIFICADOS (`verified: false`)**
> Los registros contenidos en estos archivos corresponden a datos de desarrollo y pruebas con coordenadas y datos institucionales de referencia en Bogotá D.C.
> **Ningún registro aquí contenido debe utilizarse en entornos de producción** sin una auditoría, validación en terreno y verificación formal previa por parte de las entidades oficiales correspondientes (UNGRD, IDIGER, Defensa Civil Colombiana, Cruz Roja y Secretaría Distrital de Salud).

---

## Archivos del directorio

### 1. `pois.json`
Array de 20 puntos de interés reales en Bogotá D.C. estructurados conforme a la interfaz `Poi` definida en `src/contracts/map.ts`:
- **Tipos incluidos (`PoiType`):** `SALUD`, `BOMBEROS`, `ALBERGUE`, `ZONA_SEGURA`, `ACOPIO`.
- **Rango geográfico:** Coordenadas acotadas al perímetro urbano de Bogotá (Latitud: 4.4 a 4.9, Longitud: -74.3 a -73.9).
- **Campos adicionales de auditoría:**
  - `source`: Entidad o fuente oficial de referencia para el punto.
  - `verified`: `false` (indica que no ha sido auditado formalmente para producción).
- **Regla de integridad:** No se incluyen direcciones postales ni números telefónicos especulativos; dichos campos opcionales (`address`, `phone`) permanecen omitidos hasta su verificación fehaciente.

### 2. `entidades_ayuda.json`
Entidades de socorro y coordinación institucional en emergencias para Colombia, conforme a la interfaz `AidEntity` de `src/contracts/aid.ts`:
- **Entidades registradas:**
  1. Defensa Civil Colombiana (`kind: SOCORRO`)
  2. Unidad Nacional para la Gestión del Riesgo de Desastres - UNGRD (`kind: GOBIERNO`)
  3. Cruz Roja Colombiana (`kind: SOCORRO`)
  4. Instituto Distrital de Gestión de Riesgos y Cambio Climático - IDIGER (`kind: GOBIERNO`)
- **Canales (`AidChannel`):** Únicamente canales `WEB` correspondientes a sitios web institucionales seguros (`https://`).
- **Estado de verificación:** `verified: false`, `verifiedAt: "2026-10-03T00:00:00Z"`.

### 3. `necesidades.json`
Catálogo de 8 necesidades prioritarias de ayuda humanitaria para donaciones y reporte de suministros en sismos, conforme a la interfaz `AidNeed` de `src/contracts/aid.ts`:
- Categorías: `VIVERES`, `SALUD`, `HIGIENE`, `ABRIGO`, `EQUIPAMIENTO`.
- Niveles de urgencia: `ALTA`, `MEDIA`, `BAJA`.

---

## Validación

Todos los archivos de este directorio pueden y deben validarse contra sus contratos y restricciones de dominio ejecutando:

```bash
node scripts/validate-seed.js
```

El script verifica tipos, unicidad de identificadores, rangos geográficos válidos para Bogotá y enums estrictos.
