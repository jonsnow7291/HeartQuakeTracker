package com.earthquaketracker.signaling

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * Módulo nativo Android para monitoreo del nivel de batería y estado de carga (PowerService real).
 * Proporciona el nivel exacto de batería y emite eventos en tiempo real cuando el porcentaje cambia
 * o se conecta/desconecta el cargador. Permite la activación del modo SOS Prolongado (<20%).
 */
class PowerModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var receiver: BroadcastReceiver? = null

    override fun getName(): String = "PowerModule"

    override fun initialize() {
        super.initialize()
        registerBatteryReceiver()
    }

    override fun invalidate() {
        unregisterBatteryReceiver()
        super.invalidate()
    }

    private fun registerBatteryReceiver() {
        if (receiver != null) return

        receiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                if (intent?.action == Intent.ACTION_BATTERY_CHANGED) {
                    val status = getBatteryFromIntent(intent)
                    sendBatteryEvent(status.first, status.second)
                }
            }
        }

        val filter = IntentFilter(Intent.ACTION_BATTERY_CHANGED)
        try {
            reactContext.registerReceiver(receiver, filter)
        } catch (_: Exception) {}
    }

    private fun unregisterBatteryReceiver() {
        receiver?.let {
            try {
                reactContext.unregisterReceiver(it)
            } catch (_: Exception) {}
            receiver = null
        }
    }

    private fun getBatteryFromIntent(intent: Intent?): Pair<Int, Boolean> {
        if (intent == null) return Pair(100, false)
        val level = intent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1)
        val scale = intent.getIntExtra(BatteryManager.EXTRA_SCALE, -1)
        val status = intent.getIntExtra(BatteryManager.EXTRA_STATUS, -1)

        val percentage = if (level >= 0 && scale > 0) {
            (level * 100) / scale
        } else {
            100
        }

        val isCharging = status == BatteryManager.BATTERY_STATUS_CHARGING ||
                status == BatteryManager.BATTERY_STATUS_FULL

        return Pair(percentage, isCharging)
    }

    private fun sendBatteryEvent(level: Int, charging: Boolean) {
        if (reactContext.hasActiveReactInstance()) {
            val params = Arguments.createMap().apply {
                putInt("level", level)
                putBoolean("charging", charging)
            }
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                ?.emit("onBatteryChanged", params)
        }
    }

    @ReactMethod
    fun getBatteryStatus(promise: Promise) {
        try {
            val intent = reactContext.registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
            val (level, charging) = getBatteryFromIntent(intent)
            val result = Arguments.createMap().apply {
                putInt("level", level)
                putBoolean("charging", charging)
            }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("POWER_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Necesario para NativeEventEmitter en React Native
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Necesario para NativeEventEmitter en React Native
    }
}
