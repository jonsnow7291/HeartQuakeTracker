# Contexto compartido para agentes (herdr) – EarthQuakeTracker

**Proyecto:** app móvil offline-first (React Native + TypeScript) para prevención, respuesta y recuperación ante sismos en Colombia. Código MW-2026, UNIMINUTO Ing. de Software, 16 semanas.

**Equipo:** Juan Diego (backend/core/servidor) y Santiago (frontend/contenido). Este repo (`~/Downloads/uni/Ing.De Software/earthquake-tracker`) lo está montando Juan Diego con Claude Code (pane w3:p1). Antigravity CLI (agy, pane w3:p2) apoya con tareas pequeñas.

**Documentación (solo lectura, fuente de verdad):**
- Requisitos y análisis: `~/Downloads/uni/Ing.De Software/BASE_CONOCIMIENTO/` (empieza por `00_INDICE.md`).
- Plan en dos carriles: `~/Downloads/uni/Ing.De Software/PLAN_DESARROLLO/` → `00_LEEME_PLAN.md`, `compartido/` (propiedad, contratos TS, decisiones D-01…D-38, alcance MVP), `juan_diego_backend/`, `santiago_frontend/`.

**Estado actual (Semana 1, carril de Juan Diego):** repo recién creado (`git init`, vacío). Pendiente: estructura del monorepo, scaffold RN, `src/contracts/` (interfaces TS de `compartido/03_contratos_ts.md`), `src/core/container.ts` + mocks, esquemas JSON de contenido, CI, ADRs.

**Decisiones clave:** RN bare (no Expo), TypeScript estricto, Yarn 1.x (en `~/.local/bin/yarn`), Zustand + React Navigation en UI, SQLCipher, BLE (scan con react-native-ble-plx, advertising nativo propio), servidor Node+Fastify+PostgreSQL+pg-boss.

## Reglas para el agente que apoya
1. **Una carpeta, un dueño.** Juan Diego: `src/contracts`, `src/core`, `android`, `ios`, `server`, config raíz. Santiago: `src/ui`, `content`, `assets`, `design`. No edites carpetas fuera de lo que se te asigne explícitamente.
2. **No cambies contratos** (`src/contracts`) sin que Juan Diego lo pida.
3. **No instales dependencias globales ni toques `package.json` raíz** sin pedirlo; no hagas `git commit`/`push`.
4. Código y comentarios en español donde aplique; TS estricto, sin `any` en contratos.
5. Ante duda, pregunta; reporta qué archivos tocaste al terminar.

## Tareas que se le pueden delegar (pequeñas, aisladas)
Esquemas JSON de contenido (`content/schema/`), scripts (`scripts/validate-content`, `check-ownership`), plantillas de ADR, `.env.example`, `CODEOWNERS`, README de carpetas, redacción de datos semilla (POIs/entidades de Bogotá en `server/seed/`), tests unitarios de utilidades puras.

**Por ahora no hay tarea asignada: espera instrucciones de Juan Diego.**

---
## ACTUALIZACIÓN: alcance = SOLO BACKEND
Juan Diego y los agentes (Claude + agy) trabajamos **solo backend/core/servidor**. **No crear ni editar** `src/ui`, `content/guias|quiz|legal|textos`, `assets`, `design`, ni scaffold React Native (eso es de Santiago). Tu zona permitida: `content/schema/`, `scripts/`, `server/`, `docs/adr/`, `docs/jd/`, `.github/`, `.env.example`, `CODEOWNERS`.
