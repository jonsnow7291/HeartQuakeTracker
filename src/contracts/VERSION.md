# Contracts Versioning

## v0.1.0 (2026-10-03)
- Initial TypeScript contracts agreed for Week 1 (see `PLAN_DESARROLLO/compartido/03_contratos_ts.md`).
- Core interfaces: Session, Permissions, Medical, Emergency, Mesh, Rescuer, Sensors, Alerts, Sync, Reports, Content, Progress, Poi, Tiles, Aid, Power, DevScenario.
- Error codes standardized in `src/contracts/errors.ts`.

## v0.1.1 (JD, aditivo – no rompe a la UI)
- `AppException` (clase lanzable que implementa `AppError`) en `types.ts`.
- `EmergencyState.noBridge2Min?` (opcional) para el aviso de SMS prellenado (D-25).
