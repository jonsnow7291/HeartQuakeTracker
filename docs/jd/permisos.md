# Matriz de Permisos del Sistema (`PermissionKind`) – EarthQuakeTracker

Este documento describe los permisos del sistema operativo requeridos por EarthQuakeTracker según el contrato [`src/contracts/permissions.ts`](file:///home/lazarus/Downloads/uni/Ing.De Software/earthquake-tracker/src/contracts/permissions.ts). Está estructurado para guiar a **Santiago** en la redacción de las pantallas explicativas previas (*permission rationale screens*) y los textos de solicitud en la UI.

---

## Matriz Detallada por Tipo de Permiso

### 1. `location` (Ubicación en primer plano)
- **Requisitos funcionales (RF):**
  - **RF-05:** Inclusión de coordenadas geográficas en el paquete de pánico y eventos de emergencia.
  - **RF-07:** Requerido en Android para el escaneo de periféricos BLE en versiones anteriores a Android 12.
  - **RF-10:** Cálculo de distancia hacia puntos de interés (hospitales, albergues, bomberos) en el mapa de socorro.
  - **RF-12:** Georreferenciación de reportes de daños estructurales o solicitudes de ayuda humanitaria.
- **Android (API 29 a 35 / Android 10 a 15):**
  - Permisos en `AndroidManifest.xml`:
    - `android.permission.ACCESS_FINE_LOCATION` (obligatorio para GPS preciso y escaneo BLE en API < 31).
    - `android.permission.ACCESS_COARSE_LOCATION` (ubicación aproximada por red/antenas).
  - En tiempo de ejecución: Se solicitan conjuntamente en el diálogo estándar del sistema.
- **iOS (iOS 15+):**
  - Clave en `Info.plist`: `NSLocationWhenInUseUsageDescription`.
  - Propósito: Acceso a la posición GPS mientras el usuario interactúa con el mapa o emite reportes.
- **¿Cuándo se pide?:**
  - Se solicita durante el onboarding inicial guiado o al acceder por primera vez a la pestaña de "Mapa de Socorro" o al pulsar el botón de "Pánico".

---

### 2. `bluetooth` (Bluetooth y periféricos)
- **Requisitos funcionales (RF):**
  - **RF-07:** Emisión de la baliza salvavidas de emergencia (*BLE advertising* de corto alcance).
  - **RF-08:** Red en malla peer-to-peer (P2P) para retransmisión comunitaria de paquetes de auxilio sin internet.
  - **RF-13:** Transmisión por proximidad de la ficha médica cifrada a socorristas acreditados.
- **Android (API 29 a 35 / Android 10 a 15):**
  - **Android 12+ (API 31 a 35):** Requiere permisos de tiempo de ejecución específicos:
    - `android.permission.BLUETOOTH_SCAN` (con atributo `android:usesPermissionFlags="neverForLocation"` si no se deriva ubicación del escaneo [VERIFICAR en implementación nativa]).
    - `android.permission.BLUETOOTH_ADVERTISE` (vital para emitir la baliza salvavidas).
    - `android.permission.BLUETOOTH_CONNECT` (para establecer enlace y leer servicios).
  - **Android 10 y 11 (API 29 y 30):**
    - `android.permission.BLUETOOTH` y `android.permission.BLUETOOTH_ADMIN` en `AndroidManifest.xml` (otorgados en instalación, pero el escaneo requiere `ACCESS_FINE_LOCATION` en tiempo de ejecución).
- **iOS (iOS 15+):**
  - Clave en `Info.plist`: `NSBluetoothAlwaysUsageDescription`.
  - Modos en segundo plano (`UIBackgroundModes`): `bluetooth-central` y `bluetooth-peripheral` para mantener enlace con pantalla apagada.
- **¿Cuándo se pide?:**
  - En el onboarding dentro del paso "Preparación de Emergencia" o inmediatamente antes de ingresar al flujo de Pánico.

---

### 3. `notifications` (Notificaciones del sistema)
- **Requisitos funcionales (RF):**
  - **RF-05:** Notificación persistente del *Foreground Service* de Android que evita que el sistema suspenda la app durante el modo emergencia activo.
  - **RF-09:** Difusión de alertas tempranas de sismos y avisos de simulacros programados.
  - **RNF-01 / RNF-02:** Conciencia del usuario sobre servicios en ejecución en segundo plano.
- **Android (API 29 a 35 / Android 10 a 15):**
  - **Android 13+ (API 33 a 35):** `android.permission.POST_NOTIFICATIONS` (permiso en tiempo de ejecución obligatorio).
  - **Android 10 a 12 (API 29 a 32):** Se otorga automáticamente en la instalación; se configuran canales con `NotificationChannel`.
  - Permisos de manifest adicionales para el servicio: `android.permission.FOREGROUND_SERVICE` y en Android 14+ (API 34+): `android.permission.FOREGROUND_SERVICE_CONNECTED_DEVICE` / `android.permission.FOREGROUND_SERVICE_LOCATION`.
- **iOS (iOS 15+):**
  - Solicitud de autorización vía `UNUserNotificationCenter` (`options: [.alert, .sound, .badge]`).
- **¿Cuándo se pide?:**
  - Al completar el registro de la cuenta local o al finalizar el onboarding, destacando la importancia de recibir alertas sísmicas y simulacros.

---

### 4. `motion` (Sensores inerciales / Acelerómetro)
- **Requisitos funcionales (RF):**
  - **RF-09:** Muestreo de vibraciones y aceleración sísmica local mediante acelerómetros triaxiales.
- **Android (API 29 a 35 / Android 10 a 15):**
  - En Android, los sensores inerciales estándar (`Sensor.TYPE_ACCELEROMETER`) mediante `SensorManager` **no** requieren diálogo de permiso en tiempo de ejecución.
  - En Android 12+ (API 31+): Requiere declaración de manifest `android.permission.HIGH_SAMPLING_RATE_SENSORS` si se muestrea a más de 200 Hz.
  - Si se emplean APIs de reconocimiento de actividad: `android.permission.ACTIVITY_RECOGNITION` (API 29+).
- **iOS (iOS 15+):**
  - Clave en `Info.plist`: `NSMotionUsageDescription` (obligatoria para acceder al framework `CoreMotion`).
- **¿Cuándo se pide?:**
  - Únicamente cuando el usuario decide activar la función experimental de "Nodo Sismógrafo Local" en la pestaña de Alertas o Configuración.

---

### 5. `camera_flash` (Linterna / Flash estroboscópico)
- **Requisitos funcionales (RF):**
  - **RF-06:** Linterna y flash estroboscópico intermitente (código Morse SOS / parpadeo de auxilio) para búsqueda y rescate nocturno o bajo escombros.
- **Android (API 29 a 35 / Android 10 a 15):**
  - Generalmente se controla mediante `CameraManager.setTorchMode()`.
  - Declaración en `AndroidManifest.xml`: `<uses-feature android:name="android.hardware.camera.flash" android:required="false" />`.
  - Algunos fabricantes o versiones de Android requieren `android.permission.CAMERA` en el manifest para operar el hardware de flash aunque no se capture imagen [VERIFICAR en dispositivos específicos].
- **iOS (iOS 15+):**
  - Controlado mediante `AVCaptureDevice` configurando `torchMode`.
  - No requiere prompt de usuario si no se inicia una sesión de captura de video/foto [VERIFICAR si iOS 17+ exige `NSCameraUsageDescription` al invocar `AVCaptureDevice.default`].
- **¿Cuándo se pide?:**
  - Al presionar el botón de linterna en la barra de herramientas rápida o al ingresar a la fase activa de emergencia si el usuario configuró señales luminosas.

---

### 6. `background_location` (Ubicación en segundo plano)
- **Requisitos funcionales (RF):**
  - **RF-05 / RF-07 / RF-08:** Actualización periódica de coordenadas de la baliza cuando la pantalla está bloqueada durante un evento de emergencia prolongado.
- **Android (API 29 a 35 / Android 10 a 15):**
  - Permiso en `AndroidManifest.xml`: `android.permission.ACCESS_BACKGROUND_LOCATION` (API 29+).
  - **Regla estricta de Android/Google Play:**
    1. Nunca puede solicitarse en el mismo diálogo que `ACCESS_FINE_LOCATION`.
    2. Debe requerirse de forma independiente **después** de haber obtenido el permiso en primer plano.
    3. Requiere una pantalla educativa previa (*prominent disclosure*) obligatoria que explique que la ubicación se usará con la pantalla apagada para rescate sísmico.
- **iOS (iOS 15+):**
  - Clave en `Info.plist`: `NSLocationAlwaysAndWhenInUseUsageDescription`.
  - El sistema solicita primero "Al usar la app" y posteriormente despliega un aviso ofreciendo cambiar a "Permitir siempre".
- **¿Cuándo se pide?:**
  - Durante la configuración avanzada del "Modo de Alta Preparación" o tras activar una emergencia real. **Nunca en el primer arranque de la aplicación**.

---

## Resumen de Permisos Obligatorios para Emergencia (`missingForEmergency`)

Según [`src/core/mocks/createMockServices.ts`](file:///home/lazarus/Downloads/uni/Ing.De Software/earthquake-tracker/src/core/mocks/createMockServices.ts#L54), el conjunto mínimo indispensable para operar el botón de pánico y la baliza BLE salvavidas es:

```ts
const EMERGENCY_PERMS: PermissionKind[] = ['location', 'bluetooth', 'notifications'];
```

Si alguno de estos 3 permisos no está en estado `'granted'`:
- `emergency.requestPanic()` **no lanza error**: devuelve `{ missing: PermissionKind[] }` (incluye `bluetooth` si el adaptador está apagado). La UI debe usar esa lista para guiar al usuario **antes** de mostrar el selector de gravedad.
- `emergency.selectSeverity()` lanza `PERMISSION_DENIED` (o `BLUETOOTH_OFF`) si se llama igualmente sin cumplirlos.
