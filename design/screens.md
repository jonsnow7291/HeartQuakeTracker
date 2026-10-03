# Catálogo de Pantallas y Estados – EarthQuakeTracker (S-E3 / SA-003)

Este catálogo documenta de manera exhaustiva cada pantalla del sistema, sus dependencias con los contratos de `src/contracts/`, las acciones que puede realizar el usuario y los estados visuales que deben soportarse.

---

### 1. `/splash` (Pantalla de Carga y Enrutamiento Inicial)
* **Contrato:** `SessionService.hasAccount()`
* **Datos requeridos:** Estado de existencia de cuenta local.
* **Acciones:** Redirección automática a `/onboarding` si no existe cuenta, o a `/home` si ya existe.
* **Estados:**
  * *Carga:* Logo centrado de EarthQuakeTracker con spinner accesible.
  * *Error:* Mensaje "No se pudo iniciar la sesión local" con botón "Reintentar".

---

### 2. `/onboarding` (Bienvenida y Consentimiento Habeas Data)
* **Contratos:** `SessionService.createLocalAccount()`
* **Datos requeridos:** Texto de Términos y Consentimiento Legal (`content/legal/consentimiento.md`).
* **Acciones:**
  * Leer y marcar checkbox obligatorio de consentimiento Habeas Data (Ley 1581 de Colombia).
  * Ingresar Nombre para mostrar.
  * Definir PIN local de 6 dígitos con confirmación.
  * Omitir / Activar biometría si el hardware lo soporta.
  * Botón "Comenzar a usar EarthQuakeTracker".
* **Estados:**
  * *Normal:* Formulario paso a paso (Stepper).
  * *Validación:* PIN no coincide, PIN menor a 6 dígitos o casilla legal no marcada (`VALIDATION`).

---

### 3. `/home` (Pantalla de Inicio y Botón de Pánico)
* **Contratos:** `EmergencyService.subscribe()`, `SyncService.subscribe()`, `PowerService.subscribe()`, `AlertsService.subscribeNew()`.
* **Datos requeridos:** Estado de emergencia actual (`EmergencyState`), nivel de batería (`PowerService.getLevel()`), estado de sincronización (`SyncStatus`).
* **Acciones:**
  * Pulsar **PanicButton** (toque 1 para abrir `/panic`).
  * Acceso directo a módulos: "Antes" (Prevención), "Durante" (Guía de acción inmediata), "Después" (Puntos de ayuda y reporte).
  * Consultar estado de sincronización y batería.
* **Estados:**
  * *Normal:* Botón de pánico rojo gigante centrado con halo suave, indicador superior con píldoras de estado (`StatusPill`).
  * *Emergencia Activa:* Banner flotante permanente advirtiendo "EMERGENCIA EN CURSO" con botón para volver a `/emergency`.
  * *Alerta Sísmica Reciente:* Banner superior de alta prioridad si se detectó sismo en los últimos 5 minutos.
  * *Batería Baja (< 20 %):* Icono de ahorro de energía activo.

---

### 4. `/panic` (Selector Rápido de Gravedad y Cancelación)
* **Contratos:** `EmergencyService.requestPanic()`, `EmergencyService.selectSeverity()`, `EmergencyService.cancel()`.
* **Datos requeridos:** Permisos faltantes (`missingForEmergency()`), temporizador de 3 segundos (`cancelDeadline`).
* **Acciones:**
  * Toque 2: Seleccionar una de las 3 opciones de gravedad:
    1. **ILESO** (Verde / Neutro: No requiero rescate físico pero aviso mi estado).
    2. **CON LESIONES** (Amarillo: Requiero primeros auxilios o asistencia médica).
    3. **ATRAPADO** (Rojo de máxima prioridad: Bloqueado por escombros, rescate urgente).
  * Botón de cancelación de 3 segundos con barra de progreso regresiva (`Countdown`).
* **Estados:**
  * *Selección:* 3 tarjetas táctiles de gran tamaño (área táctil > 64 dp).
  * *Confirmando (3 s):* Cuenta regresiva audible/vibratoria con botón "Cancelar pánico accidental".
  * *Permisos Faltantes:* Diálogo guiado si faltan Bluetooth o Ubicación antes de transmitir baliza.

---

### 5. `/emergency` (Modo Emergencia Activo)
* **Contratos:** `EmergencyService`, `MeshService.subscribeStatus()`, `MeshService.subscribeNearby()`, `PowerService`.
* **Datos requeridos:** Cantidad de nodos en rango, baliza BLE emitiendo (`beaconActive`), estado de batería (`lowPower`).
* **Acciones:**
  * Cambiar nivel de gravedad si la situación empeora.
  * Activar/desactivar flash o tono manualmente si la situación lo exige.
  * Botón "Detener Emergencia" (requiere confirmación de 2 pasos para evitar toques accidentales).
  * Enviar "SMS Fallback" si han transcurrido más de 2 minutos sin conexión a nodos de la malla.
* **Estados:**
  * *Activo Normal:* Linterna estroboscópica a 4 Hz y tono acústico a 3 kHz emitiendo.
  * *Bajo Consumo (`lowPower`):* Ráfagas espaciadas cada 30 segundos, advertencia visual en pantalla.
  * *Sin Permiso de Flash:* Notificación informativa indicando que solo se emitirá baliza BLE y tono audible (`NO_FLASH`).

---

### 6. `/guides` (Directorio de Guías Educativas Offline)
* **Contratos:** `ContentService.listGuides()`.
* **Datos requeridos:** Lista de metadatos (`GuideMeta[]`: id, título, categoría, tiempo de lectura).
* **Acciones:**
  * Filtrar por categoría: Mochila, Estructural, Plan Familiar, Primeros Auxilios.
  * Seleccionar guía para abrir `/guides/:id`.
* **Estados:**
  * *Carga:* Esqueletos de tarjeta de contenido.
  * *Éxito:* Lista virtualizada con tiempo de lectura estimado.
  * *Vacío:* Ilustración indicando que no hay guías descargadas.
  * *Corrupto:* Mensaje `CONTENT_CORRUPT` con botón de restauración del paquete base.

---

### 7. `/guides/:id` (Lector Markdown de Guía)
* **Contratos:** `ContentService.getGuideMarkdown(id)`, `ContentService.checkUpdates()`.
* **Datos requeridos:** Markdown estructurado con encabezados, listas y llamadas a protocolos oficiales.
* **Acciones:**
  * Lectura fluida sin conexión.
  * Navegar a checklist relacionado (p. ej. `/kit` o `/plan`).
  * Volver a la lista.
* **Estados:**
  * *Carga:* Spinner accesible con tiempo < 2 s.
  * *Lectura:* Tipografía legible con contraste AA y espaciado de renglón amplio.
  * *Actualización en segundo plano:* Banner discreto "Nueva versión de esta guía disponible".

---

### 8. `/quiz` y `/quiz/:levelId` (Evaluación y Gamificación)
* **Contratos:** `ContentService.getQuizBank()`, `ProgressRepository.getLevelStatus()`, `ProgressRepository.saveAttempt()`, `ProgressRepository.getPartial()`.
* **Datos requeridos:** Banco de preguntas validadas por nivel (Básico, Intermedio, Avanzado).
* **Acciones:**
  * Seleccionar nivel (desbloqueado si el anterior tuvo ≥ 70 % de aciertos).
  * Responder preguntas de selección múltiple (A, B, C, D).
  * Feedback visual y auditivo inmediato (< 1 s).
  * Opción de suspender y reanudar intento parcial.
* **Estados:**
  * *Bloqueado:* Candado con mensaje "Completa el nivel anterior con al menos 70 %".
  * *En curso:* Barra de progreso, pregunta actual y alternativas táctiles.
  * *Feedback Inmediato:* Tarjeta verde (Correcto) o roja con explicación oficial (`explanation`) y enlace de repaso (`guideId`).
  * *Finalizado:* Pantalla de puntaje total e insignias ganadas.

---

### 9. `/map` (Mapa de Socorro de Bogotá Offline)
* **Contratos:** `PoiService.listInBounds()`, `PoiService.nearest()`, `TileService.getLocalTilesPath()`, `EmergencyService.getState()`.
* **Datos requeridos:** Archivo `.mbtiles` local de la región Bogotá, puntos de socorro categorizados (Albergues, Acopio, Bomberos, Salud, Zonas Seguras).
* **Acciones:**
  * Filtrar por tipo de punto de interés.
  * Consultar lista "Puntos cercanos" con cálculo de distancia métrica y brújula.
  * Tocar un marcador para abrir la ficha de detalle (Nombre, Dirección, Teléfono, Estado activo).
  * "Cómo llegar": Traza de línea directa y rumbo estimado sin red.
  * "Reportar problema con este punto" (`PoiService.reportProblem`).
* **Estados:**
  * *Sin mapa cacheado:* `EmptyState` indicando "Mapa no descargado" con botón para ir a `/map/regions` (`MAP_NOT_CACHED`).
  * *Visualización Normal:* Renderizado vectorial fluido a 60 fps con MapLibre.
  * *Sin GPS:* Indicador pidiendo activar ubicación o seleccionar punto manualmente en el mapa.

---

### 10. `/alerts` (Centro de Alertas Sísmicas e Historial)
* **Contratos:** `AlertsService.list()`, `AlertsService.subscribeNew()`, `SensorService.isAvailable()`.
* **Datos requeridos:** Alertas recientes (`POSSIBLE`, `CONFIRMED`, `DISCARDED`), aceleración pico (g), quórum de nodos.
* **Acciones:**
  * Visualizar eventos sísmicos recientes.
  * Agendar simulacro familiar o comunitario (`scheduleDrill`).
  * Descartar falsas alarmas locales.
* **Estados:**
  * *Sin Sensores:* Mensaje informativo "Este dispositivo no cuenta con acelerómetro compatible" (`NO_SENSORS`).
  * *Alerta en curso:* Banner intermitente con instrucciones de protección personal inmediata.

---

### 11. `/medical` (Ficha Médica Protegida)
* **Contratos:** `MedicalProfileService.get()`, `MedicalProfileService.save()`, `SessionService.isUnlocked()`.
* **Datos requeridos:** Grupo sanguíneo, alergias, enfermedades preexistentes, medicamentos, contactos SOS.
* **Acciones:**
  * Visualizar datos en formato credencial médica.
  * Editar información con validación de obligatorios.
  * Agregar hasta 3 contactos de emergencia con opción de llamada directa.
* **Estados:**
  * *Bloqueado:* Diálogo de autenticación PIN / Biometría antes de mostrar datos confidenciales (`AUTH_REQUIRED`).
  * *Vacío:* Asistente de configuración paso a paso.
  * *Guardado exitoso:* Notificación accesible "Ficha médica cifrada en almacenamiento seguro".

---

### 12. `/sync` (Panel de Sincronización Store-and-Forward)
* **Contratos:** `SyncService.getStatus()`, `SyncService.syncNow()`, `ReportService.listOwnReports()`.
* **Datos requeridos:** Número de eventos en cola local (`pending`), estado de red (`online`), fecha de última sincronización.
* **Acciones:**
  * Ver cola de reportes de daños, solicitudes y "Estoy a salvo".
  * Botón manual "Sincronizar ahora".
* **Estados:**
  * *Offline:* Icono gris "Sin red disponible. Los reportes se enviarán automáticamente al detectar conexión".
  * *Sincronizando:* Spinner de progreso con cuenta regresiva.
  * *Sincronización Parcial:* Advertencia si algunos registros quedaron pendientes por timeout (`SYNC_PARTIAL`).

---

### 13. `/rescuer` (Modo Socorrista Institucional)
* **Contratos:** `RescuerService.enable()`, `RescuerService.subscribeReceived()`, `RescuerService.listReceived()`.
* **Datos requeridos:** Código oficial de acreditación, lista de fichas médicas recibidas vía GATT.
* **Acciones:**
  * Ingresar código de socorrista (validación criptográfica offline contra firma del paquete de datos).
  * Ver tarjetas de personas atrapadas o lesionadas en un radio de 30 metros.
  * Inspeccionar ficha médica de urgencia.
* **Estados:**
  * *No Autorizado:* Mensaje de error al ingresar código erróneo (`RECEIVER_NOT_AUTHORIZED`).
  * *Monitoreo Activo:* Radar visual de personas cercanas transmitiendo baliza de socorro.
  * *Ficha Incompleta / Firma Inválida:* Alerta amarilla en la ficha recibida advirtiendo que los datos podrían estar truncados o no verificados.

---

### 14. `/dev` (Panel de Depuración DevScenarios)
* **Contratos:** `DevScenarioController.list()`, `DevScenarioController.activate()`, `DevScenarioController.reset()`.
* **Datos requeridos:** Catálogo de escenarios provistos por los mocks de Juan Diego.
* **Acciones:**
  * Activar escenarios unitarios: `sismo_detectado`, `mesh_5_nodos`, `bluetooth_apagado`, `permisos_denegados`, `contenido_corrupto`, `sync_parcial`, `socorrista_recibe_ficha`, `bateria_15`, `sin_sensores`, `sin_mapa_cacheado`, `offline_total`.
  * Restablecer mocks al estado inicial.
* **Estados:**
  * Lista interactiva con chips de estado activo/inactivo para validar cada comportamiento de la UI sin necesidad de hardware físico.
