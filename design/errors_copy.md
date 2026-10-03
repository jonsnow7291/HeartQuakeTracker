# Mapeo de Errores a Textos de Usuario – EarthQuakeTracker (S-E6 / SA-022)

Este catálogo define la traducción del 100 % de los códigos de error (`ErrorCode`) del sistema a un lenguaje comprensible, empático y orientado a la acción inmediata.

| ErrorCode | Título en Pantalla | Mensaje Explicativo al Usuario | Acción de Recuperación (CTA) | ¿Recuperable? |
| --- | --- | --- | --- | --- |
| `PERMISSION_DENIED` | Permiso requerido no otorgado | La aplicación necesita este permiso para poder emitir señales de auxilio o ubicarte en el mapa. | Abrir configuración del sistema | Sí (`openSettings`) |
| `BLUETOOTH_OFF` | Bluetooth desactivado | Para buscar personas cercanas o emitir tu baliza de auxilio debes activar el Bluetooth de tu teléfono. | Activar Bluetooth | Sí |
| `LOCATION_OFF` | Ubicación desactivada | Tu teléfono no puede determinar tus coordenadas geográficas para adjuntarlas a la alerta de rescate. | Activar ubicación (GPS) | Sí |
| `NO_FLASH` | Linterna no disponible | Tu dispositivo no cuenta con flash de cámara o la linterna está siendo usada por otra aplicación. | Continuar solo con señal acústica | Sí (Degradación elegante) |
| `NO_SENSORS` | Sensores de movimiento no detectados | Tu dispositivo no cuenta con acelerómetro compatible para la detección temprana de ondas sísmicas. | Usar modo de alerta comunitaria | Sí (Informativo) |
| `CONTENT_CORRUPT` | Error en paquete educativo | Los archivos de las guías sufrieron un error de integridad y no pueden leerse correctamente. | Restaurar guías originales | Sí (`reinstallDefaults`) |
| `CONTENT_MISSING` | Guía o contenido no encontrado | La guía seleccionada no se encuentra almacenada en la memoria del dispositivo. | Volver a la lista de guías | Sí |
| `STORAGE_FAILED` | Error de almacenamiento seguro | No se pudo guardar la información en la base de datos cifrada del teléfono. Verifica el espacio libre. | Liberar espacio y reintentar | Sí |
| `AUTH_REQUIRED` | Desbloqueo requerido | La ficha médica contiene datos sensibles protegidos. Debes ingresar tu PIN o usar tu huella para acceder. | Desbloquear con PIN o huella | Sí (`unlock`) |
| `AUTH_FAILED` | PIN incorrecto | El PIN ingresado no coincide con el registrado en tu dispositivo. Inténtalo nuevamente. | Reintentar ingreso de PIN | Sí |
| `MAP_NOT_CACHED` | Mapa de Bogotá no descargado | No tienes guardado el paquete de mapas vectoriales para navegar sin internet en esta zona. | Descargar mapa de Bogotá | Sí (`downloadRegion`) |
| `NETWORK_UNAVAILABLE` | Sin conexión a internet | No hay conexión celular ni Wi-Fi. La aplicación continuará funcionando en modo offline y guardará tus reportes. | Entendido, usar offline | Sí (Comportamiento esperado) |
| `SYNC_PARTIAL` | Sincronización incompleta | Algunos reportes se enviaron con éxito, pero otros quedaron en cola debido a la debilidad de la señal. | Reintentar sincronización | Sí (`syncNow`) |
| `RECEIVER_NOT_AUTHORIZED` | Código de socorrista no válido | El código ingresado no corresponde a ningún organismo de socorro acreditado o ha expirado. | Verificar código oficial | Sí |
| `VALIDATION` | Datos incompletos | Por favor completa todos los campos requeridos marcados antes de continuar. | Revisar campos del formulario | Sí |
| `UNKNOWN` | Error imprevisto | Ocurrió un error inesperado al procesar la operación. No se perdieron datos locales. | Reintentar acción | Sí |
