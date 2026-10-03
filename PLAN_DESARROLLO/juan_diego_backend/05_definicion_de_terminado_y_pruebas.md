# JD – Definición de terminado (DoD) y pruebas

## DoD de una tarea
- [ ] Cumple el contrato (compila contra `src/contracts`), sin `any`.
- [ ] Tests unitarios (cobertura de módulo ≥ 80 %), incluidos errores y casos alternos del RF.
- [ ] Mock equivalente actualizado (mismo comportamiento observable).
- [ ] Documentación `docs/jd/servicios/<x>.md` con: propósito, métodos, errores (`ErrorCode`), eventos, ejemplo de uso, notas de permisos.
- [ ] Probado en dispositivo físico (mínimo 1 Android + 1 iOS cuando aplique).
- [ ] Sin logs de datos sensibles; sin secretos en el repo.
- [ ] PR revisado por Santiago (lectura) y mergeado con CI verde.

## DoD de una oleada
Santiago confirmó con su UI que el servicio real reproduce lo que hacía el mock en los escenarios definidos.

## Criterios de aceptación por RF (lado JD)
| RF | Criterio JD |
| --- | --- |
| RF-01 | `getGuideMarkdown` < 2 s; corrupción detectada por hash; actualización no interrumpe lectura |
| RF-03 | 100 % del progreso tras cerrar/reabrir; fallo de escritura reintenta y emite `STORAGE_FAILED` |
| RF-04 | BD cifrada AES-256; acceso solo con sesión desbloqueada |
| RF-05 | Transiciones válidas; cancelar ≤3 s; permisos faltantes devueltos; respuesta de estado <300 ms |
| RF-07 | Baliza continua; detectable 10–30 m; coordenada actualizada o última conocida con timestamp |
| RF-08 | Relé <2 s; sin duplicados; prioridad por gravedad bajo saturación |
| RF-09 | Clasificación <500 ms por lectura; ruido descartado; módulo se desactiva sin sensores |
| RF-10 | `nearest`/`listInBounds` <2 s con datos locales; tiles verificados por hash |
| RF-11 | Solo entidades/canales con `active && verifiedAt` |
| RF-12 | 100 % de cola sincronizada ≤2 min tras reconectar; ACK parcial conserva no confirmados; idempotente |
| RF-13 | Ficha enviada <3 s en rango; incompleta marcada; solo a receptor autorizado |
| RNF-01 | 0 crashes en modo avión (suite completa) |
| RNF-02 | ≤8 % de batería por hora con baliza en segundo plano |
| RNF-04 | AES-256 / Keystore-Keychain; pentest aprobado |
| RNF-06 | Alcance 10–30 m por salto en campo abierto |

## Pruebas que JD diseña y ejecuta
1. **Unitarias:** cola de prioridad, dedupe, codificación del paquete BLE, detector sísmico (datasets), KDF/cifrado, sync queue, máquina de estados.
2. **Integración nativa:** advertising/scan en dispositivos reales (matriz Android 10, 12, 14 / iOS 15, 17).
3. **Servidor:** pruebas de contrato (OpenAPI), carga (k6) de `sync/batch`, idempotencia, seguridad (firma/replay).
4. **Estrés 200 nodos:** simulador de nodos (software) + 6–8 dispositivos físicos + sniffer nRF52840; métricas: entrega %, latencia por salto, mensajes duplicados, consumo de batería.
5. **Batería:** 1 h en segundo plano con baliza activa en 3 modelos, registro con perfilador del SO.
6. **Seguridad:** análisis de BD, spoofing de balizas, manipulación de colas, revisión de permisos.

## Métricas a registrar (`docs/jd/metricas.md`)
Latencia pánico→baliza, latencia por salto, % entrega, mensajes duplicados evitados, %/h de batería, tiempo de sync, p95 del servidor.

## Riesgos de JD y plan B
| Riesgo | Plan B |
| --- | --- |
| Advertising iOS en background insuficiente | Usar escaneo de Android como relé + mensajes por canal de datos cuando app en foreground; documentar limitación y notificación al usuario |
| Payload BLE legacy demasiado pequeño | Mensajes mínimos + ficha por GATT/Wi-Fi Direct |
| Atraso del módulo nativo | SA mantiene mock; priorizar Android primero, iOS después |
| SQLCipher + RN incompatibilidades | Alternativa: cifrado por campo con AES-GCM sobre SQLite estándar (menos preferido) |
