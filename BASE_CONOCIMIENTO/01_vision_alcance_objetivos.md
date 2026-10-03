# 01 – Visión, alcance y objetivos

## Proyecto
- **Nombre:** EarthQuakeTracker (en infografías aparece como "HeartQuakeTracker"; ver `16`). Código `MW-2026`.
- **Entregable:** Producto Mínimo Viable (MVP) móvil. **Enfoque:** Offline-First (funciona sin red ni celular).
- **Duración:** 12 semanas en la propuesta de idea; **16 semanas** en la propuesta técnica-económica (vigente, ver `16`).
- **Eslogan:** "Prepara, Protégete, Actúa, Ayuda".

## Problema [FUENTE]
No hay un prototipo móvil en React Native que cubra prevención, ejecución (durante) y acciones posteriores ante un sismo: educación interactiva (antes), localización por Bluetooth (durante) y entorno colaborativo con comunicación, ayudas y donaciones (después).

## Objetivo general
App móvil integral e hiper-resiliente para gestión, prevención y respuesta ante sismos en Colombia que combine:
1. Educación lúdica (módulos interactivos, quizzes).
2. Cartografía en tiempo real de magnitud/intensidad.
3. Detección colaborativa con sensores del dispositivo.
4. Botón de pánico con ficha médica comprimida para socorristas (Policía, Bomberos, Paramédicos).
5. Localización P2P sobre red malla (mesh) tipo tracker, sin internet ni red celular.

## Objetivos específicos
1. Documentación técnica: DOFA, customer journey, buyer persona, RF/RNF, mockups, encuestas.
2. Desarrollar la app en React Native.
3. Analizar resultados con encuestas finales y pruebas de estrés sobre el prototipo.

## Las tres fases del evento sísmico
| Fase | Qué hace la app | RF principales |
| --- | --- | --- |
| **Prevención (Antes)** | Guías offline, simulacros, plan familiar, kit, zonas seguras, quizzes, logros | RF-01, 02, 03, 10 |
| **Durante** | "Agáchate, Cúbrete, Agárrate", sensores, pánico, flash+sonido, baliza BLE, malla P2P, ficha médica a rescatistas | RF-04, 05, 06, 07, 08, 09, 13 |
| **Después** | Estoy a salvo, reportar daños, solicitudes de ayuda, donaciones, puntos de ayuda, sincronización | RF-10, 11, 12 |

## Fuera de alcance / diferido [INFERIDO]
Integraciones institucionales reales profundas (API UNGRD/Defensa Civil), pagos de donaciones dentro de la app (RF-11 es solo directorio informativo), redes satelitales. El fallback SMS aparece solo como mitigación de riesgo (ver `09`).

## Cliente objetivo
Organismos de socorro: Defensa Civil Colombiana, UNGRD, ARL, sector corporativo. Modelo de negocio: SaaS + app móvil (licenciamiento, implementación, capacitación, soporte). Detalle en `02`.
