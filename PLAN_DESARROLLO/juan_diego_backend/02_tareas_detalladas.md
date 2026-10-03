# JD – Tareas detalladas (por épica)

Estimaciones en días-persona (dp). Etiquetas: **[S#]** semana objetivo · RF/RNF cubiertos · Dep = dependencia.

## JD-E0 Fundaciones [S1–S2]
- [ ] **JD-001** Crear repo, estructura, TS estricto, ESLint (fronteras), Prettier, Husky, CODEOWNERS, `check-ownership.sh` (1.5 dp) [S1]
- [ ] **JD-002** CI GitHub Actions: lint, typecheck, tests, build Android/iOS debug (1.5 dp) [S1]
- [ ] **JD-003** `src/contracts/*` v0.1 según `compartido/03` + `VERSION.md` + proceso CCR (1.5 dp) [S1]
- [ ] **JD-004** `container.ts`, `APP_MODE` (mock/real por servicio), registro de servicios (1 dp) [S1]
- [ ] **JD-005** Mocks base de todos los servicios (2 dp) [S1–S2]
- [ ] **JD-006** `DevScenarioController` y 11 escenarios (1.5 dp) [S2]
- [ ] **JD-007** Esquemas JSON de contenido + `validate-content` (1 dp) [S1]
- [ ] **JD-008** ADRs de decisiones D-01, D-10, D-11, D-16, D-17, D-18 (1 dp) [S1]
- [ ] **JD-009** docker-compose (PostgreSQL, API, cola) + `.env.example` (1 dp) [S2]

## JD-E1 Sesión, permisos, almacenamiento seguro [S3–S4] (RF-04, RNF-04)
- [ ] **JD-010** SQLCipher (op-sqlite) integrado — **spike go/no-go en S2** (D-11) (Android+iOS), migraciones, `Database` wrapper (2 dp) [S2–S3]
- [ ] **JD-011** Gestión de claves: clave maestra en Keystore/Keychain, derivación PIN (Argon2/PBKDF2), biometría (2 dp) [S3]
- [ ] **JD-012** `SessionService` (cuenta local, PIN, biometría, bloqueo automático) (1.5 dp) [S3]
- [ ] **JD-013** `PermissionsService` (Android 10–15, iOS 15+; background location, BLE scan/advertise, notifs) (1.5 dp) [S3]
- [ ] **JD-014** `MedicalProfileService` (CRUD cifrado, validación de campos obligatorios, un solo registro) (2 dp) [S4]
- [ ] **JD-015** Pruebas de seguridad: inspección de BD, clave incorrecta, desbloqueo (1 dp) [S4]
- [ ] **JD-016** **Spike BLE background Android+iOS** (advertising y scan con pantalla bloqueada): informe go/no-go (3 dp) [S4]
- [ ] **JD-017** Dossier de arquitectura H1 (1.5 dp) [S4]

## JD-E2 Contenido y progreso [S5] (RF-01, RF-03)
- [ ] **JD-020** `ContentService`: paquete versionado (`manifest.json` + hash SHA-256 por archivo), carga local, error `CONTENT_CORRUPT/MISSING` (2 dp)
- [ ] **JD-021** Actualización en segundo plano al haber red (descarga atómica, rollback) (1.5 dp)
- [ ] **JD-022** `ProgressRepository` (intentos parciales, niveles desbloqueados, insignias, reset) (1.5 dp)
- [ ] **JD-023** Endpoint `GET /v1/content/manifest` y bucket de paquetes (1 dp)

## JD-E3 Emergencia [S6] (RF-05, RF-12 parcial, RNF-02)
- [ ] **JD-030** `EmergencyService`: máquina de estados, 3 s cancelable, orquestación de módulos, persistencia de `evento_emergencia` (3 dp)
- [ ] **JD-031** `PowerService` + modo SOS Prolongado (<20 %) que cambia duty cycle (1.5 dp)
- [ ] **JD-032** Foreground Service Android + notificación persistente; modos BLE periférico iOS (3 dp) [S6–S7]
- [ ] **JD-033** Posición: obtención GPS, última posición conocida con timestamp (1.5 dp)
- [ ] **JD-034** `markSafe()`/`ReportService` v1 con cola local (2 dp) [S8]

## JD-E4 Sensores y alertas [S7] (RF-09)
- [ ] **JD-040** Lectura acelerómetro/giroscopio (frecuencia configurable), buffer circular (1.5 dp)
- [ ] **JD-041** Detector (RMS/STA-LTA + filtro), umbrales configurables, descarte de ruido <500 ms (3 dp)
- [ ] **JD-042** Quórum local con ≥3 nodos vía malla en ventana de tiempo (2 dp) [S10]
- [ ] **JD-043** `AlertsService` + historial local + simulacros (1.5 dp)
- [ ] **JD-044** Dataset de pruebas (caída, caminata, sismo simulado) y replay para tests (1.5 dp)

## JD-E5 BLE y malla [S9–S12] (RF-07, RF-08, RF-13, RNF-02, RNF-06)
- [ ] **JD-050** Protocolo de paquete BLE + versión + codificador/decodificador (ver `04`) (2 dp) [S8–S9]
- [ ] **JD-051** Módulo nativo **advertising** Android (BLE 5 extended si disponible, fallback legacy) (3 dp)
- [ ] **JD-052** Módulo nativo **advertising** iOS (CoreBluetooth; estrategias para background) (4 dp)
- [ ] **JD-053** Escáner continuo + parser + `NearbyNode` + estado `MeshStatus` (3 dp)
- [ ] **JD-054** Relé multihop: dedupe (hash+TTL cache), TTL/hops, backoff aleatorio, prioridad por gravedad, cola acotada (4 dp)
- [ ] **JD-055** Firmas (Ed25519) + ID efímero + verificación entre pares (3 dp)
- [ ] ~~**JD-056** Wi-Fi Direct / Multipeer~~ → **FUERA DEL MVP (D-10)**. Sustituido por canal GATT sobre BLE dentro de JD-058
- [ ] **JD-057** Detección "2 min sin nodos puente" y evento para que SA ofrezca SMS prellenado (D-25) (1 dp)
- [ ] **JD-058** `RescuerService`: habilitación con código, canal de recepción, compresión + cifrado de ficha, validación de firma, envío <3 s (4 dp)
- [ ] **JD-059** Instrumentación y métricas (RSSI, latencia por salto, entrega, batería) (2 dp)

## JD-E6 Mapas y datos [S10–S11] (RF-10, RF-11)
- [ ] **JD-060** Pipeline de tiles: extracción OSM → MBTiles por región (OpenMapTiles/Protomaps), versionado y firma (3 dp)
- [ ] **JD-061** `TileService` (listar, descargar con progreso/resume, verificar hash, borrar) (2 dp)
- [ ] **JD-062** `PoiService` (SQLite local con índice espacial simple; sincronización desde servidor; `reportProblem` en cola) (2.5 dp)
- [ ] **JD-063** `AidDirectoryService` (catálogo local + actualización) (1 dp)
- [ ] **JD-064** Semillas de datos reales (POIs de Bogotá primero; ampliar) (2 dp)

## JD-E7 Sincronización y servidor [S8–S12] (RF-12)
- [ ] **JD-070** Servidor base: Node+TS, PostgreSQL, migraciones, auth de dispositivo (clave pública), rate limit (3 dp) [S2–S3 esqueleto]
- [ ] **JD-071** `POST /v1/sync/batch` idempotente con ACK por ítem (2 dp)
- [ ] **JD-072** Cola asíncrona de procesamiento + tablas de reportes/lecturas (2 dp)
- [ ] **JD-073** `SyncService` cliente: `sync_queue`, backoff exponencial, reintentos, vaciado ≤2 min (3 dp)
- [ ] **JD-074** Endpoints de catálogos (POIs, ayudas, tiles, contenido) (2 dp)
- [ ] ~~**JD-075** Dashboard institucional~~ → **FUERA DEL MVP (D-08)**; solo consultas SQL/CSV de reportes para la demo (0.5 dp)
- [ ] **JD-076** Integración con APIs institucionales (stub configurable) (1.5 dp)
- [ ] **JD-077** Despliegue staging + monitoreo + backups (2 dp)

## JD-E8 Calidad y cierre [S13–S16]
- [ ] **JD-080** Cobertura unitaria >80 % en `core` y `server` (continuo)
- [ ] **JD-081** Banco de 200 nodos (simulador + hardware nRF52840 + Wireshark) y reporte (5 dp) [S13]
- [ ] **JD-082** Optimización de batería (≤8 %/h) con perfiles (3 dp) [S14]
- [ ] **JD-083** Auditoría de seguridad y correcciones (pentest SQLCipher, spoofing) (4 dp) [S15]
- [ ] **JD-084** Asesoría Habeas Data aplicada (políticas, retención, borrado) (1.5 dp) [S15]
- [ ] **JD-085** Builds de producción, firma, subida a App Store/Google Play (3 dp) [S16]
- [ ] **JD-086** Manual técnico/API y de despliegue (2 dp)

## Flotantes de JD (puede tomar si le sobra tiempo; NO tocan carpeta de SA)
- Archivo de configuración de sensores calibrable (`core/sensors/config.ts`) y lista firmada de códigos de socorrista (`server/seed/rescuer_codes`) — ahora **obligatorios** (D-18, D-06).
- Exportes CSV de reportes.
- Telemetría anónima de calidad (opt-in).
- Scripts de generación de datos de prueba para estrés.

## Tareas que NO son de JD (aclarar)
Pantallas, contenido, iconos, textos, flash/tono, render del mapa, motor de quiz, usabilidad/encuesta.
