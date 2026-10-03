# Santiago – Pantallas, componentes y qué contrato usa cada una

Pestañas globales: **Inicio · Mapa · Alertas · Perfil**. Tema claro/oscuro. Cabecera con indicador de conexión/sync.

## Mapa de pantallas
| Pantalla | Ruta | Servicios (`useServices`) | RF | Estados a cubrir |
| --- | --- | --- | --- | --- |
| Splash | `/splash` | `session.hasAccount` | — | carga |
| Onboarding / consentimiento | `/onboarding` | `session.createLocalAccount` | RF-04 | validación, términos no aceptados |
| Desbloqueo | `/unlock` | `session.unlock`, biometría | RF-04 | error PIN, bloqueo |
| Permisos | `/permissions` | `permissions.status/request/openSettings` | RF-05 | denegado, bloqueado |
| Inicio | `/home` | `emergency.subscribe`, `sync.subscribe` | — | emergencia activa (banner) |
| Prevención | `/prevention` | — | RF-01,02,03,10 | — |
| Lista de guías | `/guides` | `content.listGuides` | RF-01 | vacío, corrupto |
| Lector de guía | `/guides/:id` | `content.getGuideMarkdown`, `checkUpdates` | RF-01 | corrupto, actualizada |
| Quiz niveles | `/quiz` | `content.getQuizBank`, `progress.getLevelStatus` | RF-02 | bloqueado |
| Quiz pregunta | `/quiz/:level` | `progress.saveAttempt/getPartial` | RF-02 | abandono, reanudar |
| Logros | `/achievements` | `progress.listBadges` | RF-03 | vacío |
| Plan familiar / Kit / Simulacros | `/plan`, `/kit`, `/drills` | `alerts.scheduleDrill` | RF-01 | — |
| Ficha médica | `/medical` | `medical.get/save` | RF-04 | vacío, edición, AUTH_REQUIRED |
| **Pánico** (overlay) | `/panic` | `emergency.requestPanic/selectSeverity/cancel` | RF-05 | cancelación 3 s, permisos faltantes |
| **Emergencia activa** | `/emergency` | `emergency`, `mesh`, `power` | RF-05/06/07/08 | lowPower, BT off |
| Durante | `/during` | `emergency`, `sensors`, `mesh` | RF-05,07,08,09 | — |
| Después | `/after` | `emergency.markSafe`, `reports` | RF-10,11,12 | — |
| Reportar daños / Pedir ayuda | `/report`, `/aid-request` | `reports` | RF-12 | pendiente de sync |
| Mapa | `/map` | `poi`, `tiles`, `emergency` | RF-10 | sin mapa cacheado |
| Regiones de mapa | `/map/regions` | `tiles` | RF-10 | descarga, error |
| Alertas | `/alerts` | `alerts`, `sensors` | RF-09 | sin sensores |
| Ayuda y Donaciones | `/aid` | `aid.listEntities/listNeeds` | RF-11 | canal inactivo |
| Perfil | `/profile` | `session`, `medical` | RF-04 | — |
| Sync | `/sync` | `sync` | RF-12 | parcial, error |
| Modo socorrista | `/rescuer` | `rescuer` | RF-13 | no autorizado, ficha incompleta |
| DevScenarios (solo debug) | `/dev` | `DevScenarioController` | — | — |

## Componentes del design system
`PanicButton` (grande, alto contraste, haptics) · `SeveritySelector` · `Countdown` · `StatusPill` (offline/online/sync/baliza/batería) · `Banner` (info/alerta/error) · `Card` · `ListItem` · `Badge` · `Chip` · `Modal`/`Sheet` · `Toast` · `Input`/`PinInput` · `Select` · `Checklist` · `ProgressBar` · `EmptyState` · `ErrorState` (mapea `ErrorCode` → texto + acción) · `MapView` (MapLibre) · `PoiMarker` · `PoiSheet` · `NodeListItem` · `MarkdownView`.

## Reglas de UX críticas
1. **Pánico:** desde Inicio, 1 toque abre selector y 2.º toque confirma gravedad (total ≤ 2). Cancelación visible 3 s.
2. **Sin bloqueo por red:** cualquier pantalla debe mostrar contenido local aunque `sync.online=false`.
3. **Accesibilidad:** contraste AA, objetivos ≥ 48 dp, etiquetas para lectores de pantalla, orden de foco lógico, no depender solo de color.
4. **Rendimiento:** respuesta de pulsación <300 ms en pánico; guías y mapa <2 s con datos locales.
5. **Sin datos inventados:** todo dato visible proviene de un contrato; si falta, CCR.

## Signaling (RF-06) – comportamiento
- `phase === 'ACTIVE'` → linterna en patrón estroboscópico (p. ej. 4 Hz) + tono continuo (p. ej. 3 kHz) a volumen alto.
- `lowPower === true` → pulsos espaciados y/o tono intermitente para ahorrar batería.
- `phase` ≠ ACTIVE → apagar todo y liberar linterna/audio.
- Sin flash → solo tono (A1). Silenciado → `Banner` pidiendo subir volumen (A2).
- Debe activarse en <300 ms tras `ACTIVE`.

## Mapa (RF-10) – comportamiento
- Fuente de tiles: `tiles.getLocalTilesPath(regionId)`; si `null` → `EmptyState` "sin mapa" + CTA descargar (`/map/regions`).
- POIs: `poi.listInBounds` (offline). "Puntos cercanos": `poi.nearest`.
- "Cómo llegar": ruta estimada (línea directa/ruteo básico) y tiempo aproximado, sin conexión.
- Reportar problema de punto: `poi.reportProblem`.
