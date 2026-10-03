# 13 – Pruebas y criterios de aceptación

## Matriz de aceptación por requisito
| Req. | Criterio medible | Cómo probar [INFERIDO] |
| --- | --- | --- |
| RF-01 | Guía completa < 2 s, sin conexión | Modo avión; medir tiempo de render; caso con archivo corrupto (A1) |
| RF-02 | Feedback < 1 s; puntaje final registrado | Test unitario del motor + medición de latencia; abandono y reanudación (A1) |
| RF-03 | 100 % del progreso tras cerrar/reabrir | Test de persistencia; fallo de escritura simulado (A1) |
| RF-04 | AES-256, acceso solo autenticado | Inspección del archivo de BD (ilegible), prueba sin autenticar, pentest |
| RF-05 | ≤ 2 toques, UI < 300 ms | Conteo de interacciones; perfil de rendimiento; cancelar en 3 s |
| RF-06 | Flash+tono < 300 ms | Instrumentación con timestamps en dispositivos con y sin flash |
| RF-07 | Baliza continua, detectable a 10–30 m | Sniffer nRF52840 + Wireshark (canales 37/38/39); medición RSSI y alcance |
| RF-08 | Relé < 2 s sin intervención | Banco de nodos; deduplicación; saturación con prioridad por gravedad |
| RF-09 | Clasificar lectura < 500 ms | Replay de datasets (caídas, caminata, sismo simulado); mesa vibratoria |
| RF-10 | Mapa + POIs < 2 s solo caché | Modo avión; mapas ausentes (A1) |
| RF-11 | Solo canales oficiales validados | Revisión del catálogo; canal inactivo (A1) |
| RF-12 | 100 % sincronizado ≤ 2 min | Cola con N reportes, corte de red, reconexión; idempotencia |
| RF-13 | Ficha enviada < 3 s | Terminal receptor autorizado en rango; ficha incompleta (A2) |
| RNF-01 | 0 crashes sin red | Suite completa en modo avión/sin celular |
| RNF-02 | ≤ 8 %/h batería en baliza | Medición 1 h en segundo plano en varios dispositivos |
| RNF-03 | ≤ 2 toques; WCAG 2.1 AA | Auditoría de contraste, TalkBack/VoiceOver |
| RNF-04 | AES-256 SQLCipher/Keystore | Revisión de configuración + pentest |
| RNF-05 | ≤ 300 ms | Ver RF-05/06 |
| RNF-06 | 10–30 m por salto | Pruebas en espacio abierto |
| RNF-07 | Android 10+ / iOS 15+ | Device farm 6–8 terminales |

## Estrategia
1. **Unitarias:** cobertura > 80 % (motor de quiz, deduplicación mesh, cola de prioridad, detección de sensor, cola de sync, cifrado).
2. **Integración nativa:** puentes BLE (advertising/scan), foreground service, flash/audio.
3. **Dispositivos reales:** device farm gama baja–alta Android + iPhone; verificar comportamiento del radio BLE en reposo y background.
4. **Estrés de red:** simulación de **200 nodos** (latencia, pérdida, saturación, consumo de batería) — QA & Hardware Tester, semanas 13–16.
5. **Seguridad:** pentesting SQLCipher, pruebas de spoofing de balizas, revisión Habeas Data.
6. **Accesibilidad y usabilidad:** pruebas con usuarios bajo estrés simulado, contraste AA.
7. **Sensores:** datasets y escenarios de falsos positivos (R-03).

## Encuesta de validación [FUENTE]
- Aplicar a ciudadanos de zonas de riesgo sísmico en Colombia.
- Objetivo: contrastar DOFA y buyer persona con la percepción real sobre preparación, respuesta y comunicación durante un sismo.
- Sus resultados priorizan los módulos del MVP y se documentan en el anexo de análisis de resultados junto con las pruebas de estrés.
- Pendiente: el cuestionario no está redactado en los documentos (ver `16`).

## Definition of Done del MVP [INFERIDO]
Todos los RF de prioridad Alta cumplen su criterio; RNF-01…04 verificados; cobertura > 80 %; estrés 200 nodos superado; auditoría de seguridad sin críticos abiertos; binarios en App Store y Google Play.
