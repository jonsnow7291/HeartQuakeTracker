# 15 – Backlog de desarrollo (qué construir y en qué orden)

Orden alineado al cronograma de 16 semanas (`11`). `[ ]` pendiente. Prioridad entre paréntesis.

## E-00 Fundaciones (sem. 1–4)
- [ ] Repositorio, estructura RN + **TypeScript**, lint, formateo, convenciones
- [ ] CI/CD (build Android/iOS, tests, artefactos)
- [ ] Navegación base: Splash, Inicio, tab bar (Inicio/Mapa/Alertas/Perfil) con tema diurno/nocturno AA
- [ ] Capa de persistencia: SQLite + **SQLCipher**, migraciones, gestor de claves (Keystore/Keychain)
- [ ] Gestor de permisos (GPS, Bluetooth, notificaciones, sensores)
- [ ] Servicio de estado de red y logger
- [ ] Dossier de arquitectura y maquetas (H1)

## E-01 Educación offline (sem. 5–8) — RF-01, 02, 03
- [ ] Paquete de contenido Markdown versionado + validación de integridad (Alta)
- [ ] Lector de guías (mochila, aseguramiento, plan familiar) < 2 s (Alta)
- [ ] Actualización de contenido en segundo plano (A2)
- [ ] Motor de quiz por niveles, feedback < 1 s, reanudar progreso (Alta)
- [ ] Persistencia de puntaje, nivel e insignias; pantalla de logros (Media)
- [ ] Contenido: guías, banco de preguntas basado en protocolos oficiales, simulacros, plan familiar, kit

## E-02 Ficha médica y perfil (sem. 5–8) — RF-04
- [ ] Consentimiento Habeas Data y términos
- [ ] Formulario y almacenamiento cifrado de ficha (una por usuario) + edición (Alta)
- [ ] Contactos de emergencia en perfil; llamada directa
- [ ] Autenticación local/sesión requerida para acceder a la ficha
- [ ] Definir login/registro (hoy sin mockup; ver `16`)

## E-03 Modo emergencia (sem. 5–8) — RF-05, 06
- [ ] Botón de pánico ≤ 2 toques + selector de gravedad + cancelación 3 s (Alta)
- [ ] Máquina de estados de emergencia + pantalla de modo activo/detener
- [ ] Módulo nativo flash estroboscópico + tono continuo (fallback sin flash) (Alta)
- [ ] Alerta si el dispositivo está silenciado
- [ ] Modo "SOS Prolongado" por batería < 20 %

## E-04 Sensores y alertas (sem. 7–10) — RF-09
- [ ] Lectura acelerómetro/inclinómetro, procesamiento local < 500 ms (Media)
- [ ] Detección por umbral + filtrado de ruido; desactivar si no hay sensores
- [ ] Quórum local (≥ 3 nodos) y publicación de lectura colaborativa
- [ ] Pantalla Alertas e historial

## E-05 BLE y malla P2P (sem. 9–12) — RF-07, 08, 13
- [ ] Puente nativo BLE advertising (Android + iOS) con payload compacto (Alta)
- [ ] Foreground Service Android + modos periféricos iOS (Alta)
- [ ] Scanner + relé multihop, dedupe, TTL, prioridad por gravedad (Alta)
- [ ] Wi-Fi Direct como canal complementario
- [ ] ID efímero + firmas livianas + verificación entre pares (Alta)
- [ ] Transmisión de ficha médica comprimida a terminal autorizado < 3 s; modo socorrista (Alta)
- [ ] Fallback SMS geolocalizado (50 m / 2 min sin puente)
- [ ] Banco de pruebas con sniffer nRF52840 / Wireshark

## E-06 Mapas y ayudas (sem. 9–12) — RF-10, 11
- [ ] Generación y empaquetado de tiles offline (MBTiles) + descarga de zonas
- [ ] Mapa con POIs (albergues, acopio, bomberos, salud), detalle y ruta estimada, reportar punto
- [ ] Catálogo de entidades/canales oficiales con estado activo/inactivo
- [ ] Pantalla Ayuda y Donaciones (necesidades actuales)

## E-07 Sincronización y backend (sem. 9–12) — RF-12
- [ ] Cola local `sync_queue`, reintentos, idempotencia, ACK por ítem (Alta)
- [ ] API de ingesta masiva + colas asíncronas + PostgreSQL (Alta)
- [ ] Integración con APIs institucionales (alcance a definir)
- [ ] Panel institucional (alcance a definir)

## E-08 Calidad y cierre (sem. 13–16)
- [ ] Cobertura unitaria > 80 %
- [ ] Estrés 200 nodos; medición batería ≤ 8 %/h
- [ ] Device farm Android 10+/iOS 15+
- [ ] Auditoría de seguridad y asesoría Habeas Data (dictamen)
- [ ] Accesibilidad AA
- [ ] Encuesta final y anexo de resultados
- [ ] Publicación en App Store y Google Play; manuales

## Orden de dependencias
E-00 → (E-01, E-02, E-03 en paralelo) → E-04 → E-05 → E-06/E-07 → E-08.
Spike temprano recomendado: **BLE advertising en background iOS/Android** (mayor riesgo, R-02/R-06).
