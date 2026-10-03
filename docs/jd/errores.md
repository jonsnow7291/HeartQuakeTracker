# Catálogo de Códigos de Error (`ErrorCode`) – EarthQuakeTracker

Este documento está dirigido al carril de Frontend (**Santiago**) y especifica el significado técnico, los servicios emisores, la recuperabilidad y el comportamiento de UX recomendado para cada uno de los 16 códigos de error definidos en el contrato base [`src/contracts/types.ts`](file:///home/lazarus/Downloads/uni/Ing.De Software/earthquake-tracker/src/contracts/types.ts#L17-L34).

Los servicios del núcleo lanzan instancias de `AppException` que implementan `AppError`:
```ts
export interface AppError {
  code: ErrorCode;
  message: string;
  recoverable: boolean;
}
```

---

## Tabla de Mapeo de Errores

| Código (`ErrorCode`) | Significado Técnico | Servicio(s) Emisores | ¿Recuperable? | Acción de UX sugerida para el Frontend |
| :--- | :--- | :--- | :---: | :--- |
| `PERMISSION_DENIED` | Faltan permisos esenciales del sistema operativo (ubicación, Bluetooth o notificaciones) para ejecutar la función requerida. | `emergency`, `permissions`, `mesh` | **Sí** | Presentar pantalla o modal explicativo educativo indicando por qué los permisos salvan vidas en emergencias, con botón primario que llame a `permissions.openSettings()`. |
| `BLUETOOTH_OFF` | El adaptador Bluetooth del dispositivo está apagado por hardware o software en el sistema. | `emergency`, `mesh`, `rescuer` | **Sí** | Diálogo o alerta emergente solicitando encender el Bluetooth para permitir la baliza salvavidas y el intercambio de paquetes en malla. |
| `LOCATION_OFF` | Los servicios de localización (GPS) del sistema operativo están desactivados a nivel global en el dispositivo. | `emergency`, `permissions`, `poi`, `reports` | **Sí** | Diálogo modal invitando a encender el GPS del dispositivo con acceso directo a la configuración de ubicación del sistema. |
| `NO_FLASH` | El dispositivo físico no cuenta con linterna/flash de cámara posterior o el hardware no responde. | `signaling` (controlador de flash) | **No** | Inhabilitar suavemente el control de estroboscopio/linterna en la UI; mantener activos el tono audible SOS y la baliza BLE sin frenar el flujo. |
| `NO_SENSORS` | El hardware no cuenta con acelerómetro/sensores inerciales para actuar como nodo sismógrafo local. | `sensors` | **No** | Mostrar estado informativo en la pestaña Alertas: el usuario no puede muestrear aceleración local, pero sigue recibiendo alertas comunitarias vía malla. |
| `CONTENT_CORRUPT` | El archivo Markdown o paquete educativo falló la verificación criptográfica SHA-256 contra `manifest.json`. | `content` | **Sí** | Mostrar estado de error en la guía con botón "Restaurar guía original" o "Reintentar actualización", invocando `content.checkUpdates()`. |
| `CONTENT_MISSING` | La guía o recurso solicitado por su `id` no existe en el almacenamiento local ni en los activos empaquetados. | `content` | **Sí** | Mostrar pantalla de recurso no encontrado (404 local) con botón para regresar a la lista de guías disponibles. |
| `STORAGE_FAILED` | Fallo de lectura/escritura en la base de datos local cifrada (SQLCipher), almacenamiento lleno o fallo de I/O. | `medical`, `progress`, `sync` | **No / Sí** | Toast/Banner crítico: "Almacenamiento lleno o no disponible. Libera espacio en tu teléfono para no perder datos vitales". |
| `AUTH_REQUIRED` | Intento de acceder a datos sensibles protegidos (ficha médica o cuenta local) con la sesión bloqueada o sin registrar. | `session`, `medical` | **Sí** | Redirigir de inmediato a la pantalla de desbloqueo solicitando el PIN de 6 dígitos o huella/rostro biométrico. |
| `AUTH_FAILED` | El método de autenticación suministrado (PIN o biometría) no coincide con el registrado en el dispositivo. | `session` | **Sí** | Animación de rechazo (shake) en el teclado numérico de PIN, mensaje claro "PIN incorrecto" y control de intentos restantes. |
| `MAP_NOT_CACHED` | La región geográfica solicitada no tiene su paquete `.mbtiles` descargado localmente y no hay conexión a internet. | `tiles`, `poi` | **Sí** | Sustituir la vista de mapa visual por una lista textual ordenada de puntos cercanos y ofrecer el botón "Descargar mapa con conexión". |
| `NETWORK_UNAVAILABLE` | Se solicitó una acción online (sincronizar cola al servidor, descargar mapa o actualizar guías) sin red de datos/Wi-Fi. | `sync`, `tiles`, `content` | **Sí** | Mensaje no bloqueante (Snackbar/Toast): "Sin internet. Los reportes se almacenaron y se sincronizarán solos cuando vuelva la red". |
| `SYNC_PARTIAL` | Durante la sincronización con el servidor se transmitieron algunos elementos pero otros fallaron por corte de red o timeout. | `sync` | **Sí** | Mostrar badge con el número de reportes que siguen pendientes de sincronizar y botón interactivo "Sincronizar ahora". |
| `RECEIVER_NOT_AUTHORIZED` | El código de acreditación ingresado para activar el Modo Socorrista/Rescatista es incorrecto o no está autorizado. | `rescuer` | **Sí** | Marcar el campo de código en rojo con el mensaje: "Código de organismo no reconocido. Solicita un código válido a tu entidad de socorro". |
| `VALIDATION` | Los datos suministrados violan reglas de dominio (ej. PIN diferente a 6 dígitos, faltan campos médicos clave o estado erróneo). | `session`, `medical`, `emergency` | **Sí** | Resaltar visualmente los campos erróneos con mensajes inline de ayuda antes de permitir el reenvío del formulario. |
| `UNKNOWN` | Excepción imprevista o fallo no categorizado del sistema. | Cualquier servicio | **No** | Mensaje genérico amigable: "Ocurrió un error inesperado. Tus datos de emergencia siguen a salvo", permitiendo reiniciar la vista. |

---

## Directrices de Implementación para Santiago (UI)

1. **Nunca mostrar códigos de error técnicos al usuario final**: Mapear siempre `error.code` a los textos amigables localizados en `content/textos/es.json`.
2. **Propiedad `recoverable`**: Si `error.recoverable === true`, la UI **debe** presentar un botón de acción correctiva (reintentar, abrir ajustes, desbloquear con PIN, etc.). Si es `false`, la UI debe degradarse grácilmente sin bloquear el resto de la aplicación.
3. **Flujo de Pánico**: Durante las fases `CONFIRMING` y `ACTIVE` del servicio de emergencia, ningún error no fatal debe interrumpir la cuenta regresiva ni la emisión de la baliza.
