# Juan Diego – Resumen de rol (Backend + Core del dispositivo + Servidor)

## Misión
Construir todo lo "invisible" y crítico: persistencia cifrada, seguridad, máquina de emergencia, BLE/malla, sensores, sincronización, servidor y datos. Publicar **contratos y mocks primero** para que Santiago avance en paralelo desde el día 1.

## Eres dueño de
`src/contracts/`, `src/core/**`, `android/**`, `ios/**`, `server/**`, `__tests__/core/`, config raíz (`package.json`, `tsconfig`, `metro`, `babel`), pipelines de servidor y build nativo, `.env.example`, `docs/jd/`.
**No tocas:** `src/ui/`, `content/`, `assets/`, `design/`, `e2e/`.

## RF que implementas (lógica)
RF-04 (almacenamiento/cifrado) · RF-05 (estado) · RF-07 · RF-08 · RF-09 · RF-12 · RF-13 · RF-01 (paquete/verificación) · RF-03 (persistencia) · RF-10 (datos y tiles) · RF-11 (catálogo) · RNF-01, 02, 04, 06 · gran parte de RNF-07.

## Lo que Santiago espera de ti (resumen; detalle en `01_entregables_a_santiago.md`)
1. **Semana 1:** contratos v0.1, container, mocks base, esquemas de contenido, reglas de fronteras, repo + CI.
2. **Semana 2:** mocks completos con escenarios y `DevScenarioController`.
3. **Oleadas de servicios reales** (S3–S11) en el orden que la UI los necesita.
4. **Builds de prueba** firmados cada integración (APK y TestFlight/Internal testing).
5. Documentación corta de cada servicio (qué hace, errores, ejemplos) en `docs/jd/servicios/*.md`.

## Principios de trabajo
- Contratos primero, implementación después; los mocks no se desvían del comportamiento real.
- Seguridad por defecto (cifrado en reposo y en tránsito, firmas, mínimo de permisos).
- Medir: batería, latencia, tasa de entrega de la malla; dejar números en `docs/jd/metricas.md`.
- Cada servicio: unit tests (>80 % en `core`), logs sin datos sensibles.

## Orden de tus documentos
1. `01_entregables_a_santiago.md` – qué, cuándo y criterios de aceptación.
2. `02_tareas_detalladas.md` – lista de tareas con subtareas y estimación.
3. `03_servidor_api.md` – servidor, BD, endpoints.
4. `04_seguridad_y_protocolo_mesh.md` – cripto, ID efímero, formato BLE, reglas de malla.
5. `05_definicion_de_terminado_y_pruebas.md`.
