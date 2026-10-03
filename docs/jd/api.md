# Referencia de la API REST – EarthQuakeTracker Server

Este documento es la especificación técnica completa y fiel de la API REST de **EarthQuakeTracker** implementada en Fastify sobre Node.js (`server/src/`). Está dirigida al equipo de Frontend (**Santiago**) para la integración del cliente móvil y las herramientas administrativas.

---

## 1. Mecanismo de Seguridad y Autenticación

La API utiliza tres niveles de acceso según el endpoint:
1. **Público:** No requiere cabeceras especiales ni autenticación.
2. **Firma de Dispositivo (`requireDevice`):** Autenticación criptográfica asimétrica basada en **Ed25519** sin contraseñas ni tokens de sesión centralizados.
3. **Token de Administrador:** Requiere cabecera HTTP `Authorization: Bearer <ADMIN_TOKEN>`. Si `ADMIN_TOKEN` no está configurado en el servidor, los endpoints `/admin/*` devuelven `503 ADMIN_DISABLED`.

---

## 2. Registro de Dispositivo

Antes de emitir peticiones a endpoints protegidos por dispositivo, el cliente móvil debe registrar su clave pública y obtener su `deviceId`.

- **Ruta:** `POST /v1/devices/register`
- **Autenticación:** Pública con **Prueba de Posesión** (*Proof of Possession*).
- **Esquema Zod:** [`registerInput`](file:///home/lazarus/Downloads/uni/Ing.De Software/earthquake-tracker/server/src/routes/schemas.ts#L66-L72)

### Proceso de Registro:
1. El cliente genera un par de claves asimétricas **Ed25519** (32 bytes de clave pública cruda).
2. Obtiene la clave pública cruda en base64 (`publicKey`, entre 40 y 60 caracteres base64).
3. Obtiene la marca de tiempo actual en milisegundos (`ts = Date.now()`).
4. Construye el mensaje exacto:
   ```
   register|<publicKey>|<ts>
   ```
5. Firma dicho mensaje con su clave privada Ed25519 y codifica la firma en base64 (`proof`).
6. Envía la petición con `platform` (`'android' | 'ios'`) y `appVersion` (1 a 32 caracteres).

### Derivación de `deviceId`:
El servidor calcula el identificador unívoco del dispositivo mediante la fórmula:
```ts
deviceId = 'dev_' + sha256Hex(Buffer.from(publicKey, 'base64')).slice(0, 16);
```

#### Ejemplo de Request:
```json
{
  "publicKey": "11qYAYKxCrfVS/7TyWQHOg7hcvPapiMlrwIaaPcHURo=",
  "platform": "android",
  "appVersion": "0.1.0",
  "ts": 1775235600000,
  "proof": "E7B4m8YqJ2...base64..."
}
```

#### Ejemplo de Response (201 Created / 200 OK):
```json
{
  "deviceId": "dev_a1b2c3d4e5f60718"
}
```

#### Códigos de Error:
- `400 Bad Request`: `{"error": "VALIDATION", "issues": ["..."]}` si el formato JSON o los tipos no cumplen, o si `publicKey` no representa exactamente 32 bytes Ed25519.
- `401 Unauthorized`: `{"error": "UNAUTHORIZED", "reason": "timestamp fuera de ventana"}` si `Math.abs(Date.now() - ts) > SIGNATURE_SKEW_MS`.
- `401 Unauthorized`: `{"error": "UNAUTHORIZED", "reason": "prueba de posesión inválida"}` si la firma Ed25519 no valida contra la clave pública.
- `403 Forbidden`: `{"error": "REVOKED"}` si el dispositivo fue revocado previamente.

---

## 3. Firma de Peticiones (`requireDevice`)

Para todos los endpoints que requieren firma de dispositivo (`POST /v1/sync/batch` y `POST /v1/seismic/readings`), el cliente debe incluir 4 cabeceras HTTP obligatorias:

| Cabecera | Tipo / Formato | Descripción |
| :--- | :--- | :--- |
| `X-Device-Id` | String | El identificador `deviceId` obtenido en el registro (ej. `dev_a1b2c3d4e5f60718`). |
| `X-Timestamp` | String (numérico en ms) | Marca de tiempo del cliente en milisegundos: `String(Date.now())`. |
| `X-Nonce` | String | Identificador aleatorio único para esta petición (ej. UUID v4 o hex de 16+ bytes). Previene ataques de repetición. |
| `X-Signature` | String (base64) | Firma digital Ed25519 generada con la clave privada del dispositivo sobre la **cadena canónica**. |

### Construcción de la Cadena Canónica
La función [`canonicalRequest()`](file:///home/lazarus/Downloads/uni/Ing.De Software/earthquake-tracker/server/src/security/deviceAuth.ts#L41-L43) define la representación textual exacta que debe firmarse:

$$\text{CanonicalRequest} = \text{METODO} + \texttt{"\\n"} + \text{RUTA+QUERY} + \texttt{"\\n"} + \text{TS} + \texttt{"\\n"} + \text{NONCE} + \texttt{"\\n"} + \text{SHA256HEX(cuerpo)}$$

Donde:
1. `METODO`: Método HTTP en mayúsculas (ej. `POST`).
2. `RUTA+QUERY`: URL relativa exacta invocada (ej. `/v1/sync/batch` o `/v1/pois?since=2026-10-01T00:00:00Z`).
3. `TS`: La misma cadena numérica de milisegundos enviada en `X-Timestamp`.
4. `NONCE`: El mismo valor de un solo uso enviado en `X-Nonce`.
5. `SHA256HEX(cuerpo)`: Hash SHA-256 en minúsculas hexadecimal del cuerpo crudo (`Buffer` de bytes de la petición tal como viaja en la red). Si la petición no tiene cuerpo o es de longitud 0, se usa el hash del buffer vacío: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.

### Ejemplo en TypeScript (cliente):
```ts
import { createHash, sign } from 'node:crypto';

const ts = String(Date.now());
const nonce = crypto.randomUUID();
const bodyBuffer = Buffer.from(JSON.stringify(payload), 'utf8');
const bodyHash = createHash('sha256').update(bodyBuffer).digest('hex');

const canonical = ['POST', '/v1/sync/batch', ts, nonce, bodyHash].join('\n');
const signature = sign(null, Buffer.from(canonical), privateKey).toString('base64');

const headers = {
  'Content-Type': 'application/json',
  'X-Device-Id': deviceId,
  'X-Timestamp': ts,
  'X-Nonce': nonce,
  'X-Signature': signature,
};
```

### Respuestas de Error de Autenticación (401 Unauthorized):
- `{"error": "UNAUTHORIZED", "reason": "faltan cabeceras de firma"}`
- `{"error": "UNAUTHORIZED", "reason": "timestamp fuera de ventana"}` (desfase mayor a `SIGNATURE_SKEW_MS`, por defecto 5 minutos).
- `{"error": "UNAUTHORIZED", "reason": "dispositivo desconocido o revocado"}`
- `{"error": "UNAUTHORIZED", "reason": "firma inválida"}`
- `{"error": "UNAUTHORIZED", "reason": "nonce repetido"}` (el mismo nonce se reusó dentro del TTL).

---

## 4. Endpoints de la API

---

### 4.1. Salud del Sistema

#### `GET /v1/health`
- **Autenticación:** Pública
- **Descripción:** Comprueba la disponibilidad del servidor y entrega la hora actual en UTC.
- **Request:** Sin parámetros ni cuerpo.
- **Response (200 OK):**
  ```json
  {
    "status": "ok",
    "ts": "2026-10-03T11:45:00.000Z"
  }
  ```

---

### 4.2. Puntos de Interés (RF-10)

#### `GET /v1/pois`
- **Autenticación:** Pública
- **Descripción:** Consulta el catálogo de puntos de interés (hospitales, bomberos, albergues, zonas seguras, acopio) con soporte de filtrado espacial y sincronización delta.
- **Query Parameters:**
  - `bbox` *(opcional, string)*: Coordenadas de la caja delimitadora en formato `"minLon,minLat,maxLon,maxLat"` (4 números flotantes separados por comas).
  - `types` *(opcional, string)*: Tipos separados por comas. Valores permitidos: `ALBERGUE`, `ACOPIO`, `BOMBEROS`, `SALUD`, `ZONA_SEGURA`.
  - `since` *(opcional, string)*: Fecha ISO 8601. Si se provee, retorna solo los POIs modificados después de esa fecha (para sincronización delta).
- **Response (200 OK):**
  ```json
  {
    "items": [
      {
        "id": "poi-salud-001",
        "type": "SALUD",
        "name": "Hospital Universitario San Ignacio",
        "lat": 4.6295,
        "lon": -74.0655,
        "address": "Cra. 7 # 40 - 62",
        "phone": "+57 601 5946161",
        "active": true,
        "source": "Secretaría Distrital de Salud de Bogotá",
        "verified": false,
        "updatedAt": "2026-10-03T11:20:00.000Z"
      }
    ],
    "serverTime": "2026-10-03T11:45:00.000Z"
  }
  ```
- **Errores:**
  - `400 Bad Request`: `{"error": "VALIDATION", "issues": ["bbox = minLon,minLat,maxLon,maxLat"]}` o `["types inválido"]` o `["since debe ser fecha ISO"]`.

---

### 4.3. Ayudas y Directorio Institucional (RF-11)

#### `GET /v1/aid/entities`
- **Autenticación:** Pública
- **Descripción:** Lista las entidades oficiales de socorro y ayuda activas (`active === true`).
- **Response (200 OK):**
  ```json
  {
    "items": [
      {
        "id": "defensa-civil-colombiana",
        "name": "Defensa Civil Colombiana",
        "kind": "SOCORRO",
        "description": "Institución social y humanitaria del Estado...",
        "active": true,
        "verifiedAt": "2026-10-03T00:00:00.000Z",
        "verified": false,
        "channels": [
          {
            "type": "WEB",
            "value": "https://www.defensacivil.gov.co",
            "active": true
          }
        ]
      }
    ]
  }
  ```

#### `GET /v1/aid/needs`
- **Autenticación:** Pública
- **Descripción:** Lista el catálogo estandarizado de necesidades prioritarias para donaciones y reportes.
- **Response (200 OK):**
  ```json
  {
    "items": [
      {
        "id": "need-agua-potable",
        "category": "VIVERES",
        "label": "Agua potable embotellada o en bolsa",
        "urgency": "ALTA"
      }
    ]
  }
  ```

---

### 4.4. Detección Sísmica y Red Colaborativa (RF-09)

#### `POST /v1/seismic/readings`
- **Autenticación:** **Firma de Dispositivo obligatoria** (`requireDevice`).
- **Descripción:** Ingesta de lecturas de aceleración inercial registradas por el teléfono móvil.
- **Esquema Zod (`readingsInput`):**
  - `readings`: Array de 1 a 100 objetos:
    - `eventId` *(opcional, string 8..64)*: ID local del evento.
    - `ts` *(string)*: Fecha ISO 8601 del muestreo.
    - `peakG` *(number, 0 a 20)*: Pico máximo de aceleración en gravedades ($g$).
    - `lat` *(opcional, number, -90 a 90)*: Latitud de la lectura.
    - `lon` *(opcional, number, -180 a 180)*: Longitud de la lectura.
    - `quorumNodes` *(entero $\ge 0$, por defecto 0)*: Nodos cercanos que registraron vibración simultánea.
    - `classification` *(enum, por defecto `'POSSIBLE'`)*: `'POSSIBLE' | 'CONFIRMED' | 'DISCARDED'`.
- **Request Body:**
  ```json
  {
    "readings": [
      {
        "eventId": "sis-local-001",
        "ts": "2026-10-03T11:44:50.000Z",
        "peakG": 0.12,
        "lat": 4.6295,
        "lon": -74.0655,
        "quorumNodes": 3,
        "classification": "POSSIBLE"
      }
    ]
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "accepted": 1,
    "confirmedEvents": 0
  }
  ```
- **Errores:** `400 VALIDATION`, `401 UNAUTHORIZED`.

#### `GET /v1/seismic/events`
- **Autenticación:** Pública
- **Descripción:** Lista los eventos sísmicos confirmados o procesados por el servidor.
- **Query Parameters:**
  - `since` *(opcional, string)*: Fecha ISO 8601.
- **Response (200 OK):**
  ```json
  {
    "items": [
      {
        "id": "seis-2026-001",
        "startedAt": "2026-10-03T11:40:00.000Z",
        "lat": 4.65,
        "lon": -74.09,
        "confidence": 0.85,
        "devicesCount": 12,
        "confirmed": true
      }
    ]
  }
  ```
- **Errores:** `400 Bad Request` si `since` no es ISO válido.

---

### 4.5. Paquetes de Contenido Educativo (RF-01)

#### `GET /v1/content/manifest`
- **Autenticación:** Pública
- **Descripción:** Obtiene el manifiesto JSON de la última versión publicada del paquete educativo.
- **Response (200 OK):**
  ```json
  {
    "version": "1.0.0",
    "generatedAt": "2026-10-03T10:00:00.000Z",
    "files": [
      {
        "path": "guias/mochila-emergencia.md",
        "sha256": "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a",
        "bytes": 2450
      }
    ]
  }
  ```
- **Errores:** `404 Not Found` con `{"error": "NO_CONTENT"}` si aún no hay paquetes publicados.

#### `GET /v1/content/package/:version`
- **Autenticación:** Pública
- **Descripción:** Descarga el paquete completo correspondiente a la versión especificada con todos sus archivos en base64.
- **Path Parameters:**
  - `version` *(string)*: Versión semántica del paquete (ej. `1.0.0`).
- **Response (200 OK):**
  ```json
  {
    "version": "1.0.0",
    "manifest": { "...": "..." },
    "files": [
      {
        "path": "guias/mochila-emergencia.md",
        "sha256": "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a",
        "bytes": 2450,
        "contentBase64": "LS0tCmlkOiBtb2NoaWxhLWVtZXJnZW5jaWE..."
      }
    ],
    "publishedAt": "2026-10-03T10:00:00.000Z"
  }
  ```
- **Errores:** `404 Not Found` con `{"error": "NOT_FOUND"}`.

---

### 4.6. Teselas Vectoriales Offline / Mapas (RF-10)

#### `GET /v1/tiles/regions`
- **Autenticación:** Pública
- **Descripción:** Lista las regiones geográficas de mapa vectorial offline disponibles para descarga.
- **Response (200 OK):**
  ```json
  {
    "items": [
      {
        "id": "bogota",
        "name": "Bogotá",
        "sizeMB": 180,
        "hash": "a1b2c3...",
        "version": "1",
        "url": "https://storage.earthquake-tracker.org/tiles/bogota-v1.mbtiles"
      }
    ]
  }
  ```

#### `GET /v1/tiles/regions/:id/download`
- **Autenticación:** Pública
- **Descripción:** Redirige (código HTTP `302 Found`) a la URL externa directa de descarga del archivo `.mbtiles`.
- **Path Parameters:**
  - `id` *(string)*: ID de la región (ej. `bogota`).
- **Response:** `302 Found` con cabecera `Location: <url>`.
- **Errores:**
  - `404 Not Found` con `{"error": "NOT_FOUND"}` si la región no existe.
  - `404 Not Found` con `{"error": "NOT_PUBLISHED"}` si la región aún no tiene URL de descarga asignada.

---

### 4.7. Verificación de Socorristas (RF-13)

#### `POST /v1/rescuer/verify`
- **Autenticación:** Pública (protegido con límite estricto de **10 peticiones/minuto**).
- **Descripción:** Permite validar online un código institucional de brigadista/socorrista.
- **Request Body:**
  - `code` *(string, longitud 6 a 64 caracteres)*
  ```json
  {
    "code": "CRUZROJA-2026"
  }
  ```
- **Response (200 OK):**
  - Si el código es válido y vigente:
    ```json
    {
      "valid": true,
      "organization": "Cruz Roja Colombiana",
      "expiresAt": "2026-12-31T23:59:59.000Z"
    }
    ```
  - Si no existe, fue revocado o expiró:
    ```json
    {
      "valid": false
    }
    ```
- **Errores:** `400 Bad Request` si `code` no cumple longitud 6..64.

#### `GET /v1/rescuer/list`
- **Autenticación:** Pública
- **Descripción:** Entrega la lista de hashes SHA-256 de todos los códigos de socorrista vigentes, **firmada criptográficamente con Ed25519 por el servidor**. Permite al app validar credenciales de socorristas en terreno de forma **100% offline** (Decisión D-06).
- **Response (200 OK):**
  ```json
  {
    "issuedAt": "2026-10-03T11:45:00.000Z",
    "hashes": [
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08"
    ],
    "publicKey": "serverPubkeyEd25519Base64...",
    "signature": "serverSignatureBase64..."
  }
  ```

---

### 4.8. Sincronización Store-and-Forward (RF-12)

#### `POST /v1/sync/batch`
- **Autenticación:** **Firma de Dispositivo obligatoria** (`requireDevice`).
- **Descripción:** Ingesta por lotes idempotente de eventos de emergencia, reportes de daños, solicitudes de ayuda, marcas de "estoy a salvo" y problemas en POIs acumulados localmente durante la desconexión.
- **Esquema Zod (`batchSchema`):**
  - `events`: Array de **1 a 500** eventos (`eventSchema`):
    - `eventId` *(string, 8 a 64 caracteres)*: UUID o identificador idempotente generado por el cliente.
    - `type` *(enum)*: `'REPORT_DAMAGE' | 'REQUEST_AID' | 'MARK_SAFE' | 'POI_PROBLEM' | 'SENSOR_READING' | 'POSITION' | 'EMERGENCY_STARTED' | 'EMERGENCY_STOPPED'`.
    - `ts` *(string)*: Fecha ISO 8601 del evento.
    - `device` *(string, 1 a 64 caracteres)*: **Debe ser idéntico al `deviceId` derivado de la firma de la petición (`req.deviceId`)**.
    - `payload` *(record<string, unknown>, por defecto `{}`)*: Carga útil del evento según su tipo:
      - Para `REPORT_DAMAGE`: `{ "category": "ESTRUCTURAL"|"SERVICIOS"|"VIAS"|"OTRO", "description": string }`
      - Para `REQUEST_AID`: `{ "need": string, "people": number }`
      - Para `POI_PROBLEM`: `{ "poiId": string, "reason": string, "note"?: string }`
      - Para `SENSOR_READING`: `{ "peakG": number, "quorumNodes"?: number, "classification"?: "POSSIBLE"|"CONFIRMED"|"DISCARDED" }`
    - `geo` *(opcional, objeto)*:
      - `lat` *(number, -90 a 90)*
      - `lon` *(number, -180 a 180)*
      - `acc` *(opcional, number $\ge 0$)*: Precisión en metros.

#### Reglas de Procesamiento y ACKs:
Cada evento del lote recibe un acuse de recibo individual en la respuesta:
- `'OK'`: Evento nuevo almacenado y procesado exitosamente.
- `'DUP'`: El `eventId` ya había sido recibido previamente (idempotencia; no se duplica).
- `'REJECTED'`: Evento rechazado:
  - Razón: `'device no coincide con la firma'` (intento de suplantación).
  - Razón: `'ts en el futuro'` (la fecha del evento excede el tiempo actual del servidor más `maxFutureSkewMs`).

#### Request Body:
```json
{
  "events": [
    {
      "eventId": "evt-77a1-4321-9abc-0001",
      "type": "MARK_SAFE",
      "ts": "2026-10-03T11:42:00.000Z",
      "device": "dev_a1b2c3d4e5f60718",
      "payload": {},
      "geo": {
        "lat": 4.6295,
        "lon": -74.0655,
        "acc": 8.5
      }
    },
    {
      "eventId": "evt-77a1-4321-9abc-0002",
      "type": "REPORT_DAMAGE",
      "ts": "2026-10-03T11:43:10.000Z",
      "device": "dev_a1b2c3d4e5f60718",
      "payload": {
        "category": "ESTRUCTURAL",
        "description": "Grietas severas en fachada de edificio de 4 pisos."
      },
      "geo": {
        "lat": 4.6301,
        "lon": -74.0662
      }
    }
  ]
}
```

#### Response (200 OK):
```json
{
  "acks": [
    {
      "eventId": "evt-77a1-4321-9abc-0001",
      "status": "OK"
    },
    {
      "eventId": "evt-77a1-4321-9abc-0002",
      "status": "OK"
    }
  ]
}
```

#### Errores a nivel HTTP:
- `400 Bad Request`: `{"error": "VALIDATION", "issues": [...]}` si el lote no tiene entre 1 y 500 eventos o hay campos mal formados.
- `401 Unauthorized`: Error de firma de dispositivo.

---

### 4.9. Endpoints Administrativos (`/admin/*`)

Requieren cabecera `Authorization: Bearer <ADMIN_TOKEN>`. Si `ADMIN_TOKEN` está ausente en la configuración del servidor, responden `503 Service Unavailable` (`{"error": "ADMIN_DISABLED"}`).

#### `POST /admin/pois` y `PUT /admin/pois/:id`
- **Esquema (`poiInput`):**
  - `id`: string (1..64)
  - `type`: `'ALBERGUE' | 'ACOPIO' | 'BOMBEROS' | 'SALUD' | 'ZONA_SEGURA'`
  - `name`: string (1..200)
  - `lat`: number (-90..90)
  - `lon`: number (-180..180)
  - `address` *(opcional, string máx 300)*
  - `phone` *(opcional, string máx 40)*
  - `active` *(boolean, default true)*
  - `source` *(opcional, string máx 200)*
  - `verified` *(boolean, default false)*
- **Response (200 OK):** Registro POI creado/actualizado.

#### `POST /admin/aid/entities`
- **Esquema (`aidEntityInput`):** `id` (1..64), `name` (1..200), `kind` (`'GOBIERNO' | 'ONG' | 'SOCORRO'`), `description` (opcional máx 1000), `active` (boolean), `verifiedAt` (ISO), `verified` (opcional boolean), `channels` (array de `{ type, value, requirements?, active }`).
- **Response (201 Created):** Objeto de entidad creado.

#### `POST /admin/aid/needs`
- **Esquema (`aidNeedInput`):** `id` (1..64), `category` (1..64), `label` (1..200), `urgency` (`'ALTA' | 'MEDIA' | 'BAJA'`).
- **Response (201 Created):** Objeto de necesidad creado.

#### `POST /admin/content/publish`
- **Descripción:** Publica un nuevo paquete educativo de guías.
- **Esquema (`contentPublishInput`):**
  - `version`: string semver (ej. `1.0.0`).
  - `files`: array de 1 a 500 objetos `{ path: string (1..300), contentBase64: string }`.
- **Response (201 Created):** `{"version": "1.0.0", "files": 8}`.
- **Errores:** `409 Conflict` con `{"error": "VERSION_EXISTS"}` si la versión ya había sido publicada.

#### `POST /admin/tiles/regions`
- **Esquema (`tileRegionInput`):** `id` (1..64), `name` (1..200), `sizeMB` (positivo), `hash` (opcional máx 128), `version` (1..32), `url` (opcional URL válida).
- **Response (201 Created):** Objeto de región creado.

#### `POST /admin/rescuer/codes`
- **Esquema (`rescuerCodeInput`):** `code` (6..64), `organization` (1..200), `expiresAt` (ISO 8601).
- **Response (201 Created):** `{"organization": "...", "expiresAt": "..."}`.
