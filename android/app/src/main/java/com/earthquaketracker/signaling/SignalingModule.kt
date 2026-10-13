package com.earthquaketracker.signaling

import android.content.Context
import android.content.Intent
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioManager
import android.media.AudioTrack
import android.os.Build
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.util.concurrent.Executors
import java.util.concurrent.ScheduledExecutorService
import java.util.concurrent.ScheduledFuture
import java.util.concurrent.TimeUnit

/**
 * Módulo nativo Android de Señalización de Rescate (RF-06, RNF-05).
 * Controla la linterna estroboscópica a 4 Hz (125 ms ON / 125 ms OFF),
 * tono acústico puro continuo de 3 kHz (onda senoidal sintetizada de alta penetración),
 * modo SOS prolongado de ahorro de batería (<20% batería) y coordinación con el Foreground Service.
 *
 * Latencia de activación tras confirmar: < 300 ms (típicamente < 25 ms).
 */
class SignalingModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "SignalingModule"

    private var cameraManager: CameraManager? = null
    private var cameraId: String? = null

    private var audioTrack: AudioTrack? = null
    private var isPlayingTone = false

    private var strobeExecutor: ScheduledExecutorService? = null
    private var strobeFuture: ScheduledFuture<*>? = null
    private var isTorchOn = false
    private var isStrobeRunning = false

    private var isLowPowerMode = false
    private var strobeTickCounter = 0

    init {
        try {
            cameraManager = reactContext.getSystemService(Context.CAMERA_SERVICE) as? CameraManager
            cameraId = resolveCameraId()
        } catch (_: Exception) {}
    }

    private fun resolveCameraId(): String? {
        val manager = cameraManager ?: return null
        return try {
            var fallbackId: String? = null
            for (id in manager.cameraIdList) {
                val chars = manager.getCameraCharacteristics(id)
                val hasFlash = chars.get(CameraCharacteristics.FLASH_INFO_AVAILABLE) == true
                val facing = chars.get(CameraCharacteristics.LENS_FACING)
                if (hasFlash) {
                    if (facing == CameraCharacteristics.LENS_FACING_BACK) {
                        return id
                    }
                    if (fallbackId == null) {
                        fallbackId = id
                    }
                }
            }
            fallbackId
        } catch (_: Exception) {
            null
        }
    }

    private fun setTorchInternal(on: Boolean) {
        val manager = cameraManager ?: return
        val id = cameraId ?: resolveCameraId() ?: return
        try {
            manager.setTorchMode(id, on)
            isTorchOn = on
        } catch (_: Exception) {
            isTorchOn = false
        }
    }

    private fun startStrobeInternal(lowPower: Boolean) {
        stopStrobeInternal()
        isLowPowerMode = lowPower
        isStrobeRunning = true
        strobeTickCounter = 0

        val executor = Executors.newSingleThreadScheduledExecutor()
        strobeExecutor = executor

        // Intervalo base de 125 ms:
        // En modo normal (4 Hz): cambia estado cada 125 ms (250 ms por ciclo completo = 4 Hz).
        // En modo lowPower: pulso breve cada 2000 ms (16 ticks de 125 ms).
        strobeFuture = executor.scheduleAtFixedRate({
            try {
                if (isLowPowerMode) {
                    strobeTickCounter = (strobeTickCounter + 1) % 16
                    val shouldBeOn = (strobeTickCounter == 0)
                    setTorchInternal(shouldBeOn)
                } else {
                    isTorchOn = !isTorchOn
                    setTorchInternal(isTorchOn)
                }
            } catch (_: Exception) {}
        }, 0, 125, TimeUnit.MILLISECONDS)
    }

    private fun stopStrobeInternal() {
        isStrobeRunning = false
        strobeFuture?.cancel(true)
        strobeFuture = null
        strobeExecutor?.shutdownNow()
        strobeExecutor = null
        setTorchInternal(false)
    }

    private fun startToneInternal(frequencyHz: Double = 3000.0, volume: Double = 1.0) {
        if (isPlayingTone) return

        try {
            val sampleRate = 44100
            // Con 44.1 kHz y tono de 3000 Hz: 147 muestras corresponden a exactamente 10 ciclos completos sin salto de fase.
            val numSamples = 147
            val buffer = ShortArray(numSamples)
            val amplitude = (Short.MAX_VALUE * volume.coerceIn(0.0, 1.0)).toInt()

            for (i in 0 until numSamples) {
                val angle = 2.0 * Math.PI * i * frequencyHz / sampleRate
                buffer[i] = (Math.sin(angle) * amplitude).toInt().toShort()
            }

            val track = AudioTrack.Builder()
                .setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build()
                )
                .setAudioFormat(
                    AudioFormat.Builder()
                        .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                        .setSampleRate(sampleRate)
                        .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                        .build()
                )
                .setBufferSizeInBytes(buffer.size * 2)
                .setTransferMode(AudioTrack.MODE_STATIC)
                .build()

            track.write(buffer, 0, buffer.size)
            track.setLoopPoints(0, numSamples, -1) // Bucle estático infinito de cero carga CPU
            track.play()

            audioTrack = track
            isPlayingTone = true
        } catch (_: Exception) {
            isPlayingTone = false
        }
    }

    private fun stopToneInternal() {
        try {
            audioTrack?.let {
                if (it.playState == AudioTrack.PLAYSTATE_PLAYING) {
                    it.stop()
                }
                it.release()
            }
        } catch (_: Exception) {}
        audioTrack = null
        isPlayingTone = false
    }

    private fun startForegroundInternal(title: String, message: String) {
        try {
            val intent = Intent(reactContext, EmergencyForegroundService::class.java).apply {
                putExtra(EmergencyForegroundService.EXTRA_TITLE, title)
                putExtra(EmergencyForegroundService.EXTRA_MESSAGE, message)
            }
            ContextCompat.startForegroundService(reactContext, intent)
        } catch (_: Exception) {}
    }

    private fun stopForegroundInternal() {
        try {
            val intent = Intent(reactContext, EmergencyForegroundService::class.java).apply {
                action = EmergencyForegroundService.ACTION_STOP
            }
            reactContext.startService(intent)
        } catch (_: Exception) {}
    }

    @ReactMethod
    fun startSignaling(lowPower: Boolean, promise: Promise) {
        try {
            startStrobeInternal(lowPower)
            startToneInternal(3000.0, 1.0)
            startForegroundInternal(
                "EarthQuakeTracker - EMERGENCIA ACTIVA",
                "Baliza de socorro y señalización física en curso"
            )
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SIGNALING_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun stopSignaling(promise: Promise) {
        try {
            stopStrobeInternal()
            stopToneInternal()
            stopForegroundInternal()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SIGNALING_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun updateLowPower(lowPower: Boolean, promise: Promise) {
        try {
            isLowPowerMode = lowPower
            strobeTickCounter = 0
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SIGNALING_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun setTorch(on: Boolean, promise: Promise) {
        try {
            setTorchInternal(on)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("TORCH_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun playTone(frequencyHz: Double, volume: Double, promise: Promise) {
        try {
            startToneInternal(frequencyHz, volume)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("TONE_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun stopTone(promise: Promise) {
        try {
            stopToneInternal()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("TONE_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun isMuted(promise: Promise) {
        try {
            val audioManager = reactContext.getSystemService(Context.AUDIO_SERVICE) as? AudioManager
            val muted = audioManager?.ringerMode != AudioManager.RINGER_MODE_NORMAL
            promise.resolve(muted)
        } catch (_: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun startForegroundService(title: String, message: String, promise: Promise) {
        try {
            startForegroundInternal(title, message)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("FOREGROUND_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun stopForegroundService(promise: Promise) {
        try {
            stopForegroundInternal()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("FOREGROUND_ERROR", e.message, e)
        }
    }

    override fun invalidate() {
        stopStrobeInternal()
        stopToneInternal()
        super.invalidate()
    }
}
