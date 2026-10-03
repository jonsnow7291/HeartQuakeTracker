# 07 – Requisitos no funcionales (RNF-01 … RNF-07)

| ID | Categoría | Requisito | Métrica / objetivo | Prioridad | Criterio de aceptación |
| --- | --- | --- | --- | --- | --- |
| RNF-01 | Disponibilidad / tolerancia a fallos | **Offline-First**: 100 % de módulos de consulta educativa, pánico, baliza BLE y mapas cacheados operan sin internet ni red celular | Disponibilidad sin red = 100 % | Alta | Cero crashes por falta de conexión en pruebas sin red |
| RNF-02 | Eficiencia (batería) | Ciclo de escaneo y emisión BLE en modo "Durante" con intervalos optimizados | Consumo **≤ 8 % de batería/hora** en segundo plano | Alta | En modo baliza activa no supera 8 %/h |
| RNF-03 | Usabilidad / accesibilidad | Botón de pánico y cambio de estado con alto contraste y tipografía legible bajo estrés | **≤ 2 toques**; contraste **WCAG 2.1 AA** | Alta | Activación en ≤ 2 toques desde pantalla principal y cumple AA |
| RNF-04 | Seguridad / privacidad | Ficha médica y datos sensibles cifrados en reposo | **AES-256** en BD local | Alta | Cifrado con SQLCipher o Keystore/Keychain del SO |
| RNF-05 | Rendimiento / latencia | Activación de alertas sonoras y luminosas sin demora perceptible | Latencia **≤ 300 ms** | Media | Flash y audio activos en ≤ 300 ms tras pulsar pánico |
| RNF-06 | Interoperabilidad / malla | Proximidad P2P sobre estándares: BLE 4.2+ y Wi-Fi Direct | Alcance **10–30 m por salto** | Media | Transmisión directa estable en 10–30 m en espacio abierto |
| RNF-07 | Portabilidad / compatibilidad | App React Native multiplataforma | **Android 10+ / iOS 15+** | Media | Funciona en Android ≥ 10.0 e iOS ≥ 15.0 |

## Otros umbrales de tiempo declarados en los RF
| Umbral | Origen |
| --- | --- |
| Guía visible < 2 s | RF-01 |
| Retroalimentación de quiz < 1 s | RF-02 |
| Respuesta UI de pánico < 300 ms | RF-05 |
| Flash+tono < 300 ms | RF-06 |
| Cancelar activación en 3 s | RF-05 |
| Retransmisión mesh < 2 s | RF-08 |
| Clasificar lectura de sensor < 500 ms | RF-09 |
| Mapa offline < 2 s | RF-10 |
| Sync completa ≤ 2 min | RF-12 |
| Envío de ficha médica < 3 s | RF-13 |

## Objetivos de calidad del proyecto (propuesta técnica)
- Cobertura de pruebas unitarias **> 80 %**.
- Prueba de estrés de red con **200 nodos**.
- Auditoría de seguridad (pentesting SQLCipher, firmas anti-spoofing) y dictamen legal Habeas Data.
- UI de crisis con paleta accesible diurno/nocturno.
