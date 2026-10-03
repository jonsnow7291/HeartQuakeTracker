# JD → Santiago: qué le tienes que entregar (con fecha y criterio de aceptación)

Fecha = fin de la semana indicada. "Aceptado" = Santiago confirma en el PR/issue que compila y puede usarlo.

## E1 – Base del repo (Semana 1) ✱ BLOQUEANTE
| Qué | Criterio de aceptación |
| --- | --- |
| Repo `earthquake-tracker` con estructura de `compartido/02`, TypeScript estricto, ESLint, Prettier, CODEOWNERS, `.env.example` | `yarn install && yarn start` levanta app vacía en Android e iOS; `lint` y `typecheck` pasan |
| CI mínima: lint + typecheck + tests + `check-ownership.sh` | Un PR de prueba de SA tocando `src/core` es rechazado automáticamente |
| Regla ESLint `no-restricted-imports`: `src/ui` no importa `src/core`, y viceversa | Test negativo comprobado |
| `src/contracts/` v0.1 completo (ver `compartido/03_contratos_ts.md`) + `VERSION.md` | Compila sin errores; SA firma que cubre sus pantallas |
| `src/core/container.ts` + `useServices` base (el hook lo envuelve SA, JD provee el container) | `getServices()` devuelve mocks con `APP_MODE=mock` |
| Mocks base (sesión, permisos, emergencia, ficha, contenido, progreso, poi, aid, sync, mesh, sensores, alerts, power) | Cada mock cumple la interfaz y lanza `AppError` realistas |
| `content/schema/guide.schema.json`, `quizbank.schema.json`, `manifest.schema.json` + script `validate-content` | `yarn validate-content` valida los ejemplos que escribe SA |

## E2 – Mocks con escenarios (Semana 2)
- `DevScenarioController` (contrato en `contracts/dev.ts`): `list()`, `activate(id)`, `reset()`.
- Escenarios: `sismo_detectado`, `mesh_5_nodos`, `bluetooth_apagado`, `permisos_denegados`, `contenido_corrupto`, `sync_parcial`, `socorrista_recibe_ficha`, `bateria_15`, `sin_sensores`, `sin_mapa_cacheado`, `offline_total`.
- Los mocks emiten eventos con temporización realista (p. ej. `CONFIRMING` dura 3 s; baliza arranca <300 ms).
- **Aceptación:** SA activa cada escenario desde su pantalla de debug y ve el cambio en UI sin tocar nada más.

## E3 – Oleadas de servicios reales
| Oleada | Semana | Servicios | Criterio de aceptación (lo que SA debe poder hacer) |
| --- | --- | --- | --- |
| O1 | 3 | `SessionService`, `PermissionsService` | Crear cuenta local con PIN, bloquear/desbloquear con PIN y biometría; ver estado/solicitar cada permiso en Android 10+/iOS 15+ |
| O2 | 4 | `MedicalProfileService` (SQLCipher) | Guardar/leer/editar/borrar ficha; con sesión bloqueada lanza `AUTH_REQUIRED`; archivo de BD ilegible sin clave |
| O3 | 5 | `ContentService`, `ProgressRepository` | Listar guías y obtener Markdown local en <2 s; detectar `CONTENT_CORRUPT`; guardar/reanudar intentos; reset total |
| O4 | 6 | `EmergencyService`, `PowerService` | Flujo IDLE→CONFIRMING(3 s)→ACTIVE→STOPPED; `cancel()` válido solo en CONFIRMING; permisos faltantes devueltos por `requestPanic()`; `lowPower=true` con batería <20 % |
| O5 | 7 | `SensorService`, `AlertsService` | Alertas `POSSIBLE/CONFIRMED/DISCARDED` simuladas con replay; historial paginado |
| O6 | 8 | `ReportService`, `markSafe`, cola local | "Estoy a salvo" y "Reportar daños" se encolan y quedan en `listOwnReports()` |
| O7 | 9–10 | `MeshService` (estado, nearby, relé) | Con 2+ teléfonos, `listNearby()` muestra el otro con severidad y RSSI; `getStatus()` coherente con el estado real |
| O8 | 10 | `PoiService`, servidor v1 (POIs, ayudas) | `listInBounds`/`nearest` responden offline desde caché; `reportProblem` se encola |
| O9 | 11 | `TileService`, `SyncService`, `AidDirectoryService`, `RescuerService` | Descargar región con progreso; ruta MBTiles local utilizable por MapLibre; `syncNow()` vacía la cola; socorrista recibe ficha de otro dispositivo en <3 s |

Cada oleada incluye: (1) implementación real registrada en container, (2) mock actualizado si el contrato cambió, (3) `docs/jd/servicios/<servicio>.md` con ejemplos y errores, (4) build interno si hay nativo.

## E4 – Builds para pruebas
- Android: APK/AAB interno firmado en cada punto de integración (S4, S8, S12, S16) y cada vez que se entregue algo nativo.
- iOS: build en TestFlight (o ad-hoc) en los mismos puntos.
- Pantallazo de versión y `git sha` dentro de la pantalla de debug.

## E5 – Datos semilla
- `server/seed/pois.json`, `entidades_ayuda.json`, `necesidades.json` (S10) y su carga al servidor.
- Región de tiles inicial (p. ej. Bogotá) empaquetada para pruebas (S9–S10).

## E6 – Documentación mínima para SA
- `docs/jd/servicios/*.md` por servicio.
- `docs/jd/errores.md`: tabla `ErrorCode` → significado → ¿recuperable? → sugerencia de UX.
- `docs/jd/permisos.md`: qué permisos necesita cada función, textos del sistema operativo (Info.plist/AndroidManifest).
- `docs/jd/foreground_notification.md`: textos/icono requeridos (SA los provee).

## Lo que JD NO debe hacer (para no pisarse)
- No editar nada en `src/ui`, `content`, `assets`.
- No decidir textos visibles ni layouts.
- No cambiar contratos sin CCR aprobado.
- No agregar dependencias de UI (mapas visuales, animaciones, iconos): las propone SA.
