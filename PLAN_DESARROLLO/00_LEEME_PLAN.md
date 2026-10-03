# Plan de desarrollo en dos carriles – EarthQuakeTracker (MW-2026)

Base de requisitos: `../BASE_CONOCIMIENTO/` (RF-01…13, RNF-01…07). Este plan reparte **quién construye qué** para que Juan Diego y Santiago no se pisen y todo encaje al final.

## Principio de división
> **Santiago = todo lo que el usuario ve y toca (UI, navegación, contenido, mapa visual, flash/sonido).**
> **Juan Diego = todo lo que no se ve (servicios en el dispositivo, cifrado, BLE/malla, sensores, sincronización) + servidor.**
> Se hablan **solo** a través de **contratos TypeScript** (`src/contracts/`) que Juan Diego publica. Santiago nunca importa código de `src/core/` directamente: usa los contratos y, mientras no exista el servicio real, los **mocks** que entrega Juan Diego.

```
Santiago (UI)  ──usa──►  src/contracts/  ◄──implementa──  Juan Diego (core + server)
                          (interfaces)
```

## Carpetas de este plan
| Carpeta | Dueño | Contenido |
| --- | --- | --- |
| `compartido/` | Ambos (cambios por acuerdo) | Mapa de propiedad, estructura del repo, contratos, reglas Git, puntos de integración, calendario |
| `juan_diego_backend/` | Juan Diego | Su plan: entregables, tareas, servicios, servidor, definición de terminado |
| `santiago_frontend/` | Santiago | Su plan: entregables, tareas, pantallas, contenido, definición de terminado |

## Orden de lectura
1. `compartido/01_mapa_de_propiedad.md` (quién es dueño de cada RF y carpeta) ← **leer primero, los dos**
2. `compartido/02_estructura_repo_y_reglas_git.md`
3. `compartido/03_contratos_ts.md`
4. Tu carpeta personal, en orden numérico.
5. `compartido/04_puntos_de_integracion.md`, `05_calendario_16_semanas.md`, `06_decisiones_semana_1.md` (decisiones cerradas) y `07_alcance_mvp.md` (qué entra y qué no)

## Resumen de cargas
| | Juan Diego | Santiago |
| --- | --- | --- |
| RF como dueño de la lógica | 04 (ficha), 05 (estado), 07, 08, 09, 12, 13 + persistencia de 03, contenido 01 | 01 (lector+contenido), 02 (quiz), 06, 10 (mapa visual), 11, 03 (pantallas) |
| Infraestructura | Servidor, BD, CI/CD de servidor, SQLCipher, cripto, módulos nativos BLE | Tema/diseño, navegación, componentes, accesibilidad, CI de UI/tests de UI, e2e |
| Entregables a la otra persona | Contratos + mocks + servicios reales por oleadas | Design tokens, specs de pantallas, contenido, casos de aceptación de UI, feedback de uso de contratos |

## Reglas de oro
1. **Una carpeta, un dueño.** Si necesitas cambiar algo ajeno, abres un *Contract Change Request* (CCR) o issue; no editas.
2. **Los contratos los cambia Juan Diego, pero con visto bueno de Santiago** (ver `03`). Cambios incompatibles solo en los puntos de integración.
3. **Integración continua, no al final:** cada 2 semanas se integra de verdad en dispositivo (ver `04`).
4. **Nada de lógica de negocio en UI ni UI en `core`.**
5. **Las decisiones ya están tomadas** para el MVP — ver `compartido/06_decisiones_semana_1.md` y el alcance en `compartido/07_alcance_mvp.md`. Solo se cambian con un ADR aprobado por ambos.

## Qué decide cada quien si algo no está definido
- Comportamiento visible/UX → Santiago.
- Formato de datos, seguridad, protocolo, rendimiento/batería → Juan Diego.
- Empate o impacto cruzado → se anota en `06_decisiones_semana_1.md` / `ADR` y se decide en la reunión semanal.
