# 04 – Puntos de integración (donde las dos mitades se juntan)

Reunión corta de 30 min al **inicio de cada semana** y **demo de 45 min** cada integración. Todos los días: mensaje de 3 líneas (hice / haré / bloqueo).

## Cuadro de entregas cruzadas por semana
`JD → SA` = lo que Juan Diego entrega a Santiago. `SA → JD` = lo que Santiago entrega a Juan Diego. "Fecha límite" = fin de esa semana, salvo que se diga otra cosa.

| Sem. | JD → SA | SA → JD |
| --- | --- | --- |
| 1 | **Contratos v0.1 + container + mocks base + DevScenarioController**; reglas ESLint de imports; esquema JSON de `content/` (guías y quiz); repo base con CI | Design tokens (colores/tipografía/espaciados) v0.1, árbol de navegación acordado, lista de pantallas con estados; borrador de microcopy de errores |
| 2 | Mocks completos con escenarios (todos los servicios); `useServices` documentado; `.env.example` | Componentes base: Button, PanicButton, Card, Badge, Banner, Chip; theme claro/oscuro; navegación con tab bar; Splash/Inicio con mocks |
| 3 | `SessionService`, `PermissionsService` reales (v1) | Pantallas onboarding: consentimiento Habeas Data, creación de cuenta local/PIN, pantallas explicativas de permisos |
| 4 | **H1:** `MedicalProfileService` + SQLCipher reales; dossier de arquitectura | **H1:** maquetas funcionales exportadas (Figma/Affinity) + prototipo navegable con mocks; guías de estilo; lista de strings |
| 5 | `ContentService` real (paquete + hash), `ProgressRepository` real | Lector Markdown + lista de guías; formulario ficha médica; primeras 3 guías `.md` |
| 6 | `EmergencyService` real (máquina de estados) + `PowerService` | Pantalla pánico+gravedad+cancelación 3 s; modo activo; `SignalingController` (flash/tono); quiz motor+UI |
| 7 | `SensorService` v1 + `AlertsService` | Pantallas Alertas/Historial; banner posible sismo; pantalla Logros |
| 8 | **H2:** BD cifrada estable, `ReportService` v1, `markSafe`; build interno firmado | **H2:** módulos preventivos completos en UI, UI de crisis integrada, 8 guías, banco de preguntas ≥ 60 |
| 9 | Módulo nativo BLE advertising + `MeshService` v0 (estado, nearby) | Indicadores mesh en "Durante"; lista nodos cercanos; spike de MapLibre offline |
| 10 | `MeshService` v1 (relé, dedupe, prioridad) + `PoiService` + servidor v1 | Pantalla Mapa con POIs, "Puntos cercanos", "Cómo llegar" (sobre mocks) |
| 11 | `TileService` real + `SyncService` + ingesta en servidor; `RescuerService` v1 | Descarga de regiones (UI), Ayuda y Donaciones, indicadores sync, modo socorrista UI |
| 12 | **H3:** malla Android↔iOS operativa, store-and-forward en pruebas | **H3:** app completa en MOCK→REAL para todas las pantallas; reporte de usabilidad v1 |
| 13 | Banco de pruebas 200 nodos; hardening seguridad | Encuesta final aplicada; pruebas de usabilidad; fixes UI |
| 14 | Correcciones tras pruebas de estrés; optimización batería | Accesibilidad AA corregida; pruebas e2e estables |
| 15 | Pentest/auditoría + fixes; asesoría Habeas Data aplicada | Manual de usuario, textos legales finales, capturas para tiendas |
| 16 | **H4:** build de producción, binarios a tiendas | **H4:** metadata de tiendas, anexo de resultados, presentación |

## Definición de "integrado" (al final de cada punto)
- `develop` compila Android e iOS; CI verde.
- La UI corre en `APP_MODE=real` para los servicios entregados esa semana (sin mocks) y el escenario completo pasa en dispositivo físico.
- Lista de issues de integración triada: bloqueantes se resuelven en la misma semana.
- Demo grabada (1–2 min) enlazada en el PR de `develop → main` (solo en hitos).

## Checklist de integración (cada punto)
1. JD publica release de contratos (`VERSION.md`) y notas de cambios.
2. SA cambia `APP_MODE` por servicio: `real` para los entregados (`config/modes.ts`, archivo de SA).
3. Ejecutar escenarios de `DevScenarios` contra servicio real y comprobar mismos resultados que el mock.
4. Pruebas manuales por RF entregado (lista en `13_pruebas_y_aceptacion.md` de la base).
5. Registrar discrepancias contrato vs. realidad → CCR.

## Pruebas de campo conjuntas (los dos, juntos y presenciales)
| Semana | Prueba |
| --- | --- |
| 8 | Ficha cifrada + pánico en 2 dispositivos |
| 10 | Baliza y escaneo entre 2–4 teléfonos |
| 12 | Malla Android↔iOS, 5+ teléfonos, apps en segundo plano y pantalla bloqueada |
| 13–14 | Estrés (simulación 200 nodos) + batería ≤ 8 %/h |

## Entregables académicos / de proyecto repartidos
| Entregable | Responsable principal | Colabora |
| --- | --- | --- |
| Dossier de arquitectura (H1) | JD | SA (capas UI) |
| Maquetas/prototipo (H1) | SA | JD (validar viabilidad) |
| Manual técnico/API | JD | — |
| Manual de usuario | SA | JD (modos y avisos de seguridad) |
| Informe de pruebas de estrés | JD | SA (conteo de campo) |
| Informe de usabilidad + encuesta (anexo de resultados) | SA | JD (análisis datos) |
| Auditoría seguridad / Habeas Data | JD | SA (textos de consentimiento) |
| Publicación en tiendas | JD (builds, firma) | SA (fichas, capturas, textos) |
| Presentación final | ambos | — |
