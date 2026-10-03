# 11 – Plan, cronograma, hitos y equipo

Vigente: **16 semanas (4 meses)** según la Propuesta Técnica y Económica (26-sep-2026). La propuesta de idea hablaba de 12 semanas (ver `16`).

## Fases
| Semanas | Fase | Contenido |
| --- | --- | --- |
| 01–04 | Arquitectura y diseño | Arquitectura, UI/UX en Affinity, configuración de repositorios, CI/CD |
| 05–08 | Core offline | Ficha cifrada, guías Markdown, sensores, UI de crisis, SQLCipher |
| 09–12 | Mesh y mapas | Motor BLE Mesh P2P, servicios en segundo plano, cartografía, store-and-forward |
| 13–16 | Cierre | Pruebas de estrés (200 nodos), auditoría de seguridad, despliegue en tiendas |

## Hitos
| Hito | Sem. | Criterio |
| --- | --- | --- |
| H1 | 4 | Dossier de arquitectura aprobado, maquetas funcionales exportadas, CI/CD configurado |
| H2 | 8 | Módulos preventivos funcionales, SQLCipher operativo, UI de crisis integrada |
| H3 | 12 | Enlace BLE Mesh entre Android/iOS operativo; sync store-and-forward en pruebas |
| H4 | 16 | Cobertura unitaria > 80 %, estrés de red superado, binarios subidos a tiendas |

## Equipo y roles (presupuestados)
| Rol | Responsabilidad | Dedicación |
| --- | --- | --- |
| Lead Mobile Developer | Módulos nativos BLE, foreground services, bypass Doze/iOS, cifrado AES-256 | 100 % × 4 meses |
| Backend Developer | APIs de ingesta masiva, colas store-and-forward, BD relacional | 100 % × 4 meses |
| Consultor UI/UX | UI de crisis ≤ 2 toques, paletas WCAG AA diurno/nocturno (Affinity) | Bolsa de 45 h |
| QA & Hardware Tester | Pruebas de estrés offline, simulación de nodos, latencia, batería | 50 % (meses 3–4) |

Nota de la propuesta: asistentes de código con IA sustituyen a un segundo desarrollador móvil y cubren pruebas unitarias (> 80 %) y guías Markdown.

Equipo académico: Jheison Sebastián Gómez Sandoval, Juan Diego Chaparro Vargas, Santiago González Gamboa, Juan Camilo Nonzoque Torres.

## Facturación por hitos
Anticipo 30 % (acta de inicio, arquitectura aprobada) · Hito 1 30 % (UI completa, Markdown, ficha cifrada; sem. 8) · Hito 2 25 % (malla BLE + servidor store-and-forward; sem. 12) · Cierre 15 % (estrés >200 nodos, manuales, dictamen legal, tiendas; sem. 16). Montos en `12`.

## Dependencias críticas
1. Laboratorio de hardware (6–8 teléfonos + sniffer nRF52840) antes de iniciar BLE Mesh (sem. 9).
2. Diseño UI cerrado (H1) antes de módulos core.
3. Backend de ingesta listo antes de probar RF-12 (sem. 12).
4. Asesoría Habeas Data antes de publicar ficha médica (cierre).
5. Contingencia (23,3 % del presupuesto) ante cambios de políticas de batería Android 15 / iOS 18.
