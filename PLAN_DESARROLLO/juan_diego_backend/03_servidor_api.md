# JD – Servidor, BD y API (v1)

Stack propuesto (D-16): Node.js + TypeScript (Fastify/Nest), PostgreSQL (PostGIS opcional), cola (BullMQ/Redis o pg-boss), almacenamiento S3 (paquetes de contenido y tiles), despliegue en Supabase/DigitalOcean. HTTPS siempre, JSON, versión en ruta `/v1`.

## Autenticación de dispositivos
- Al primer sync, el dispositivo registra su **clave pública Ed25519** (`POST /v1/devices/register` con prueba de posesión).
- Cada petición firma un `X-Signature` sobre `(método|ruta|timestamp|hash(body))`; el servidor verifica y limita tasa (por dispositivo e IP).
- Terminales de socorristas: códigos de organismo emitidos desde el panel (D-06).

## Endpoints
| Método y ruta | Propósito | RF |
| --- | --- | --- |
| `POST /v1/devices/register` | Alta de dispositivo (pubkey) | RF-12 |
| `POST /v1/sync/batch` | Subir lote de eventos (reportes, lecturas, posiciones, "estoy a salvo", solicitudes de ayuda, reportes de POI). Idempotente por `eventId`; responde ACK por ítem `{eventId, status: OK\|DUP\|REJECTED, reason?}` | RF-12 |
| `POST /v1/seismic/readings` | Lecturas colaborativas (puede ir dentro de batch) | RF-09 |
| `GET /v1/seismic/events?since=` | Eventos confirmados (cuando hay red) | RF-09 |
| `GET /v1/pois?bbox=&types=&since=` | Delta de POIs | RF-10 |
| `GET /v1/aid/entities`, `GET /v1/aid/needs` | Catálogo de ayudas | RF-11 |
| `GET /v1/content/manifest` | Versión y hashes del paquete de contenido | RF-01 |
| `GET /v1/content/package/:version` | Descarga del paquete | RF-01 |
| `GET /v1/tiles/regions` | Regiones disponibles, tamaño, hash | RF-10 |
| `GET /v1/tiles/regions/:id/download` | Descarga firmada (URL prefirmada, con soporte `Range`) | RF-10 |
| `POST /v1/rescuer/verify` | Validar código de organismo (online) / listas de revocación | RF-13 |
| `GET /v1/health` | Salud | — |
| Admin (panel): `POST/PUT /admin/pois`, `/admin/aid/*`, `/admin/content/publish`, `/admin/rescuer/codes` | Gestión de datos y contenido | RF-10/11/01 |

### Formato de evento (sync)
```json
{ "eventId": "uuid-v7", "type": "REPORT_DAMAGE|REQUEST_AID|MARK_SAFE|POI_PROBLEM|SENSOR_READING|POSITION|EMERGENCY_STARTED|EMERGENCY_STOPPED",
  "ts": "2026-…Z", "device": "dev_123", "payload": { }, "geo": {"lat":4.6,"lon":-74.0,"acc":12} }
```
Las cargas con datos sensibles (ficha médica) **no se envían al servidor** en el MVP salvo decisión explícita; si se hace, van cifradas con clave de organismo.

## Modelo de datos (PostgreSQL)
| Tabla | Campos clave |
| --- | --- |
| `devices` | id, pubkey, platform, app_version, created_at, revoked |
| `events` | event_id (PK), device_id, type, ts, payload (jsonb), geo, received_at, status |
| `seismic_readings` | id, device_id, ts, peak_g, location, quorum_nodes, classification |
| `seismic_events` | id, started_at, centroid, confidence, devices_count, confirmed |
| `pois` | id, type, name, lat, lon, address, phone, active, updated_at, source |
| `poi_reports` | id, poi_id, device_id, reason, note, status |
| `aid_entities` / `aid_channels` / `aid_needs` | ver contrato `AidEntity` |
| `content_packages` | version, manifest, hash, published_at |
| `tile_regions` | id, name, size_mb, hash, version, url |
| `rescuer_codes` | code_hash, organization, expires_at, revoked |
| `audit_log` | id, actor, action, entity, ts |

## Cola y procesamiento
`events` → worker clasifica por tipo → tablas de dominio. Detección de eventos sísmicos confirmados por agregación espacio-temporal de `seismic_readings`.

## Requisitos de calidad del servidor
- Soportar ingestas masivas: batches de hasta 500 eventos; p95 < 500 ms por lote en staging.
- Idempotencia garantizada; reintentos seguros.
- Logs estructurados sin datos personales; retención configurable (Habeas Data).
- Backups diarios; migraciones versionadas; pruebas de integración con Postgres en CI.
- Rate limit y protección contra spoofing/replay (timestamp ±5 min + nonce).

## Entregables de servidor
S2 esqueleto + docker-compose · S3 registro de dispositivos · S8 `sync/batch` · S10 POIs/ayudas/contenido · S11 tiles · S12 staging · S16 producción.
