# Especificación y Textos de Permisos del Sistema – EarthQuakeTracker (S-E4 / SA-013)

Este documento contiene los textos explicativos, justificaciones técnicas y especificaciones de notificaciones para los sistemas operativos Android e iOS. Son entregados a Juan Diego para su inclusión en `AndroidManifest.xml`, `Info.plist` y la configuración nativa del servicio en segundo plano.

---

## 1. Justificaciones de Permisos por Plataforma

### A. Bluetooth y BLE (Bluetooth Low Energy)
* **Finalidad:** Permite emitir la baliza de emergencia en caso de atrapamiento y participar en la red mallada sin conexión para retransmitir mensajes de auxilio entre personas cercanas.
* **Android (API 31+):**
  * `BLUETOOTH_SCAN`: *"EarthQuakeTracker necesita buscar dispositivos cercanos para recibir reportes de auxilio y coordinar la red mallada sin conexión a internet."*
  * `BLUETOOTH_ADVERTISE`: *"Permite a tu teléfono emitir una baliza de socorro para que los equipos de rescate puedan localizarte incluso sin señal celular."*
  * `BLUETOOTH_CONNECT`: *"Requerido para compartir tu ficha médica básica de forma directa y cifrada con personal de socorro autorizado."*
* **iOS (`NSBluetoothAlwaysUsageDescription`):**
  * *"EarthQuakeTracker utiliza Bluetooth en segundo plano para emitir balizas de auxilio si quedas atrapado y comunicar mensajes de emergencia con teléfonos cercanos en zonas sin cobertura."*

### B. Ubicación Geográfica
* **Finalidad:** Adjuntar tus coordenadas geográficas al mensaje de auxilio para los rescatistas y mostrar puntos de refugio y zonas seguras en el mapa offline.
* **Android:**
  * `ACCESS_FINE_LOCATION`: *"Tu ubicación precisa se incluye en la baliza de auxilio y sirve para ubicar los albergues más cercanos en el mapa sin internet."*
  * `ACCESS_BACKGROUND_LOCATION`: *"Permite actualizar tu última posición conocida si ocurre un terremoto repentino mientras la pantalla está apagada."*
* **iOS:**
  * `NSLocationWhenInUseUsageDescription`: *"Necesario para mostrar tu posición actual en el mapa de socorro y calcular la ruta hacia la zona segura más próxima."*
  * `NSLocationAlwaysAndWhenInUseUsageDescription`: *"Permite guardar tu última coordenada geográfica para enviarla en la baliza de pánico en caso de que ocurra una emergencia con el teléfono bloqueado."*

### C. Sensores de Movimiento y Acelerómetro
* **Finalidad:** Detectar ondas sísmicas tempranas mediante el acelerómetro local y participar en el quórum de validación comunitaria.
* **Android (`HIGH_SAMPLING_RATE_SENSORS`):**
  * *"Utilizado para analizar aceleraciones bruscas compatibles con movimientos telúricos y activar la alerta de protección personal."*
* **iOS (`NSMotionUsageDescription`):**
  * *"Permite analizar vibraciones del terreno para alertarte sobre posibles sismos y colaborar en la confirmación temprana de eventos telúricos."*

### D. Flash de Cámara (Linterna)
* **Finalidad:** Emitir señales visuales de alta visibilidad (patrón estroboscópico de auxilio) en la oscuridad o bajo estructuras colapsadas.
* **Android (`CAMERA` / `FLASHLIGHT`):**
  * *"Utilizado exclusivamente para accionar la linterna como señal estroboscópica de auxilio durante una emergencia. No se capturan fotos ni videos."*
* **iOS (`NSCameraUsageDescription`):**
  * *"Requerido para encender la linterna en modo estroboscópico durante el pánico activo para facilitar tu rescate visual en la oscuridad."*

### E. Notificaciones
* **Finalidad:** Alertar de sismos inminentes o emitir recordatorios de simulacros programados.
* **Android (`POST_NOTIFICATIONS`):**
  * *"Necesario para mostrar alertas críticas de terremoto y mantener visible el estado del servicio de emergencia."*

---

## 2. Especificación de Notificación Persistente (Foreground Service en Android)

Para garantizar que el sistema Android no suspenda la red mallada BLE y la máquina de pánico en segundo plano, se requiere un **Foreground Service**.

### Objeto de Configuración (`ForegroundNotificationSpec`)
```json
{
  "channelId": "earthquake_tracker_emergency_channel",
  "channelName": "Servicio de Emergencia y Red de Socorro",
  "channelDescription": "Mantiene activa la detección sísmica y la baliza BLE sin conexión.",
  "importance": "HIGH",
  "notification": {
    "smallIcon": "ic_stat_earthquake_shield",
    "color": "#BA1A1A",
    "ongoing": true,
    "title": "EarthQuakeTracker: Protección Activa",
    "text": "Monitoreando red mallada y baliza de socorro local.",
    "actions": [
      {
        "title": "Estoy a Salvo",
        "action": "ACTION_MARK_SAFE"
      },
      {
        "title": "Abrir Pánico",
        "action": "ACTION_OPEN_PANIC"
      }
    ]
  },
  "emergencyActiveNotification": {
    "title": "EMERGENCIA ACTIVADA - Baliza Emitiendo",
    "text": "Transmitiendo señal de auxilio y baliza BLE por proximidad.",
    "color": "#BA1A1A",
    "priority": "MAX"
  }
}
```

---

## 3. Guía de Interfaz para Permisos Bloqueados (Fallback UI)

Si el usuario rechaza un permiso crítico o el sistema operativo lo bloquea permanentemente:
1. La aplicación mostrará una tarjeta informativa indicando claramente:
   * **Qué función se ve limitada** (ej: *"Sin Bluetooth no podrás emitir balizas de auxilio a socorristas cercanos"*).
   * **Botón de acción directa:** *"Abrir ajustes del sistema"* (invoca `PermissionsService.openSettings()`).
2. **Principio de no-bloqueo:** En ningún caso se impedirá al usuario consultar las guías educativas, ver el mapa guardado en caché o utilizar el pánico sonoro básico si faltan permisos de conectividad.
