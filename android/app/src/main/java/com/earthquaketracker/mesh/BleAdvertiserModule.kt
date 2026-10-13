package com.earthquaketracker.mesh

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothManager
import android.bluetooth.le.AdvertiseCallback
import android.bluetooth.le.AdvertiseData
import android.bluetooth.le.AdvertiseSettings
import android.bluetooth.le.BluetoothLeAdvertiser
import android.content.Context
import android.util.Base64
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class BleAdvertiserModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var advertiser: BluetoothLeAdvertiser? = null
    private var isAdvertising = false
    private var currentCallback: AdvertiseCallback? = null

    override fun getName(): String = "BleAdvertiser"

    private fun getAdvertiser(): BluetoothLeAdvertiser? {
        val bluetoothManager =
            reactApplicationContext.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager
        val adapter = bluetoothManager?.adapter
        if (adapter != null && adapter.isEnabled) {
            return adapter.bluetoothLeAdvertiser
        }
        return null
    }

    @ReactMethod
    fun startAdvertising(manufacturerId: Double, payloadBase64: String, promise: Promise) {
        val adv = getAdvertiser()
        if (adv == null) {
            promise.reject("BLUETOOTH_OFF", "Bluetooth está apagado o el hardware no soporta advertising BLE")
            return
        }

        try {
            val payloadBytes = Base64.decode(payloadBase64, Base64.DEFAULT)

            // Detener emisión previa si estaba activa
            if (isAdvertising && currentCallback != null) {
                try {
                    advertiser?.stopAdvertising(currentCallback)
                } catch (_: Exception) {}
                isAdvertising = false
                currentCallback = null
            }

            val settings = AdvertiseSettings.Builder()
                .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
                .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH)
                .setConnectable(true)
                .build()

            val data = AdvertiseData.Builder()
                .setIncludeDeviceName(false)
                .setIncludeTxPowerLevel(false)
                .addManufacturerData(manufacturerId.toInt(), payloadBytes)
                .build()

            val callback = object : AdvertiseCallback() {
                override fun onStartSuccess(settingsInEffect: AdvertiseSettings?) {
                    super.onStartSuccess(settingsInEffect)
                    isAdvertising = true
                    advertiser = adv
                    currentCallback = this
                    promise.resolve(true)
                }

                override fun onStartFailure(errorCode: Int) {
                    super.onStartFailure(errorCode)
                    isAdvertising = false
                    currentCallback = null
                    promise.reject("ADVERTISE_FAILED", "Fallo al iniciar advertising BLE: código $errorCode")
                }
            }

            adv.startAdvertising(settings, data, callback)
        } catch (e: Exception) {
            promise.reject("ADVERTISE_ERROR", e.localizedMessage, e)
        }
    }

    @ReactMethod
    fun stopAdvertising(promise: Promise) {
        val adv = advertiser ?: getAdvertiser()
        val cb = currentCallback

        if (adv != null && cb != null) {
            try {
                adv.stopAdvertising(cb)
            } catch (_: Exception) {}
        }

        isAdvertising = false
        currentCallback = null
        promise.resolve(true)
    }

    @ReactMethod
    fun isAdvertising(promise: Promise) {
        promise.resolve(isAdvertising)
    }
}
