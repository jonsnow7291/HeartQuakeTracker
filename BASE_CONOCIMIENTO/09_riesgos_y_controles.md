# 09 – Riesgos técnicos y controles ISO/IEC 27001:2022

| ID | Riesgo | Impacto | Prob. | Control Anexo A | Mitigación | Aplicación en la app | RF/RNF |
| --- | --- | --- | --- | --- | --- | --- | --- |
| R-01 | **Fuga de datos médicos**: ficha enviada o guardada sin cifrado robusto en la malla BLE | Crítico | Media | A.8.24 Criptografía | AES-256 en BD local (SQLCipher); anonimizar payloads con **identificadores efímeros cifrados** en BLE | Ficha cifrada en SQLite y transmisión cifrada a rescatistas (Ley 1581) | RF-04, 13, RNF-04 |
| R-02 | **Suspensión de servicios en background** por SO (Android Doze / límites iOS) apaga la baliza | Crítico | Alta | A.8.6 Gestión de capacidad y disponibilidad | **Foreground Service** con notificación persistente (Android); modos periféricos BLE autorizados (iOS) | Loop SOS y escaneo activos con pantalla bloqueada o batería baja | RF-07, 08, RNF-01, 02 |
| R-03 | **Falsos positivos** de sensores (caídas, movimiento cotidiano) generan alertas masivas | Medio | Alta | A.8.29 Pruebas de seguridad y validación de datos | Filtros de umbral + **consenso local (quórum)** en ventana de tiempo | Corroborar con **≥ 3 nodos adyacentes** antes de alerta general | RF-09 |
| R-04 | **Drenaje de batería** por flash + audio + radio simultáneos | Alto | Alta | A.8.14 Redundancia de instalaciones | Perfiles de energía dinámicos: duty cycle BLE adaptativo, flash intermitente, modo ultrabatería | Modo **"SOS Prolongado"**: ráfagas cada 30 s si batería < 20 % | RF-06, 07, RNF-02 |
| R-05 | **Aislamiento por baja densidad de nodos y suplantación** (alertas SOS apócrifas) | Crítico | Alta | A.8.20 Seguridad de redes | **Firmas criptográficas livianas** en beacons, verificación mutua entre pares, fallback a SMS | Si no hay nodos puente en 50 m tras 2 min → **SMS geolocalizado** (celular/satelital) | RF-07, 08 |
| R-06 | **Fragmentación Android/iOS** (stack BLE y Wi-Fi Direct en RN) | Alto | Media | A.8.28 Codificación segura | Módulos puente nativos, especificaciones Bluetooth SIG, suite de pruebas cruzadas entre SO | Conexión híbrida estandarizada Android↔iOS | RNF-06, 07 |

## Controles ISO por requisito
| Control | RF |
| --- | --- |
| A.5.34 Privacidad y protección de datos personales | RF-01, 04, 13 |
| A.8.9 Gestión de la configuración | RF-01, 10 |
| A.8.10 Eliminación de la información | RF-03 |
| A.8.13 Copias de seguridad | RF-12 |
| A.8.16 Actividades de monitoreo | RF-05, 06, 09 |
| A.8.20 Seguridad de redes | RF-07, 08 |
| A.8.24 Uso de criptografía | RF-04, 12, 13 |
| A.8.28 Codificación segura | RF-02 |

## Amenazas DOFA relacionadas
Fallas de red (R-02, R-05), información falsa (R-03, R-05), privacidad de datos (R-01), baja conectividad rural (R-05), adopción (fuera de riesgos técnicos).

## Tareas de seguridad derivadas
1. Esquema de **ID efímero** rotativo + firma por mensaje (claves por dispositivo; verificación por pares).
2. Política de consentimiento y tratamiento de datos sensibles (Habeas Data, asesoría legal presupuestada).
3. Pentesting de SQLCipher y validación de firmas contra spoofing (auditoría presupuestada).
4. Revisión de permisos mínimos (GPS, BLE, notificaciones, sensores) y de cómo se solicitan.
