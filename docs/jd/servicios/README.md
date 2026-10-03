# Índice de Servicios (`interface Services`) – EarthQuakeTracker

Este directorio contiene el catálogo de los **16 servicios** expuestos por el contenedor de inyección de dependencias (`src/core/container.ts`) y definidos contractualmente en [`src/contracts/index.ts`](file:///home/lazarus/Downloads/uni/Ing.De Software/earthquake-tracker/src/contracts/index.ts#L29-L46). 

El frontend (**Santiago**) consume exclusivamente estos servicios mediante contratos TypeScript; en modo desarrollo (`APP_MODE=mock`), cada servicio responde mediante su implementación mock con escenarios preconfigurados.

---

## Tabla de los 16 Servicios

| # | Clave de Servicio | Interfaz TS | Propósito Principal | Requisito (RF) | Archivo del Contrato |
| :-: | :--- | :--- | :--- | :---: | :--- |
| 1 | `session` | `SessionService` | Gestión de cuenta local, bloqueo y desbloqueo por PIN de 6 dígitos o biometría sin requerir conexión a internet. | RF-04, D-01 | [`src/contracts/session.ts`](file:///home/lazarus/Downloads/uni/Ing.De Software/earthquake-tracker/src/contracts/session.ts) |
| 2 | `permissions` | `PermissionsService` | Consulta de estado, solicitud en tiempo de ejecución y comprobación de permisos indispensables para pánico y malla. | RF-05, RF-07, RNF-07 | [`src/contracts/permissions.ts`](file:///home/lazarus/Downloads/uni/Ing.De Software/earthquake-tracker/src/contracts/permissions.ts) |
| 3 | `medical` | `MedicalProfileService` | Almacenamiento local cifrado (SQLCipher AES-256) y consulta de la ficha médica de emergencia y contactos clave. | RF-04, RF-13 | [`src/contracts/medical.ts`](file:///home/lazarus/Downloads/uni/Ing.De Software/earthquake-tracker/src/contracts/medical.ts) |
| 4 | `emergency` | `EmergencyService` | Orquestación de la máquina de estados de emergencia (IDLE, CONFIRMING con 3 s de gracia, ACTIVE, STOPPED) y botón "a salvo". | RF-05, RF-06, RF-07 | [`src/contracts/emergency.ts`](file:///home/lazarus/Downloads/uni/Ing.De Software/earthquake-tracker/src/contracts/emergency.ts) |
| 5 | `mesh` | `MeshService` | Control de la red en malla BLE P2P, detección de nodos cercanos, retransmisión comunitaria y estado del enlace. | RF-07, RF-08 | [`src/contracts/mesh.ts`](file:///home/lazarus/Downloads/uni/Ing.De Software/earthquake-tracker/src/contracts/mesh.ts) |
| 6 | `rescuer` | `RescuerService` | Habilitación autorizada del modo socorrista mediante credencial y recepción por proximidad de fichas médicas de rescate. | RF-13 | [`src/contracts/mesh.ts`](file:///home/lazarus/Downloads/uni/Ing.De Software/earthquake-tracker/src/contracts/mesh.ts) |
| 7 | `sensors` | `SensorService` | Muestreo de sensores inerciales (acelerómetro) para detección autónoma de vibraciones de sismos en el dispositivo. | RF-09 | [`src/contracts/sensors.ts`](file:///home/lazarus/Downloads/uni/Ing.De Software/earthquake-tracker/src/contracts/sensors.ts) |
| 8 | `alerts` | `AlertsService` | Historial paginado y suscripción en tiempo real a alertas sísmicas (confirmadas o por quórum) y simulacros programados. | RF-01, RF-09 | [`src/contracts/sensors.ts`](file:///home/lazarus/Downloads/uni/Ing.De Software/earthquake-tracker/src/contracts/sensors.ts) |
| 9 | `sync` | `SyncService` | Motor store-and-forward con cola local persistente para sincronización asíncrona e idempotente con el servidor. | RF-12 | [`src/contracts/sync.ts`](file:///home/lazarus/Downloads/uni/Ing.De Software/earthquake-tracker/src/contracts/sync.ts) |
| 10 | `reports` | `ReportService` | Encolado local de reportes ciudadanos sobre daños estructurales, cortes de servicios y solicitudes de asistencia comunitaria. | RF-12 | [`src/contracts/sync.ts`](file:///home/lazarus/Downloads/uni/Ing.De Software/earthquake-tracker/src/contracts/sync.ts) |
| 11 | `content` | `ContentService` | Lectura offline de guías educativas Markdown, verificación de integridad por SHA-256 y entrega del banco de preguntas del quiz. | RF-01, RF-02 | [`src/contracts/content.ts`](file:///home/lazarus/Downloads/uni/Ing.De Software/earthquake-tracker/src/contracts/content.ts) |
| 12 | `progress` | `ProgressRepository` | Registro de intentos y puntuaciones del quiz, desbloqueo secuencial de niveles educativos e historial de insignias ganadas. | RF-02, RF-03 | [`src/contracts/progress.ts`](file:///home/lazarus/Downloads/uni/Ing.De Software/earthquake-tracker/src/contracts/progress.ts) |
| 13 | `poi` | `PoiService` | Consulta y filtrado geográfico offline de puntos de interés (hospitales, bomberos, albergues, zonas seguras y acopio). | RF-10 | [`src/contracts/map.ts`](file:///home/lazarus/Downloads/uni/Ing.De Software/earthquake-tracker/src/contracts/map.ts) |
| 14 | `tiles` | `TileService` | Descarga, verificación y gestión de archivos de teselas vectoriales offline (`.mbtiles`) para visualización en MapLibre. | RF-10 | [`src/contracts/map.ts`](file:///home/lazarus/Downloads/uni/Ing.De Software/earthquake-tracker/src/contracts/map.ts) |
| 15 | `aid` | `AidDirectoryService` | Directorio de entidades oficiales de ayuda y socorro institucional, junto al catálogo estandarizado de necesidades para donación. | RF-11 | [`src/contracts/aid.ts`](file:///home/lazarus/Downloads/uni/Ing.De Software/earthquake-tracker/src/contracts/aid.ts) |
| 16 | `power` | `PowerService` | Lectura del porcentaje de batería y estado de carga para activar perfiles de bajo consumo (`lowPower`) en emergencias. | RNF-01, RNF-02 | [`src/contracts/power.ts`](file:///home/lazarus/Downloads/uni/Ing.De Software/earthquake-tracker/src/contracts/power.ts) |
