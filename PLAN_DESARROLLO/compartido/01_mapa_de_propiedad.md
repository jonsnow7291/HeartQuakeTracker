# 01 – Mapa de propiedad (quién es dueño de qué)

**JD** = Juan Diego (backend/core/servidor) · **SA** = Santiago (frontend/UI/contenido).

## 1. Por requisito: cada RF se parte en dos mitades sin solaparse
| RF | Mitad lógica / datos (dueño) | Mitad visible (dueño) | Punto de contacto (contrato) |
| --- | --- | --- | --- |
| RF-01 Guías offline | **JD:** `ContentService` (paquete versionado, verificación de hash, actualización en segundo plano) | **SA:** lector Markdown, lista de guías, estados de error; **redacta los `.md`** | `ContentService` |
| RF-02 Quizzes | **SA:** motor de quiz (niveles, puntuación, feedback) en `src/ui/features/quiz/engine` + banco de preguntas JSON | **SA:** pantallas de quiz | `ProgressRepository` (guardar intentos) |
| RF-03 Logros | **JD:** `ProgressRepository` (SQLite: puntaje, nivel, insignias) | **SA:** pantalla de logros/insignias | `ProgressRepository` |
| RF-04 Ficha médica | **JD:** `MedicalProfileService` (SQLCipher, AES-256, Keystore/Keychain, sesión) | **SA:** formulario, consentimiento, perfil, contactos | `MedicalProfileService`, `SessionService` |
| RF-05 Pánico | **JD:** `EmergencyService` (máquina de estados, cancelación 3 s, permisos requeridos, orquesta módulos) | **SA:** botón de pánico, selector de gravedad, pantalla de modo activo | `EmergencyService` |
| RF-06 Flash + sonido | — | **SA (completo):** `SignalingController` que se suscribe al estado de `EmergencyService` y maneja linterna/tono | `EmergencyService.subscribe` (solo lectura) |
| RF-07 Baliza BLE | **JD (completo):** módulo nativo + `BeaconService` | **SA:** indicador de estado de baliza en pantalla "Durante" | `MeshService.getStatus` |
| RF-08 Malla P2P | **JD (completo):** escaneo, relé, dedupe, prioridad, firmas | **SA:** lista de nodos cercanos / estado de malla (solo mostrar) | `MeshService` |
| RF-09 Sensores | **JD (completo):** lectura, detección, quórum | **SA:** pantalla Alertas e historial, banner de "posible sismo" | `SensorService`, `AlertsService` |
| RF-10 Mapa socorro | **JD:** `PoiService` (datos POI, reporte de punto), `TileService` (paquetes MBTiles, descarga, verificación), pipeline de generación de tiles en servidor | **SA:** render del mapa (MapLibre), capas, "Puntos cercanos", ruta estimada, "Cómo llegar" | `PoiService`, `TileService` |
| RF-11 Ayudas/donaciones | **JD:** `AidDirectoryService` (catálogo + endpoint) | **SA:** pantalla Ayuda y Donaciones | `AidDirectoryService` |
| RF-12 Store-and-forward | **JD (completo):** cola, reintentos, idempotencia, API de ingesta | **SA:** indicador "pendiente de sincronizar", botón "Sincronizar ahora" | `SyncService` |
| RF-13 Ficha a socorristas | **JD (completo):** compresión, cifrado, transmisión, validación de receptor | **SA:** modo socorrista (pantalla de recepción) + aviso "ficha enviada" | `RescuerService`, `EmergencyService` |
| RNF-03 Accesibilidad | verificación de latencia | **SA (dueño):** WCAG AA, alto contraste, ≤2 toques | — |
| RNF-01/02 Offline/batería | **JD (dueño):** perfiles de energía, foreground service | SA: no bloquear UI sin red | `PowerService` |
| RNF-04 Cifrado | **JD (dueño)** | — | — |
| RNF-07 Compatibilidad | JD (nativo) | SA (UI) — ambos prueban en device farm | — |

## 2. Por carpeta del repo (nadie edita la carpeta del otro)
| Ruta | Dueño | El otro puede… |
| --- | --- | --- |
| `src/contracts/` | **JD** (cambios con visto bueno de SA) | leer / proponer vía PR de revisión |
| `src/core/**` (servicios, mocks, DI container) | **JD** | solo importar vía `useService()` |
| `android/**`, `ios/**` (módulos nativos) | **JD** | SA pide cambios nativos por issue (p. ej. linterna) |
| `server/**` (API, BD, colas, tiles) | **JD** | SA consume por contratos |
| `src/ui/**` (screens, components, navigation, theme, hooks) | **SA** | JD no edita |
| `content/**` (guías `.md`, banco de preguntas `.json`, textos legales) | **SA** (con revisión de contenido) | JD solo valida esquema |
| `assets/**` (iconos, ilustraciones, fuentes, sonidos) | **SA** | — |
| `design/**` (tokens, Affinity exports, specs) | **SA** | JD lee |
| `__tests__/ui/**`, `e2e/**` | **SA** | — |
| `__tests__/core/**`, `server/tests/**` | **JD** | — |
| `package.json`, lockfile, `babel/metro/tsconfig` | **JD** (config raíz) | SA propone dependencias de UI por PR pequeño y avisa |
| `.github/workflows/**` | JD (pipelines servidor y build nativo) / SA (pipeline de tests UI) en archivos distintos | — |
| `docs/` | compartido | cada uno su subcarpeta |

## 3. Piezas que parecen compartidas y quién las toma (para evitar duplicados)
| Pieza | Dueño | Razón |
| --- | --- | --- |
| Enum `Severity`, tipos base | JD (en contracts) | tipo = contrato |
| Textos (strings) de la UI y i18n | SA | UI |
| Mensajes de error técnicos (códigos) | JD | SA los traduce a texto |
| Permisos: lógica de pedir/estado | JD (`PermissionsService`) | SA muestra pantallas explicativas |
| Notificación persistente del foreground service | JD (nativo) | SA suministra textos/icono por contrato `ForegroundNotificationSpec` |
| Iconos y sonido del tono SOS | SA | assets |
| Datos de POIs y entidades iniciales (seed) | JD (script de seed en server) | SA no cura datos |
| Guías y preguntas (texto) | SA | contenido |
| Panel institucional web | **JD** (fase opcional, ver backlog) | fuera del app |
| Pruebas de estrés 200 nodos | JD (diseña/ejecuta) con apoyo de SA como segunda persona de campo | tecnología de red |
| Pruebas de usabilidad + encuesta | **SA** (dueño), JD colabora en analizar | UX |
| Documentación de usuario | SA | — |
| Documentación técnica, dossier de arquitectura | JD | — |
| Presentación / entregables académicos | Repartido en `04` | — |

## 4. Matriz de carga (semanas-persona aprox.)
| Bloque | JD | SA |
| --- | --- | --- |
| Fundaciones y arquitectura | 3 | 3 |
| Servicios y datos locales | 4 | — |
| UI de crisis y flujo emergencia | 1 | 3 |
| Educación (contenido+UI+quiz) | 1 | 5 |
| BLE + malla + cripto | 6 | — |
| Sensores | 2 | 1 (pantallas) |
| Mapas y ayudas | 2 | 3 |
| Sync + servidor | 4 | 1 (indicadores) |
| Calidad / pruebas / cierre | 3 | 3 |
> JD carga más técnica de riesgo; SA carga más volumen de pantallas y contenido. Si JD se ve saturado en Semana 9–12, SA absorbe **Wi-Fi Direct como canal complementario**, **panel institucional web básico** o **pruebas de campo** (ya previstos como "tareas flotantes" en `santiago_frontend/02_tareas_detalladas.md`).
