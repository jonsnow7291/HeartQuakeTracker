# ADR 0001: Inicio de Proyecto y Reglas de Desarrollo Semana 1

## Estado
Aceptado

## Fecha
2026-10-03

## Contexto
El proyecto EarthQuakeTracker arranca bajo un esquema de desarrollo en dos carriles paralelos:
- **Juan Diego:** Core nativo, persistencia cifrada (SQLCipher), BLE/Mesh, sensores, sincronización y servidor.
- **Santiago:** Interfaz de usuario (UI), sistema de diseño accesible WCAG 2.1 AA, navegación, motor de quiz, contenidos educativos oficiales y UX de emergencia.

## Decisión
1. Se adopta la estructura de monorepo definida en `PLAN_DESARROLLO/compartido/02_estructura_repo_y_reglas_git.md`.
2. Se fijan los contratos v0.1.0 en `src/contracts/`.
3. Se confirman las decisiones D-01 a D-38 documentadas en `PLAN_DESARROLLO/compartido/06_decisiones_semana_1.md`.
4. El desarrollo de UI se apoya en el modo `APP_MODE=mock` con escenarios de `DevScenarioController` durante las semanas 1 y 2, procediendo a integración en dispositivo físico por oleadas a partir de la semana 3.
