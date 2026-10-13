package com.earthquaketracker.signaling

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import androidx.core.app.NotificationCompat

/**
 * Servicio en primer plano (Foreground Service) para modo de emergencia (RF-05, RNF-05).
 * Mantiene la app activa con CPU despierta (WakeLock) y notificación persistente en el área
 * de notificaciones y pantalla de bloqueo, permitiendo que la señalización física (luz y sonido)
 * y la baliza BLE continúen operando con la pantalla apagada.
 */
class EmergencyForegroundService : Service() {

    private var wakeLock: PowerManager.WakeLock? = null

    companion object {
        const val CHANNEL_ID = "earthquake_emergency_channel"
        const val NOTIFICATION_ID = 911
        const val ACTION_START = "com.earthquaketracker.signaling.START"
        const val ACTION_STOP = "com.earthquaketracker.signaling.STOP"
        const val EXTRA_TITLE = "extra_title"
        const val EXTRA_MESSAGE = "extra_message"
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        acquireWakeLock()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) {
            stopForegroundService()
            return START_NOT_STICKY
        }

        val title = intent?.getStringExtra(EXTRA_TITLE) ?: "EarthQuakeTracker - EMERGENCIA ACTIVA"
        val message = intent?.getStringExtra(EXTRA_MESSAGE) ?: "Baliza de socorro y señalización física en curso"

        val notification = buildNotification(title, message)

        // El tipo de servicio solo puede declarar capacidades cuyo permiso ya está concedido; de lo contrario
        // Android lanza SecurityException y mata la app en plena emergencia (RF-05 A2). Si no hay ninguno,
        // el servicio se detiene sin tumbar el proceso: flash y tono siguen funcionando en primer plano.
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                var type = 0
                if (isGranted(android.Manifest.permission.ACCESS_FINE_LOCATION) ||
                    isGranted(android.Manifest.permission.ACCESS_COARSE_LOCATION)
                ) {
                    type = type or ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    if (isGranted(android.Manifest.permission.BLUETOOTH_SCAN) ||
                        isGranted(android.Manifest.permission.BLUETOOTH_ADVERTISE) ||
                        isGranted(android.Manifest.permission.BLUETOOTH_CONNECT)
                    ) {
                        type = type or ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE
                    }
                } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    type = type or ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE
                }
                if (type == 0) {
                    android.util.Log.w("EmergencyFGS", "Sin permisos para servicio en primer plano; se omite")
                    stopSelf()
                    return START_NOT_STICKY
                }
                startForeground(NOTIFICATION_ID, notification, type)
            } else {
                startForeground(NOTIFICATION_ID, notification)
            }
        } catch (e: Exception) {
            android.util.Log.e("EmergencyFGS", "No se pudo iniciar el servicio en primer plano", e)
            stopSelf()
            return START_NOT_STICKY
        }

        return START_STICKY
    }

    private fun isGranted(permission: String): Boolean =
        androidx.core.content.ContextCompat.checkSelfPermission(this, permission) ==
            android.content.pm.PackageManager.PERMISSION_GRANTED

    private fun acquireWakeLock() {
        if (wakeLock == null) {
            val powerManager = getSystemService(Context.POWER_SERVICE) as? PowerManager
            wakeLock = powerManager?.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK,
                "EarthQuakeTracker:EmergencyWakeLock"
            )?.apply {
                setReferenceCounted(false)
                acquire(2 * 60 * 60 * 1000L) // 2 horas máximo de protección
            }
        }
    }

    private fun releaseWakeLock() {
        wakeLock?.let {
            if (it.isHeld) {
                try {
                    it.release()
                } catch (_: Exception) {}
            }
        }
        wakeLock = null
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "EarthQuakeTracker Alerta de Emergencia",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Canal de alta prioridad para la baliza de auxilio y rescate"
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
                enableVibration(true)
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            manager?.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(title: String, message: String): Notification {
        val launchIntent = packageManager.getLaunchIntentForPackage(packageName)?.apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            launchIntent,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(message)
            .setSmallIcon(android.R.drawable.stat_notify_error)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setContentIntent(pendingIntent)
            .build()
    }

    private fun stopForegroundService() {
        releaseWakeLock()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            stopForeground(STOP_FOREGROUND_REMOVE)
        } else {
            @Suppress("DEPRECATION")
            stopForeground(true)
        }
        stopSelf()
    }

    override fun onDestroy() {
        releaseWakeLock()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
