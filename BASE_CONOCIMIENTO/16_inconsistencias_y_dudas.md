# 16 – Inconsistencias entre documentos y dudas abiertas

## Contradicciones
| # | Tema | Detalle | Propuesta |
| --- | --- | --- | --- |
| 1 | Nombre | "EarthQuakeTracker" en docx; infografías (DOFA, buyer persona, journey) dicen **"HeartQuakeTracker"** | Unificar el nombre y regenerar infografías |
| 2 | Duración | Alcance: 12 semanas (3 meses). Propuesta técnica: **16 semanas (4 meses)** | Tomar 16 como vigente |
| 3 | Lenguaje | Propuesta de idea: React Native en **JavaScript**; "Lenguajes y implementación": **TypeScript** | TypeScript |
| 4 | Donaciones | RF-11 = directorio **informativo**; mockup "Ayuda y Donaciones" tiene botón **"Hacer donación"** y objetivo general menciona "gestión de donaciones" | Decidir: solo enlaces a canales oficiales o flujo propio |
| 5 | Mapas | Objetivo habla de "visualización cartográfica en tiempo real de magnitud/intensidad"; RF-10 solo cubre mapa offline de puntos de socorro | Definir si hay mapa de intensidad (requiere backend/online) |
| 6 | Mockup Durante | Dice "detección de movimiento sísmico **vía Bluetooth**"; los RF lo atribuyen a sensores inerciales (RF-09) | Aclarar: sensores detectan, Bluetooth comunica |
| 7 | Botón de pánico | Mockup "Durante" muestra "Estoy a salvo / Necesito ayuda"; RF-05 exige botón + selector Ileso/Con lesiones/Atrapado | Maquetar flujo RF-05 |
| 8 | Autoría | Propuesta de idea: 3 autores; propuesta técnica y lenguajes: 4 (+ Jheison Gómez) | Informativo |
| 9 | Estructura RF-10/11 | Tablas con una columna (formato distinto al resto) | Solo formato |
| 10 | Mesh vs servidor | Objetivo: "sin conexión ni red celular"; R-05 introduce fallback **SMS** celular/satelital | Aclarar que SMS es último recurso |

## Dudas sin respuesta en la documentación
1. **Login/registro y cuentas:** RF-04 exige sesión iniciada pero no hay RF ni mockup de autenticación, y la app debe funcionar offline.
2. **Terminal "autorizado" de socorristas (RF-13):** ¿app propia en modo socorrista, credenciales, emisión/revocación de certificados?
3. **Panel institucional / APIs de Defensa Civil y UNGRD:** el buyer persona y RF-12 los mencionan; no hay RF ni diseño.
4. **Formato exacto del paquete BLE y esquema de firmas/ID efímeros** (R-01, R-05).
5. **Umbrales sísmicos** y algoritmo de detección (RF-09); definición de "nodos adyacentes" y ventana de tiempo del quórum.
6. **Origen y mantenimiento de datos:** POIs, necesidades, entidades de donación, banco de preguntas, guías (¿quién valida el contenido y con qué protocolos oficiales?).
7. **Cartografía:** tamaño de paquetes de tiles por zona y estrategia de descarga/actualización; motor de ruta offline.
8. **iOS en segundo plano:** límites reales de advertising/scan BLE con la app en background (R-02) — requiere spike.
9. **Encuesta:** cuestionario, tamaño de muestra y criterios de análisis no definidos.
10. **Alcance post-MVP** y modelo SaaS (licenciamiento, multi-tenant) no especificados.
11. **Idioma:** se asume español (Colombia); no se menciona i18n.
12. **Fecha de los RF** y firmas de aprobación: campos vacíos en los formatos.
