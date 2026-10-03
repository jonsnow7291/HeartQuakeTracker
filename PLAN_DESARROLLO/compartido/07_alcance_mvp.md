# 07 – Alcance del MVP (MoSCoW) y criterio de "listo para demo"

Basado en `06_decisiones_semana_1.md`. M = Must (sin esto no hay MVP), S = Should (meta; se recorta si hay atraso), C = Could, W = Won't (post-MVP).

## Por requisito
| RF | Alcance MVP | Prioridad | Responsable |
| --- | --- | --- | --- |
| RF-01 Guías offline | 5 guías MD (8 meta), actualización en segundo plano | M (5) / S (+3) | JD paquete · SA lector+contenido |
| RF-02 Quiz | 3 niveles, 40 preguntas (60 meta), feedback <1 s, reanudar | M / S | SA |
| RF-03 Logros | Puntaje, nivel, 5 insignias, reset | M | JD datos · SA pantalla |
| RF-04 Ficha médica | Cifrada, un registro, PIN/biometría | M | JD · SA |
| RF-05 Pánico | ≤2 toques, gravedad, cancelar 3 s, permisos guiados | M | JD · SA |
| RF-06 Flash+tono | Estrobo + tono, fallback sin flash, aviso silencio | M | SA |
| RF-07 Baliza BLE | Paquete compacto, GPS/última coordenada+timestamp | M | JD |
| RF-08 Malla | Relé BLE, TTL 4, dedupe, prioridad | M (Android↔Android) · S (Android↔iOS en H3) | JD |
| RF-09 Sensores | Detección local + quórum vía malla; historial | S | JD · SA |
| RF-10 Mapa socorro | Bogotá, 4 tipos de POI + zonas seguras, ruta estimada, descarga de región, reportar punto | M (mapa+POIs offline) · S (ruta, reporte) | JD datos · SA render |
| RF-11 Ayudas | Catálogo oficial, necesidades, canal inactivo | S | JD · SA |
| RF-12 Sync | Cola, reintentos, idempotencia, ≤2 min | M | JD |
| RF-13 Ficha a socorrista | Modo socorrista por código, GATT, <3 s, aviso incompleta | S | JD · SA |
| SMS fallback | Prellenado tras 2 min sin puente | C | SA UI · JD detección |
| Wi-Fi Direct / Multipeer | — | W | — |
| Panel institucional | — | W | — |
| Mapa de intensidad | — | W | — |
| Pagos/donaciones en app | — | W | — |

## Por requisito no funcional
| RNF | Alcance MVP |
| --- | --- |
| RNF-01 Offline | Must: 0 crashes en modo avión en todas las pantallas |
| RNF-02 Batería | Must medir; objetivo ≤8 %/h; si no se cumple, aceptar ≤12 %/h con plan documentado |
| RNF-03 Accesibilidad | Must: ≤2 toques y contraste AA en flujo de pánico; Should: AA en toda la app |
| RNF-04 Cifrado | Must |
| RNF-05 Latencia | Must |
| RNF-06 Alcance | Must verificar 10–30 m |
| RNF-07 Compatibilidad | Android 10+ M · iOS 15+ M (funcional en foreground; background iOS best-effort documentado) |

## Pantallas MVP (orden de prioridad de construcción)
1. Splash, Inicio, tab bar · 2. Onboarding/consentimiento/cuenta/desbloqueo · 3. Permisos · 4. Ficha médica y Perfil · 5. Pánico → selector de gravedad → Emergencia activa · 6. Durante · 7. Prevención + lista y lector de guías · 8. Quiz + Logros · 9. Mapa + Puntos cercanos + Regiones · 10. Alertas · 11. Después + Reportar/Ayuda · 12. Ayuda y Donaciones · 13. Sync · 14. Modo socorrista · 15. DevScenarios (solo debug).

## Criterio de "MVP listo para demo" (Semana 16)
Escenario de demo end-to-end con 3–5 teléfonos reales (≥1 iOS, ≥2 Android):
1. Usuario A crea cuenta, llena ficha médica y descarga mapa de Bogotá (con red).
2. Se pone todo en modo avión.
3. Usuario A lee una guía y completa un quiz; mapa muestra albergues cercanos.
4. Se simula sacudida: aparece "posible sismo"; con 3 teléfonos coinciden → "confirmado".
5. Usuario A activa pánico (2 toques, gravedad **Atrapado**): flash + tono, baliza BLE.
6. Teléfonos B y C ven a A en "nodos cercanos"; el mensaje se retransmite a D (2 saltos).
7. Socorrista (modo socorrista con código) recibe la ficha de A en <3 s.
8. Se reactiva la red en un teléfono: se sincroniza todo en ≤2 min y el servidor lo registra.
Todo lo anterior grabado en video para la entrega.

## Orden de recorte si hay atraso (de lo primero a lo último en sacrificar)
1. Guías 6–8 y preguntas 41–60 → 2. Ruta estimada y reporte de POI → 3. Ayuda y Donaciones (queda estática) → 4. Quórum de sensores (solo `POSSIBLE`) → 5. Paridad iOS en background → 6. Modo socorrista UI avanzada. **No se recorta:** ficha cifrada, pánico, flash/tono, baliza+relé, sync.
