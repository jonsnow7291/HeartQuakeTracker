# 08 – Arquitectura y stack tecnológico

## Stack declarado [FUENTE]
| Capa | Tecnología | Rol |
| --- | --- | --- |
| UI y lógica común | **TypeScript sobre React Native** + módulos nativos (puentes) | Misma app en Android e iOS; módulos nativos para BLE, foreground services, bypass de Doze/background iOS |
| Almacenamiento local | **SQL: SQLite + SQLCipher (AES-256)** (y AsyncStorage para progreso, RF-03) | Ficha médica cifrada, progreso, cola de sync |
| Contenido offline | **Markdown** local | Guías de primeros auxilios, mochila, aseguramiento (RF-01) |
| Comunicación proximal | BLE 4.2+ (advertising/scan) y Wi-Fi Direct; malla multihop | Balizas SOS, relé de mensajes, envío de ficha |
| Mapas | Capas vectoriales offline (OpenStreetMap, OpenMapTiles / Protomaps, MBTiles) | RF-10 |
| Backend | APIs de ingesta masiva, **colas asíncronas store-and-forward**, **PostgreSQL**, buckets S3; hosting Supabase / DigitalOcean | Recibir reportes sincronizados, tiles y panel institucional |
| Diseño | Affinity (Designer) | UI/UX, WCAG 2.1 AA |
| Calidad | Pruebas unitarias >80 %, Wireshark + nRF52840 sniffer, device farm 6–8 terminales | RNF, estrés 200 nodos |
| Distribución | Apple Developer Program + Google Play Console; CI/CD | Tiendas |

Nota: la propuesta de idea decía "React Native en JavaScript"; los documentos posteriores fijan **TypeScript** (ver `16`).

## Principios de arquitectura
1. **Offline-first:** ninguna función crítica (pánico, baliza, guías, mapas cacheados) depende de red.
2. **Seguridad por defecto:** cifrado en reposo (SQLCipher/Keystore) y en tránsito; datos sensibles nunca en claro en la malla; IDs efímeros.
3. **Resiliencia en segundo plano:** Android Foreground Service con notificación persistente; iOS: modos de periférico BLE autorizados.
4. **Eficiencia energética:** duty cycle adaptativo; modo "SOS Prolongado" (ráfagas cada 30 s si batería < 20 %).
5. **Estandarización BLE:** ceñirse a especificaciones Bluetooth SIG para interoperar Android/iOS.

## Módulos de la app [INFERIDO a partir de RF]
| Módulo | RF | Notas |
| --- | --- | --- |
| `education` (guías MD, quizzes, logros) | 01, 02, 03 | Contenido versionado local |
| `medical-profile` | 04, 13 | SQLCipher + clave en Keystore/Keychain |
| `panic` (UI de crisis, estado de emergencia) | 05 | Máquina de estados global |
| `signaling` (flash, tono) | 06 | Módulo nativo para linterna/audio |
| `ble-beacon` | 07 | Advertising; módulo nativo |
| `mesh` (scan, relé, dedupe, prioridad) | 08 | Cola prioritaria, TTL, firmas |
| `sensors` (acelerómetro/inclinómetro, detección) | 09 | Procesamiento local, quórum |
| `maps` (tiles offline, POIs, ruta) | 10 | MBTiles |
| `aid-directory` | 11 | Catálogo oficial versionado |
| `sync` (cola, reintentos, idempotencia) | 12 | Listener de red, lotes |
| `shared/security` | transversal | Cifrado, firmas, consentimiento Habeas Data |
| `shared/permissions` | transversal | GPS, Bluetooth, notificaciones, sensores |

## Máquina de estados de emergencia [INFERIDO]
`IDLE → (pánico + gravedad) CONFIRMANDO(3 s cancelable) → ACTIVO → [SOS_PROLONGADO si batería<20 %] → DETENIDO` · `ACTIVO` dispara RF-06/07/08/13/12.

## Modelo de datos local (SQLite/SQLCipher) [INFERIDO]
| Tabla | Campos clave | RF |
| --- | --- | --- |
| `usuario` | id, id_efimero_actual, consentimiento_en | 04 |
| `ficha_medica` (cifrada) | tipo_sangre, alergias, enfermedades, contactos | 04, 13 |
| `evento_emergencia` | id, gravedad, iniciado_en, detenido_en, lat, lon | 05, 07 |
| `mesh_mensaje` | hash, origen_id_efimero, gravedad, lat, lon, ts, hops, firma, visto_en | 08 |
| `lectura_sensor` | id, ts, magnitud, clasificacion, enviada | 09 |
| `sync_queue` | id, tipo, payload, intentos, estado | 12 |
| `poi` | id, tipo(albergue/acopio/bomberos/salud), nombre, lat, lon, activo | 10 |
| `entidad_ayuda` / `canal_ayuda` | ver `06` | 11 |
| `guia`, `quiz_*`, `progreso`, `insignia` | ver `03` | 01–03 |

## Backend [INFERIDO a partir de presupuesto/RF-12]
- Endpoints: ingesta de reportes (batch, idempotente), confirmación colaborativa de sismo, catálogo de POIs/ayudas, descarga de tiles/paquetes de contenido.
- Autenticación para terminales de socorro autorizados (validación de firma/credencial).
- Panel institucional (Defensa Civil): reportes recibidos, zonas afectadas, recursos — alcance a definir (`16`).
- Cumplimiento: Ley 1581 de 2012 (Habeas Data), ISO/IEC 27001:2022 Anexo A (ver `09`).

## Por qué estos lenguajes (documento "Lenguajes que salvan vidas")
- **TypeScript/RN:** una sola base para Android económico e iPhone; tipado evita crashes en pleno sismo.
- **SQL + SQLCipher:** ficha médica accesible en segundos al rescatista pero indescifrable ante robo.
- **Markdown:** guías instantáneas y livianas sin consumir datos.
