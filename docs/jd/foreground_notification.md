# Notificación Persistente del Foreground Service (Android) – EarthQuakeTracker

En situaciones de emergencia y desastre sísmico, el sistema operativo Android suspende procesos en segundo plano para ahorrar energía (Doze Mode, App Standby). Para garantizar que la **baliza BLE salvavidas**, el **relé de malla P2P** y el **rastreo de ubicación** continúen operando con la pantalla bloqueada o mientras el usuario usa otra aplicación, Juan Diego implementa un **Foreground Service nativo en Android** ([`RNF-01`](file:///home/lazarus/Downloads/uni/Ing.De%20Software/BASE_CONOCIMIENTO/07_requisitos_no_funcionales.md), [`RF-07`](file:///home/lazarus/Downloads/uni/Ing.De%20Software/BASE_CONOCIMIENTO/05_rf_ble_mesh_y_sensores.md), [`RF-08`](file:///home/lazarus/Downloads/uni/Ing.De%20Software/BASE_CONOCIMIENTO/05_rf_ble_mesh_y_sensores.md)).

Este documento define la especificación técnica (`ForegroundNotificationSpec`) que **Santiago** debe suministrar desde el diseño y los recursos del frontend.

---

## 1. Qué debe proveer Santiago

Santiago debe entregar los activos gráficos y los textos localizados (en `content/textos/es.json` y `assets/`) con la siguiente estructura:

### A. Canal de Notificación (`NotificationChannel`)
Android 8.0+ (API 26+) exige que toda notificación pertenezca a un canal explícito:

| Parámetro | Valor Propuesto / Especificación | Propósito |
| :--- | :--- | :--- |
| `channelId` | `"earthquake_emergency_active"` | Identificador único del canal en el sistema. |
| `name` | `"Modo Emergencia Sísmica"` | Nombre visible en los ajustes de notificaciones del sistema. |
| `description` | `"Notificación obligatoria para mantener activa la baliza de rescate BLE y la red comunitaria en malla."` | Explicación para el usuario si inspecciona los ajustes del sistema. |
| `importance` | `IMPORTANCE_HIGH` (Android) | Garantiza que se muestre en pantalla (aviso emergente / heads-up) y permanezca en la barra de estado. |
| `lockscreenVisibility` | `VISIBILITY_PUBLIC` | Permite que socorristas o familiares vean el estado de la emergencia sin desbloquear el teléfono. |

---

### B. Recursos Gráficos (Iconos)

1. **Icono Pequeño (`smallIcon` - Obligatorio):**
   - **Nombre de recurso:** `ic_stat_emergency`
   - **Ubicación física:** `android/app/src/main/res/drawable-*/ic_stat_emergency.png`
   - **Requisitos de diseño:** Monocromático, silueta blanca pura sobre fondo 100% transparente (resoluciones: mdpi 24x24 px, hdpi 36x36 px, xhdpi 48x48 px, xxhdpi 72x72 px, xxxhdpi 96x96 px). *Nota: Android rechaza o renderiza como un cuadrado blanco los iconos pequeños que tengan color o fondo no transparente.*
2. **Icono Grande (`largeIcon` - Opcional):**
   - Logotipo a color de EarthQuakeTracker o pictograma de la severidad seleccionada.

---

### C. Textos y Títulos Dinámicos según `EmergencyState`

La notificación debe reflejar en tiempo real el estado de la emergencia:

#### 1. Durante la fase `CONFIRMING` (Ventana de cancelación de 3 segundos):
- **Título:** `"Confirmando activación de emergencia..."`
- **Texto:** `"La baliza de rescate y la red de auxilio se activarán en breve."`
- **Acción:** Botón directo `"Cancelar"` (invoca `emergency.cancel()`).

#### 2. Durante la fase `ACTIVE` (según `severity` seleccionada):
- Si `severity === 'ILESO'`:
  - **Título:** `"Emergencia Activa: Marcado a salvo"`
  - **Texto:** `"Actuando como nodo de retransmisión para personas cercanas."`
- Si `severity === 'CON_LESIONES'`:
  - **Título:** `"Emergencia Activa: Con Lesiones"`
  - **Texto:** `"Transmitiendo señal de auxilio y ficha médica a socorristas."`
- Si `severity === 'ATRAPADO'`:
  - **Título:** `"Emergencia Activa: ATRAPADO"`
  - **Texto:** `"Baliza SOS de máxima prioridad emitiendo baliza continua."`

#### 3. Modificadores dinámicos de estado:
- **Batería baja (`lowPower === true`, batería < 20%):**
  - **Subtexto:** `"Modo bajo consumo: Baliza en intervalos espaciados para conservar batería."`
- **Sin nodos puente tras 2 minutos (`noBridge2Min === true`):**
  - **Subtexto:** `"Sin brigadistas detectados cerca. Toca para enviar SMS prellenado de auxilio."`

---

### D. Botones de Acción Rápida en la Notificación (`NotificationCompat.Action`)

Santiago debe definir los microcopies para las acciones interactivas que se muestran directamente en la bandeja de notificaciones:
1. `"Cancelar"` (visible solo en `CONFIRMING`).
2. `"Detener Emergencia"` (visible en `ACTIVE`, abre la app solicitando confirmación para invocar `emergency.stop()`).
3. `"Estoy a Salvo"` (visible en `ACTIVE` con severidad `CON_LESIONES` o `ATRAPADO`, invoca `emergency.markSafe()`).

---

## 2. Ciclo de Vida y Estados que Disparan la Notificación

El *Foreground Service* nativo se sincroniza de manera estricta con la máquina de estados de [`EmergencyState`](file:///home/lazarus/Downloads/uni/Ing.De Software/earthquake-tracker/src/contracts/emergency.ts#L6-L20) mediante `emergency.subscribe()`:

```
[IDLE] ──── selectSeverity() ────► [CONFIRMING] ──── (3 seg) ────► [ACTIVE]
  ▲                                      │                            │
  │                                cancel()                         stop()
  └──────────────────────────────────────┴────────────────────────────┘
```

| Fase (`EmergencyPhase`) | Comportamiento del Servicio Nativo | Estado de la Notificación |
| :--- | :--- | :--- |
| **`IDLE`** | El servicio está **detenido**. No consume CPU ni batería. | **Inexistente** (se descarta o cancela cualquier notificación previa). |
| **`CONFIRMING`** | Se invoca `startForegroundService()`. Se adquiere un `WakeLock` temporal y se inicia el Foreground Service. | **Visible con temporizador:** Notificación en primer plano con el botón de cancelación de 3 segundos. |
| **`ACTIVE`** | El servicio entra en ejecución continua. Se activan `BLE Advertising` nativo, `BLE Scanning` periódico y el canal de datos de la malla. | **Persistente (`isOngoing = true`):** No se puede descartar con swipe. Se actualiza dinámicamente si cambian `severity`, `lowPower` o `noBridge2Min`. |
| **`STOPPED`** | Se desactiva la baliza BLE, se apagan las señales de audio/flash y se invoca `stopForeground(true)` y `stopSelf()`. | **Removida:** La notificación se elimina automáticamente y el servicio vuelve a estado `IDLE`. |
