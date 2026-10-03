# 14 – Matriz de trazabilidad

| RF | Prioridad | Fase | Pantalla | RNF | Riesgo | ISO | Módulo (`08`) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| RF-01 Guías offline | Alta | Antes | Prevención | RNF-01 | — | A.8.9, A.5.34 | education |
| RF-02 Quizzes | Alta | Antes | Prevención (Simulacros) | RNF-01 | — | A.8.28 | education |
| RF-03 Logros | Media | Antes | Prevención / Perfil | RNF-01 | — | A.8.10 | education |
| RF-04 Ficha médica | Alta | Antes/Durante | Mi perfil | RNF-04 | R-01 | A.5.34, A.8.24 | medical-profile |
| RF-05 Botón de pánico | Alta | Durante | Durante / Inicio | RNF-03, 05 | — | A.8.16 | panic |
| RF-06 Flash + sonido | Alta | Durante | Modo emergencia | RNF-05 | R-04 | A.8.16 | signaling |
| RF-07 Baliza BLE | Alta | Durante | Durante | RNF-01, 02, 06 | R-02, R-04, R-05 | A.8.20 | ble-beacon |
| RF-08 Malla P2P | Alta | Durante | Durante | RNF-02, 06 | R-02, R-05, R-06 | A.8.20 | mesh |
| RF-09 Sensores | Media | Durante | Durante / Alertas | — | R-03 | A.8.16 | sensors |
| RF-10 Mapa socorro | Media | Antes/Después | Mapa | RNF-01 | — | A.8.9 | maps |
| RF-11 Donaciones | Media | Después | Ayuda y Donaciones | — | — | (canales oficiales) | aid-directory |
| RF-12 Store-and-forward | Alta | Después | Después | RNF-01 | R-05 | A.8.24, A.8.13 | sync |
| RF-13 Ficha a socorristas | Alta | Durante | Modo emergencia | RNF-04 | R-01 | A.5.34, A.8.24 | medical-profile + mesh |

## Objetivos específicos ↔ RF
- Obj. 1 (documentación): este repositorio de conocimiento + docx fuente.
- Obj. 2 (desarrollo RN): RF-01…13.
- Obj. 3 (resultados/estrés): `13`.

## Pilares de propuesta de valor (Defensa Civil) ↔ RF
Prevención → RF-01/02/03 · Detección → RF-09 · Comunicación → RF-07/08 · Respuesta → RF-05/06/13 · Gestión → RF-10/11 · Sincronización → RF-12.
