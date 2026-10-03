# 05 – Calendario de 16 semanas (vista en paralelo)

Hitos: H1 sem. 4 · H2 sem. 8 · H3 sem. 12 · H4 sem. 16. Semana 1 empieza cuando ambos fijen la fecha (anotar en `docs/adr/0001-fecha-inicio.md`).

| Sem. | Juan Diego (backend/core) | Santiago (frontend/contenido) | Integración |
| --- | --- | --- | --- |
| 1 | Repo, CI, contratos v0.1, container, mocks base, esquemas de contenido, ESLint de fronteras | Tokens de diseño, árbol de navegación, lista de pantallas y estados, base de la app UI | Firmar contratos + decisiones (D-01..D-08) |
| 2 | Mocks completos con escenarios; BD base + SQLCipher spike; servidor esqueleto | Design system (componentes), theme, navegación, Splash/Inicio | Demo UI sobre mocks |
| 3 | Session + Permissions reales; gestor de claves; cripto base | Onboarding, consentimiento, permisos explicados | Probar sesión/permisos reales en dispositivo |
| 4 | Ficha médica cifrada real; dossier arquitectura; spike BLE background (Android+iOS) | Maquetas finales + prototipo navegable; strings | **H1** |
| 5 | ContentService + Progress real | Lector MD, guías (3), ficha médica UI | Integración contenido+ficha |
| 6 | EmergencyService, PowerService | Pánico UI, modo activo, flash/tono, motor+UI de quiz | Integración emergencia |
| 7 | SensorService + AlertsService | Alertas/Historial/Logros UI; guías 4–6 | Integración sensores |
| 8 | Hardening BD; ReportService; build interno | Preventivo completo; guías 8; preguntas ≥ 60; pulido crisis | **H2** + prueba de campo |
| 9 | BLE advertising nativo; MeshService v0 | Indicadores mesh; lista nodos; spike MapLibre | Integración BLE básica |
| 10 | Mesh relé/dedupe/prioridad/firmas; PoiService; API v1 | Mapa + POIs + "Cómo llegar" | Campo 2–4 teléfonos |
| 11 | TileService; SyncService; ingesta; Rescuer | Descarga regiones; Ayuda y Donaciones; sync UI; socorrista UI | Integración sync/map |
| 12 | Cierre mesh Android↔iOS; pruebas de sync | Todas las pantallas en modo REAL; usabilidad v1 | **H3** + campo 5+ teléfonos |
| 13 | Banco 200 nodos; hardening seguridad | Encuesta final; usabilidad; fixes | Estrés |
| 14 | Optimización batería; fixes de estrés | Accesibilidad AA; e2e estables | Re-test |
| 15 | Auditoría seguridad; Habeas Data | Manual usuario; textos legales; capturas | Congelamiento de features |
| 16 | Build de producción; tiendas | Metadata tiendas; anexo resultados; presentación | **H4** |

## Camino crítico
`Contratos (S1) → Mocks (S1–2) → Servicios reales por oleada (S3–S11) → Integración en dispositivo → Estrés (S13) → Tiendas (S16)`.
Riesgos de calendario: BLE en background iOS (spike S4), curva de MapLibre offline (spike S9), disponibilidad de device farm (S8 en adelante).

## Reglas de holgura
- Si JD se atrasa **más de 3 días** en una oleada, SA mantiene el mock y sigue; la integración se reprograma sin bloquear.
- Si SA se atrasa **más de 3 días**, JD avanza en tareas de servidor/seguridad (no toca UI).
- Tareas flotantes de apoyo cruzado: ver `juan_diego_backend/02_tareas_detalladas.md` (§Flotantes) y `santiago_frontend/02_tareas_detalladas.md` (§Flotantes).
