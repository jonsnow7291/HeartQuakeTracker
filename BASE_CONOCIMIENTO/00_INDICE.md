# Base de conocimiento – EarthQuakeTracker (MW-2026)

App móvil offline-first (React Native) para prevención, respuesta y recuperación ante sismos en Colombia.
Fuentes: `DOCS/OneDrive_1_10-3-2026/` → `EarthQuakeTracker.docx` (alcance, RF/RNF, DOFA, buyer persona, journey, mockups, riesgos), `Propuesta Técnica y Económica.docx` (cronograma, presupuesto), `Lenguaje y implmentacion.docx` (stack).

## Cómo usar (para el modelo que desarrolla)
Lee **solo** los archivos que necesites. Cada uno es independiente y corto. Empieza por `01` y `08`; el resto, por tarea.

| Archivo | Léelo cuando… |
| --- | --- |
| `01_vision_alcance_objetivos.md` | Necesitas contexto, objetivos, alcance y fases Antes/Durante/Después |
| `02_analisis_estrategico.md` | Necesitas DOFA, cliente objetivo (Defensa Civil) o customer journey |
| `03_rf_prevencion_educacion.md` | Implementas RF-01, RF-02, RF-03 (guías, quizzes, logros) |
| `04_rf_emergencia_panico_ficha_medica.md` | Implementas RF-04, RF-05, RF-06, RF-13 (ficha médica, pánico, flash/sonido, exportación) |
| `05_rf_ble_mesh_y_sensores.md` | Implementas RF-07, RF-08, RF-09 (baliza BLE, malla P2P, sensores) |
| `06_rf_mapas_donaciones_sync.md` | Implementas RF-10, RF-11, RF-12 (mapa, donaciones, store-and-forward) |
| `07_requisitos_no_funcionales.md` | Rendimiento, batería, seguridad, compatibilidad (RNF-01..07) |
| `08_arquitectura_y_stack.md` | Decisiones técnicas, stack, módulos, modelo de datos local, backend |
| `09_riesgos_y_controles.md` | Riesgos técnicos, mitigaciones y controles ISO/IEC 27001 |
| `10_ui_mockups_pantallas.md` | Construyes pantallas/navegación |
| `11_plan_cronograma_equipo.md` | Fases, hitos, equipo, roles |
| `12_presupuesto_costos.md` | Costos, facturación, fuentes |
| `13_pruebas_y_aceptacion.md` | Criterios de aceptación, pruebas, encuesta de validación |
| `14_trazabilidad.md` | Matriz RF ↔ RNF ↔ riesgo ↔ pantalla ↔ ISO |
| `15_backlog_desarrollo.md` | Qué construir y en qué orden (épicas y tareas) |
| `16_inconsistencias_y_dudas.md` | Contradicciones entre documentos y decisiones pendientes |

## Convenciones
- **[FUENTE]** = dicho en los documentos. **[INFERIDO]** = deducción razonable, validar.
- IDs: `RF-xx`, `RNF-xx`, riesgos `R-xx` (numerados aquí por orden del documento), épicas `E-xx`.
- Código de proyecto: `MW-2026`. Equipo: Jheison Sebastián Gómez Sandoval, Juan Diego Chaparro Vargas, Santiago González Gamboa, Juan Camilo Nonzoque Torres (UNIMINUTO, Ing. de Software, 2026).
