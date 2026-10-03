# Santiago – Resumen de rol (Frontend + Contenido + UX)

## Misión
Construir todo lo que el usuario ve y toca, de forma que una persona en pánico pueda activar la ayuda en ≤2 toques, y que la app sea clara, accesible (WCAG 2.1 AA) y funcione sin conexión. Redactar y mantener el contenido educativo.

## Eres dueño de
`src/ui/**`, `content/**`, `assets/**`, `design/**`, `__tests__/ui/`, `e2e/`, pipeline de tests UI, `docs/sa/`.
**No tocas:** `src/contracts/`, `src/core/`, `android/`, `ios/`, `server/`, config raíz (`package.json` etc. → propones por PR pequeño y avisas a JD).

## Cómo trabajas sin esperar al backend
Solo hablas con los **contratos** (`compartido/03_contratos_ts.md`). Desde la Semana 1–2 usas **mocks** (`APP_MODE=mock`) y el `DevScenarioController` para simular situaciones. En cada integración cambias servicio por servicio a `real` (archivo `src/ui/config/modes.ts`, tuyo).

## RF que implementas (lado visible)
RF-01 (lector + redacción) · RF-02 (motor de quiz + UI) · RF-03 (pantalla de logros) · RF-04 (formularios y perfil) · RF-05 (UI de pánico) · **RF-06 completo** · RF-07/08 (indicadores) · RF-09 (Alertas) · RF-10 (render de mapa, puntos cercanos, "Cómo llegar") · RF-11 (pantalla de ayudas) · RF-12 (indicadores) · RF-13 (modo socorrista UI) · **RNF-03 accesibilidad** (dueño).

## Lo que Juan Diego espera de ti (resumen; detalle en `01_entregables_a_juan_diego.md`)
1. Tokens de diseño y árbol de navegación (S1).
2. Pantallas y estados claros para que los contratos sean suficientes (S1–S4).
3. Contenido `.md`/`.json` conforme al esquema (guías, preguntas, textos legales).
4. Textos de notificaciones/permisos/errores.
5. Feedback rápido sobre los contratos (si falta algo, CCR en 24 h).
6. Apoyo en pruebas de campo.

## Principios de UI
- Pánico: máximo 2 toques, botón grande, alto contraste, respuesta <300 ms.
- Estados siempre visibles: offline/online, sincronización pendiente, baliza activa, batería.
- Nunca bloquear la UI esperando red.
- Errores en lenguaje simple con acción siguiente (usar tabla `ErrorCode → texto`).
- Modo diurno/nocturno; tipografía legible; áreas táctiles ≥ 48 dp.

## Orden de tus documentos
1. `01_entregables_a_juan_diego.md`
2. `02_tareas_detalladas.md`
3. `03_pantallas_y_componentes.md`
4. `04_contenido_y_quiz.md`
5. `05_definicion_de_terminado_y_pruebas.md`
