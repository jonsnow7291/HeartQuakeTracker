# 06 – Decisiones técnicas y de producto (CERRADAS para el MVP)

Estado: **DECIDIDO** (v1, 2026-10-03). Se pueden revisar solo con un ADR en `docs/adr/` aprobado por ambos. Alcance resultante en `07_alcance_mvp.md`.

## A. Producto
| ID | Decisión | Resolución MVP |
| --- | --- | --- |
| D-02 | Nombre | **EarthQuakeTracker** (las infografías "HeartQuakeTracker" se corrigen después; no bloquea) |
| D-03 | Duración | **16 semanas** |
| D-01 | Cuentas | **Cuenta local**: nombre + PIN de 6 dígitos + biometría opcional. Sin servidor de cuentas. El PIN protege la ficha y el progreso. La app **sigue funcionando sin cuenta** para guías, mapa y modo pánico básico (el pánico nunca exige desbloqueo; solo la ficha) |
| D-05 | Donaciones | **Solo informativo.** "Hacer donación" abre el canal oficial (enlace/teléfono/cuenta mostrada). Sin pagos en la app |
| D-06 | Socorristas (RF-13) | **Modo socorrista en la misma app**, habilitado con un **código de organismo**. Los códigos se validan **offline** contra una lista firmada (hash) que viaja en el paquete de datos y se actualiza vía servidor |
| D-07 | Mapa de intensidad | **Fuera del MVP.** Mapa = puntos de socorro offline. Alertas = detección local + quórum por malla |
| D-08 | Panel institucional | **Fuera del MVP.** Solo endpoints + consultas SQL/CSV de reportes para la demo |
| D-14 | Idioma | Solo **español (es-CO)**, con i18n preparado |
| D-19 | Cobertura geográfica | **Bogotá** (mapa y POIs). Otras regiones = post-MVP |
| D-20 | Plataformas | Android 10+ (API 29) y iOS 15+. **Android primero; paridad iOS en H3.** Límites de iOS en segundo plano se documentan en la app |
| D-21 | Analítica/telemetría | **Ninguna** en el MVP (privacidad). Solo métricas de pruebas internas |

## B. Técnicas (cliente)
| ID | Decisión | Resolución MVP |
| --- | --- | --- |
| D-04 | Lenguaje | **TypeScript** estricto |
| D-22 | Framework | **React Native bare (CLI), no Expo managed**, Hermes, última versión estable al iniciar la semana 1; se **congela** hasta H4 |
| D-13 | Gestor de paquetes | **Yarn (classic 1.x)** |
| D-12 | Estado en UI | **Zustand** + hooks que envuelven `subscribe()`; navegación con **React Navigation** |
| D-11 | BD local | **SQLCipher** vía `@op-engineering/op-sqlite` con SQLCipher habilitado. *Spike en S2*: si falla, `react-native-quick-sqlite` con SQLCipher; último recurso: AES-GCM por campo |
| D-17 | Cripto | **libsodium**: Ed25519 (firmas), X25519 + XChaCha20-Poly1305 (ficha a socorrista), ID efímero = HMAC-SHA256(secreto, ventana 15 min) truncado a 6 B. Clave maestra BD en Keystore/Keychain; KDF del PIN con Argon2id |
| D-09 | Mapas | **MapLibre GL Native** (`@maplibre/maplibre-react-native`) con **MBTiles vectoriales** (OpenMapTiles/Protomaps), zoom 8–15, región Bogotá. Fallback SA: lista de POIs con distancia y brújula |
| D-10 | BLE | Escaneo: `react-native-ble-plx`. **Advertising: módulo nativo propio** (Android `BluetoothLeAdvertiser`, iOS `CBPeripheralManager`). Canal de datos para ficha: **conexión GATT** sobre BLE (≤ ~512 B comprimidos). **Sin Wi-Fi Direct/Multipeer en MVP** |
| D-23 | Formato BLE MVP | **Paquete compacto ≤ 31 B (legacy)** compatible con todos: versión+flags, tipo, ID efímero 6 B, seq 2 B, gravedad, lat/lon cuantizados 3+3 B, timestamp 4 B, TTL 1 B, **firma truncada solo en extended advertising (BLE 5)**. Mensajes sin firma completa se marcan `verified=false` y se verifican por GATT cuando sea posible. Detalle en `juan_diego_backend/04_...` |
| D-24 | Malla | **BLE únicamente**, TTL inicial **4**, dedupe `(idEph, seq)` TTL 10 min, backoff 50–300 ms, cola máx. 200 con prioridad ATRAPADO > CON_LESIONES > ILESO |
| D-25 | SMS fallback | **SMS prellenado que abre la app de mensajes** con ubicación, el usuario solo pulsa "enviar" (no envío automático: iOS no lo permite). Se ofrece si pasan 2 min sin nodos puente |
| D-18 | Sensores | Detección local: acelerómetro 50 Hz, filtro paso-alto, **RMS > 0.03 g durante ≥ 1 s** ⇒ `POSSIBLE`; **quórum ≥ 3 nodos distintos en 10 s** ⇒ `CONFIRMED`. Umbrales en un JSON de configuración (`core/sensors/config.ts`), calibrables en S7 |
| D-26 | Batería | `lowPower` si batería **< 20 %**: ráfagas BLE cada 30 s, flash/tono en pulsos espaciados |
| D-27 | Pruebas cliente | Jest + React Native Testing Library; e2e con **Maestro**; lint ESLint + Prettier |

## C. Servidor
| ID | Decisión | Resolución MVP |
| --- | --- | --- |
| D-16 | Stack | **Node.js + TypeScript + Fastify**, **PostgreSQL** (sin PostGIS; filtros por bounding box), colas con **pg-boss** (sin Redis), validación con Zod, OpenAPI generada |
| D-28 | Hosting | **Supabase (PostgreSQL) + servicio Node en DigitalOcean/Railway**; tiles y paquetes de contenido en almacenamiento S3 compatible |
| D-29 | Auth dispositivos | Registro con clave pública Ed25519; peticiones firmadas con timestamp ±5 min; rate limit por dispositivo |
| D-30 | Datos sensibles | **La ficha médica nunca se envía al servidor.** Solo reportes, posiciones, lecturas, "estoy a salvo" y solicitudes |
| D-31 | Retención | Eventos 12 meses configurable; borrado por dispositivo bajo solicitud (Habeas Data) |

## D. Contenido
| ID | Decisión | Resolución MVP |
| --- | --- | --- |
| D-15 | Fuentes oficiales | UNGRD, Defensa Civil Colombiana, IDIGER (Bogotá), Cruz Roja Colombiana; citar en `protocolRef` |
| D-32 | Volumen mínimo | **Obligatorio:** 5 guías, 40 preguntas en 3 niveles. **Deseable:** 8 guías, 60 preguntas (ver `07`) |
| D-33 | Desbloqueo de nivel quiz | ≥ 70 % del puntaje del nivel anterior |
| D-34 | Insignias | "Primera guía", "Nivel 1/2/3", "Perfecto", "Plan familiar listo" |

## E. Proceso
| ID | Decisión | Resolución MVP |
| --- | --- | --- |
| D-35 | Ramas | `main` ← `develop` ← `feat/jd|sa/*`; PR ≤ 400 líneas; CI obligatorio |
| D-36 | Reuniones | Daily de 3 líneas (chat), planeación lunes 30 min, demo cada 2 semanas 45 min |
| D-37 | Congelamiento | Features congeladas al inicio de la **S15**; S15–S16 solo fixes, auditoría y tiendas |
| D-38 | Sin librerías nuevas tras S8 | Dependencias nuevas requieren ADR |

## Consecuencias directas en el plan
- Se **eliminan del MVP**: Wi-Fi Direct/Multipeer (JD-056), dashboard institucional (JD-075), flotante "panel web" de SA, mapa de intensidad, SMS automático, pagos, analítica.
- Se **simplifican**: JD-057 (SMS) pasa a "SMS prellenado"; JD-058 usa GATT; JD-060/064 solo Bogotá; JD-076 queda como stub.
- Se **añade**: spike SQLCipher en S2 (JD), archivo de configuración de sensores (JD), lista firmada de códigos de socorrista (JD, `server/seed/rescuer_codes`).
