package com.earthquaketracker.sensors

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * Módulo nativo Android para muestreo del acelerómetro a ~50 Hz (RF-09, D-18).
 * Utiliza SensorManager con TYPE_ACCELEROMETER y emite lecturas a JS vía DeviceEventManagerModule.
 */
class AccelerometerModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), SensorEventListener {

    private var sensorManager: SensorManager? = null
    private var accelerometer: Sensor? = null
    private var isRunning = false

    override fun getName(): String = "AccelerometerModule"

    override fun initialize() {
        super.initialize()
        sensorManager = reactContext.getSystemService(Context.SENSOR_SERVICE) as? SensorManager
        accelerometer = sensorManager?.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
    }

    override fun invalidate() {
        stopSampling()
        super.invalidate()
    }

    @ReactMethod
    fun isAvailable(promise: Promise) {
        val available = accelerometer != null
        promise.resolve(available)
    }

    @ReactMethod
    fun start(rateHz: Double, promise: Promise) {
        val sm = sensorManager
        val sensor = accelerometer

        if (sm == null || sensor == null) {
            promise.reject("NO_SENSORS", "Sensor acelerómetro no disponible en este dispositivo")
            return
        }

        if (isRunning) {
            promise.resolve(null)
            return
        }

        // Frecuencia solicitada: 50 Hz => periodo de 20,000 microsegundos (20 ms)
        val hz = if (rateHz > 0) rateHz else 50.0
        val intervalUs = (1_000_000.0 / hz).toInt()

        val registered = sm.registerListener(this, sensor, intervalUs)
        if (registered) {
            isRunning = true
            promise.resolve(null)
        } else {
            promise.reject("NO_SENSORS", "No se pudo registrar el listener del acelerómetro")
        }
    }

    @ReactMethod
    fun stop() {
        stopSampling()
    }

    private fun stopSampling() {
        if (isRunning) {
            sensorManager?.unregisterListener(this)
            isRunning = false
        }
    }

    override fun onSensorChanged(event: SensorEvent?) {
        if (event == null || event.sensor.type != Sensor.TYPE_ACCELEROMETER) return

        if (reactContext.hasActiveReactInstance()) {
            val params = Arguments.createMap().apply {
                putDouble("x", event.values[0].toDouble())
                putDouble("y", event.values[1].toDouble())
                putDouble("z", event.values[2].toDouble())
                putDouble("timestamp", System.currentTimeMillis().toDouble())
            }

            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                ?.emit("onAccelerometerData", params)
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {
        // No se requiere acción en cambios de precisión
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Requerido por NativeEventEmitter
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Requerido por NativeEventEmitter
    }
}
