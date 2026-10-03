# 10 – UI, mockups y pantallas

Identidad visual (mockups): paleta crema/marrón/ámbar con acentos verde (prevención), naranja (durante), azul (después); barra inferior de 4 pestañas **Inicio · Mapa · Alertas · Perfil**. Accesibilidad: WCAG 2.1 AA, modo diurno/nocturno, UI de crisis ≤ 2 toques.

## Navegación
Splash → Inicio → { Prevención | Durante | Después } ; Tab bar global: Inicio, Mapa, Alertas, Perfil. Ayuda y Donaciones se abre desde Después.

## Pantallas (9 + splash)
| N° | Pantalla | Contenido | RF |
| --- | --- | --- | --- |
| 1 | **Splash** | Logo, ciclo Prevención–Durante–Después, eslogan "Prepara, Protégete, Actúa, Ayuda" | — |
| 2 | **Inicio** | "¡Bienvenido! ¿En qué podemos ayudarte hoy?" + 3 accesos: Prevención, Durante, Después; campana de notificaciones | — |
| 3 | **Prevención** | Guías educativas, Simulacros, Plan familiar, Kit de emergencia, Zonas seguras | 01, 02, 03, 10 |
| 4 | **Durante** | Instrucciones **Agáchate, Cúbrete, Agárrate** (ilustraciones); "Detectamos movimiento sísmico"; estado de conexión Bluetooth ("Conectado"); botones **Estoy a salvo** / **Necesito ayuda** | 05, 07, 08, 09 |
| 5 | **Después** | Estoy a salvo (informa a contactos), Reportar daños, Ver solicitudes de ayuda, Donaciones, Puntos de ayuda | 10, 11, 12 |
| 6 | **Mapa** | Mapa con zonas seguras, albergues, centros de acopio; panel "Puntos cercanos" con contadores y botón **Cómo llegar**; filtro | 10 |
| 7 | **Alertas** | Alerta sísmica activa (posible sismo, intensidad estimada), historial (sismo detectado, simulacro programado, información/recomendaciones) | 09 |
| 8 | **Ayuda y Donaciones** | "Tu ayuda hace la diferencia", botón Hacer donación, necesidades actuales (alimentos no perecederos, agua potable, medicamentos, ropa y cobijas, artículos de higiene) | 11 |
| 9 | **Mi perfil** | Usuario, correo, **contactos de emergencia** (con llamada directa), Configuración, Términos y condiciones, Acerca de la app | 04 |

## Pantallas implícitas no maquetadas [INFERIDO]
- **Botón de pánico + selector de gravedad** (Ileso / Con lesiones / Atrapado) con cancelación 3 s — RF-05 (el mockup "Durante" solo muestra "Necesito ayuda").
- **Modo emergencia activo** (estado de flash/tono/baliza, botón detener, indicador de batería/SOS prolongado) — RF-06/07.
- **Ficha médica** (formulario y consentimiento) — RF-04.
- **Quiz** (niveles, pregunta, retroalimentación, resultado, insignias) — RF-02/03.
- **Lector de guía Markdown** — RF-01.
- **Modo socorrista / recepción de ficha** — RF-13.
- **Descarga de mapas/paquetes** y **ajustes de permisos** — RF-01, 10.
- **Login/registro** (RF-04 pide sesión iniciada) — sin mockup; ver `16`.

## Reglas de UI
- Acciones críticas ≤ 2 toques, alto contraste, tipografía grande; respuesta < 300 ms.
- Mensajes de error claros para permisos (GPS/BT), contenido corrupto, mapas no cacheados.
- Indicadores permanentes de estado offline/online y de sincronización pendiente [INFERIDO].
