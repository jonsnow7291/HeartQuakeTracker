# Santiago – Definición de terminado (DoD) y pruebas

## DoD de una pantalla/tarea
- [ ] Funciona en `APP_MODE=mock` **y** (si el servicio ya existe) en `real`.
- [ ] Cubre estados: carga, vacío, error (con `ErrorCode`→texto), offline y el flujo alterno del RF.
- [ ] Solo importa de `src/contracts` y `src/ui`; no accede a `src/core`.
- [ ] Accesible: etiquetas, foco, contraste AA, objetivos ≥48 dp; probado con TalkBack/VoiceOver básico.
- [ ] Modo claro y oscuro.
- [ ] Test de componente/unit y caso de aceptación en `__tests__/ui/acceptance.md`.
- [ ] Rendimiento: sin jank evidente; pulsación crítica <300 ms.
- [ ] PR ≤400 líneas, revisado por JD (lectura), CI verde.

## Criterios de aceptación por RF (lado SA)
| RF | Criterio SA |
| --- | --- |
| RF-01 | Guía visible <2 s sin red; errores A1 y banner A2 correctos |
| RF-02 | Feedback por respuesta <1 s; puntaje final guardado; reanudar tras abandono; sugerencia de repaso |
| RF-03 | Pantalla de logros refleja el 100 % del progreso tras cerrar/reabrir |
| RF-04 | Formulario con campos obligatorios, edición en vez de duplicar, acceso solo con sesión |
| RF-05 | ≤2 toques; cancelación en 3 s; solicitud guiada de permisos faltantes |
| RF-06 | Flash+tono en <300 ms; fallback sin flash; aviso de silencio |
| RF-07/08 | Estado de baliza/malla y lista de nodos coherentes con el servicio |
| RF-09 | Alertas y banner correctos; mensaje sin sensores |
| RF-10 | Mapa y puntos <2 s con datos locales; estado sin mapa; reportar punto |
| RF-11 | Solo canales activos/oficiales; redirección a puntos de socorro |
| RF-12 | Indicador de pendientes y "Sincronizar ahora"; errores parciales visibles |
| RF-13 | Modo socorrista: habilitación, ficha mostrada, aviso incompleta/firma inválida |
| RNF-03 | WCAG 2.1 AA; ≤2 toques; alto contraste |
| RNF-07 | UI funcional en Android 10+ e iOS 15+ (varios tamaños) |

## Pruebas que SA diseña y ejecuta
1. **Unitarias/componentes** (Jest + React Native Testing Library): motor de quiz, formularios, componentes del DS.
2. **e2e** (Detox o Maestro): flujos críticos — onboarding→ficha→pánico→modo activo→detener; guía offline; quiz completo con abandono; mapa offline con región; ayuda y donaciones; sync UI.
3. **Accesibilidad:** checklist WCAG 2.1 AA (contraste, tamaño, foco, lectores).
4. **Usabilidad:** 5–8 personas, tareas cronometradas: "activar pánico", "leer guía", "registrar ficha", "encontrar albergue". Métricas: éxito, tiempo, errores, SUS.
5. **Encuesta final** (anexo): diseño del cuestionario (preparación, confianza, comunicación en sismo), muestra en zona de riesgo, análisis y priorización.
6. **Dispositivos:** Android gama baja/media/alta e iPhone; pantallas pequeñas y grandes.

## Entregables de calidad de SA (a JD y al proyecto)
`__tests__/ui/acceptance.md`, reporte de usabilidad v1 (S12) y final (S15), informe de accesibilidad (S14), encuesta y resultados (S15), manual de usuario (S15–S16).

## Riesgos de SA y plan B
| Riesgo | Plan B |
| --- | --- |
| MapLibre offline problemático | Visor alterno con `react-native-maps` + imagen local o lista de POIs con brújula/distancia |
| Linterna/audio con restricciones del SO | Pedir a JD módulo nativo; mínimo: tono + pantalla estroboscópica blanca/negra |
| Contenido educativo insuficiente | Priorizar 5 guías + 40 preguntas y completar tras H2 |
| Retraso de servicios | Mantener mocks; priorizar pantallas críticas (pánico, ficha, guías) |
