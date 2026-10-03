# Santiago – Tareas detalladas (por épica)

Estimaciones en días-persona (dp). **[S#]** = semana objetivo.

## SA-E0 Fundaciones de diseño y UI [S1–S2]
- [ ] **SA-001** Tokens de diseño (color, tipografía, espaciado, elevación, motion) claro/oscuro, contraste AA (1.5 dp) [S1]
- [ ] **SA-002** Árbol de navegación (React Navigation: tab bar Inicio/Mapa/Alertas/Perfil + stacks de Prevención/Durante/Después) (1 dp) [S1]
- [ ] **SA-003** Catálogo de pantallas con estados y datos requeridos (1.5 dp) [S1–S2]
- [ ] **SA-004** `src/ui/hooks/useServices`, `useSubscribe` (envoltura de `subscribe`) y `ErrorBoundary` global (1 dp) [S2]
- [ ] **SA-005** Design system: Button, PanicButton, Card, ListItem, Badge, Banner, Chip, Modal, Toast, Switch, Input, Select, Stepper, ProgressBar, EmptyState (3 dp) [S2]
- [ ] **SA-006** i18n es-CO + tabla de strings (0.5 dp) [S2]
- [ ] **SA-007** Splash + Inicio con 3 accesos (1 dp) [S2]
- [ ] **SA-008** Pantalla `DevScenarios` (1 dp) [S2]
- [ ] **SA-009** `config/modes.ts` (mock/real por servicio) (0.5 dp) [S2]

## SA-E1 Onboarding, cuenta y permisos [S3] (RF-04, RF-05)
- [ ] **SA-010** Flujo de bienvenida + consentimiento Habeas Data + términos (1.5 dp)
- [ ] **SA-011** Crear cuenta local (nombre/PIN/biometría) y pantalla de desbloqueo (1.5 dp)
- [ ] **SA-012** Pantallas explicativas de permisos (ubicación, Bluetooth, notificaciones, sensores) con CTA a `openSettings` (1.5 dp)
- [ ] **SA-013** Texto de permisos/notificación para nativo (`design/permissions_copy.md`) (0.5 dp)

## SA-E2 Maquetas y H1 [S3–S4]
- [ ] **SA-020** Maquetas en Affinity de las 9 pantallas + implícitas; modo nocturno (3 dp)
- [ ] **SA-021** Prototipo navegable (1.5 dp)
- [ ] **SA-022** Tabla `ErrorCode → texto` (0.5 dp)
- [ ] **SA-023** Casos de aceptación UI por RF (1 dp)

## SA-E3 Educación y contenido [S5–S8] (RF-01, 02, 03)
- [ ] **SA-030** Lista de guías (RF-01) con categorías, tiempo de lectura (1 dp) [S5]
- [ ] **SA-031** Lector Markdown (renderer ligero, imágenes locales, enlaces internos entre guías) (2 dp) [S5]
- [ ] **SA-032** Estados A1/A2: contenido corrupto, actualización en segundo plano (banner "contenido actualizado") (1 dp) [S5]
- [ ] **SA-033** Redacción de guías: mochila, aseguramiento estructural, plan familiar (3 primeras) (3 dp) [S5]
- [ ] **SA-034** Motor de quiz (`src/ui/features/quiz/engine`): niveles, puntaje, feedback, bloqueo/desbloqueo (pure TS, sin persistencia) (2 dp) [S6]
- [ ] **SA-035** UI de quiz: selección de nivel, pregunta, feedback <1 s, resultado, sugerir repaso de guía (3 dp) [S6]
- [ ] **SA-036** Reanudar quiz parcial (usa `ProgressRepository`) (1 dp) [S6]
- [ ] **SA-037** Pantalla de logros e insignias (1.5 dp) [S7]
- [ ] **SA-038** Simulacros y plan familiar interactivo (checklist) y kit de emergencia (checklist) (3 dp) [S7–S8]
- [ ] **SA-039** Redacción de guías 4–8 (primeros auxilios, qué hacer durante/después, zonas seguras…) (4 dp) [S7–S8]
- [ ] **SA-040** Banco de preguntas ≥60 con `protocolRef` (4 dp) [S6–S8]

## SA-E4 Ficha médica y perfil [S5] (RF-04)
- [ ] **SA-050** Formulario de ficha (tipo de sangre, alergias, enfermedades, medicación, contactos) con validación y estados A1/A2 (2 dp)
- [ ] **SA-051** Pantalla "Mi perfil": contactos con llamada directa, configuración, términos, acerca de (1.5 dp)
- [ ] **SA-052** Gestión de bloqueo/desbloqueo y cierre de sesión (0.5 dp)

## SA-E5 Pánico y modo emergencia [S6–S8] (RF-05, RF-06, RF-13 UI)
- [ ] **SA-060** Botón de pánico persistente (accesible desde pantalla principal) + selector de gravedad con 3 opciones grandes (2 dp)
- [ ] **SA-061** Cuenta regresiva de cancelación 3 s (usa `cancelDeadline`) (0.5 dp)
- [ ] **SA-062** Manejo de permisos faltantes (usa `missing` de `requestPanic`) con flujo guiado (1 dp)
- [ ] **SA-063** Pantalla de **modo emergencia activo**: estado de baliza/malla/flash/ficha, nodos cercanos, batería, botón detener (con confirmación), "SOS prolongado" (2 dp)
- [ ] **SA-064** **`SignalingController` (RF-06)**: linterna estroboscópica + tono continuo de alta frecuencia; suscripción a `EmergencyService`; modo bajo consumo con pulsos espaciados; fallback sin flash (3 dp) — *usa librerías RN de linterna/audio; permisos de cámara/flash coordinados con JD*
- [ ] **SA-065** Alerta visual si volumen silenciado (1 dp)
- [ ] **SA-066** Pantalla "Durante": Agáchate/Cúbrete/Agárrate, estado de conexión, "Estoy a salvo"/"Necesito ayuda" (1.5 dp)
- [ ] **SA-067** Pantalla "Después": acciones y navegación a Reportar daños/Ayudas/Donaciones/Puntos (1 dp)
- [ ] **SA-068** Formularios "Reportar daños" y "Solicitar ayuda" (usa `ReportService`) (2 dp) [S8]

## SA-E6 Alertas y sensores [S7] (RF-09)
- [ ] **SA-070** Pantalla Alertas (alerta activa + historial con filtros) (2 dp)
- [ ] **SA-071** Banner global "Posible sismo detectado" con acciones rápidas (1.5 dp)
- [ ] **SA-072** Mensaje cuando no hay sensores (A2) y activación/desactivación (0.5 dp)

## SA-E7 Mesh y socorrista UI [S9–S11] (RF-07, 08, 13)
- [ ] **SA-080** Indicador de estado de malla y baliza en "Durante" (1 dp)
- [ ] **SA-081** Lista de nodos cercanos por gravedad y distancia (1.5 dp)
- [ ] **SA-082** Modo socorrista: habilitación con código, lista de fichas recibidas, vista de ficha (alerta si incompleta/firma inválida) (3 dp) [S11]

## SA-E8 Mapa y ayudas [S9–S11] (RF-10, RF-11)
- [ ] **SA-090** **Spike MapLibre offline** con MBTiles locales (iOS+Android) (2 dp) — **mover a S6–S7** para tener go/no-go temprano; fallback: lista de POIs con distancia/brújula (D-09)
- [ ] **SA-091** Pantalla Mapa: capas por tipo de POI, filtros, ubicación actual, detalle del punto (4 dp) [S10]
- [ ] **SA-092** Panel "Puntos cercanos" (contadores) + "Cómo llegar" con ruta estimada (línea/ruteo básico) (2 dp) [S10]
- [ ] **SA-093** Reportar punto no disponible (A2) (0.5 dp)
- [ ] **SA-094** Descarga de regiones (lista, progreso, borrar, estado "sin mapa cacheado") (2 dp) [S11]
- [ ] **SA-095** Pantalla Ayuda y Donaciones: entidades/canales, necesidades actuales, botón "Hacer donación" → canal oficial, canales inactivos ocultos/marcados (2.5 dp) [S11]
- [ ] **SA-096** Redirección a puntos de socorro desde ayuda inmediata (A2 RF-11) (0.5 dp)

## SA-E9 Sync UI [S11] (RF-12)
- [ ] **SA-100** Indicador global de conexión/pendientes en cabecera + pantalla de estado de sincronización (1.5 dp)
- [ ] **SA-101** Botón "Sincronizar ahora" y errores parciales (1 dp)

## SA-E10 Calidad, accesibilidad, cierre [S12–S16]
- [ ] **SA-110** Integración a `real` servicio por servicio y corrección de diferencias (continuo)
- [ ] **SA-111** Accesibilidad: TalkBack/VoiceOver, contraste AA, tamaños táctiles, orden de foco, `accessibilityLabel` (3 dp) [S14]
- [ ] **SA-112** Pruebas unitarias UI y e2e (Detox/Maestro) de flujos críticos (pánico, ficha, quiz, mapa offline) (5 dp) [S12–S14]
- [ ] **SA-113** Pruebas de usabilidad con usuarios (5–8) + informe (3 dp) [S12–S13]
- [ ] **SA-114** **Encuesta final**: diseño, aplicación y análisis (4 dp) [S13–S15]
- [ ] **SA-115** Rendimiento: tiempos <300 ms en pánico, <2 s guías/mapa, listas virtualizadas (2 dp) [S14]
- [ ] **SA-116** Manual de usuario y textos de tienda; capturas (3 dp) [S15–S16]
- [ ] **SA-117** Presentación final y anexo de resultados (2 dp) [S16]

## Flotantes de SA (si le sobra tiempo o JD está saturado; **requieren acuerdo y no tocan carpetas de JD**)
- ~~Wi-Fi Direct/Multipeer~~ y ~~panel institucional web~~: **fuera del MVP** (D-08, D-10).
- **SMS prellenado** cuando JD emita el evento "sin puente 2 min" (D-25): botón en pantalla de emergencia (0.5 dp).
- **Simulacros guiados con audio** y gamificación adicional (insignias).
- **Widgets/atajos** (acceso rápido al pánico) — solo si JD habilita el módulo nativo.

## Tareas que NO son de SA
Cifrado, BD, BLE, malla, sensores, sincronización, servidor, builds de producción, pentest.
