# 06 – RF de mapas, donaciones y sincronización (RF-10, RF-11, RF-12)

## RF-10 – Directorio cartográfico de puntos de socorro  (Media)
- **ISO:** A.8.9 Gestión de la configuración. **Actor:** Ciudadano.
- **Descripción:** mapa interactivo con **albergues, centros de acopio, estaciones de bomberos y centros de salud** usando capas vectoriales **cacheadas** en el dispositivo.
- **Precondición:** mapa vectorial de la zona descargado/cacheado.
- **Flujo:** 1) entra al directorio → 2) carga capas cacheadas → 3) despliega mapa con puntos → 4) selecciona un punto → 5) ve detalle y **ruta estimada**.
- **Alternos:** A1 sin mapas cacheados → informar y sugerir descargar con conexión. A2 punto no disponible → permitir **reportarlo** para actualización.
- **Aceptación:** mapa y puntos en **< 2 s** solo con datos cacheados.
- **Notas [INFERIDO]:** tiles offline MBTiles/vectoriales (OpenStreetMap, OpenMapTiles/Protomaps; ver `12`); dataset de puntos de interés local versionado; ruta estimada simple (línea/ruteo básico offline) dado que no hay ruteo online.

## RF-11 – Directorio informativo de ayudas y donaciones  (Media)
- **ISO:** sin control directo; validar canales oficiales. **Actor:** Ciudadano.
- **Descripción:** catálogo de requisitos, canales y entidades **autorizadas** (Defensa Civil, UNGRD, ONGs) para donaciones y transferencias. **Es informativo**, no procesa pagos.
- **Precondición:** catálogo precargado.
- **Flujo:** 1) módulo ayudas/donaciones → 2) lista de entidades autorizadas → 3) elige entidad/canal → 4) ve requisitos y medios oficiales.
- **Alternos:** A1 canal vigente→inactivo → marcar **inactivo** hasta verificación. A2 requiere ayuda inmediata → redirigir al directorio cartográfico (RF-10).
- **Aceptación:** solo entidades/canales **validados como oficiales**.
- **Mockup:** pantalla "Ayuda y Donaciones": necesidades actuales (alimentos no perecederos, agua potable, medicamentos, ropa y cobijas, artículos de higiene) y botón "Hacer donación" (ver `10`). Tensión con "solo informativo" → `16`.
- **Datos [INFERIDO]:** `entidad(id, nombre, tipo, activa, verificada_en)`, `canal(id, entidad_id, tipo, valor, requisitos, activo)`, `necesidad(id, categoria, urgencia)`.

## RF-12 – Sincronización diferida / store-and-forward  (Alta)
- **ISO:** A.8.24 Criptografía / A.8.13 Copias de seguridad. **Actor:** Ciudadano.
- **Descripción:** encolar reportes de estado, lecturas de sensores y cambios de posición generados offline y enviarlos automáticamente al **servidor central y APIs institucionales** al restablecerse la red (Wi-Fi o datos).
- **Precondición:** hay reportes pendientes offline.
- **Flujo:** 1) genera reportes offline → 2) los encola en cola local → 3) detecta red → 4) transmite al servidor y APIs → 5) elimina de la cola los confirmados.
- **Alternos:** A1 sync parcial → conserva solo los no confirmados. A2 conexión cae durante el envío → reintenta al volver la red.
- **Aceptación:** sincroniza **100 %** de lo encolado en **≤ 2 min** tras restablecerse la conexión.
- **Diseño [INFERIDO]:**
  - Tabla `sync_queue(id, tipo, payload_cifrado, creado_en, intentos, estado)`; envío por lotes con **idempotencia** (UUID del evento) y ACK por ítem.
  - Reintento con backoff exponencial; detección de conectividad con listener de red.
  - Backend: API de ingesta masiva, colas asíncronas, PostgreSQL (ver `08`).
  - Payload cifrado en tránsito (TLS) y datos sensibles cifrados en reposo.
