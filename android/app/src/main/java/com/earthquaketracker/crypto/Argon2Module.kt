package com.earthquaketracker.crypto

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableNativeMap
import com.lambdapioneer.argon2kt.Argon2Kt
import com.lambdapioneer.argon2kt.Argon2Mode
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * Módulo nativo Android para derivación rápida de claves con Argon2id (A-14).
 * Ejecuta el cálculo criptográfico fuera del hilo de JavaScript mediante corrutinas de Kotlin.
 */
class Argon2Module(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "RNArgon2"

    private val argon2Kt = Argon2Kt()
    private val scope = CoroutineScope(Dispatchers.Default)

    private fun hexToByteArray(hex: String): ByteArray {
        val len = hex.length
        val result = ByteArray(len / 2)
        for (i in 0 until len step 2) {
            val high = Character.digit(hex[i], 16)
            val low = Character.digit(hex[i + 1], 16)
            result[i / 2] = ((high shl 4) + low).toByte()
        }
        return result
    }

    @ReactMethod
    fun argon2(password: String, salt: String, config: ReadableMap, promise: Promise) {
        scope.launch {
            try {
                val passwordBytes = password.toByteArray(Charsets.UTF_8)
                val saltEncoding = if (config.hasKey("saltEncoding")) config.getString("saltEncoding") else "utf8"
                val saltBytes = if ("hex".equals(saltEncoding, ignoreCase = true)) {
                    hexToByteArray(salt)
                } else {
                    salt.toByteArray(Charsets.UTF_8)
                }

                val iterations = if (config.hasKey("iterations")) config.getInt("iterations") else 2
                val memory = if (config.hasKey("memory")) config.getInt("memory") else 16384
                val parallelism = if (config.hasKey("parallelism")) config.getInt("parallelism") else 1
                val hashLength = if (config.hasKey("hashLength")) config.getInt("hashLength") else 32

                val modeStr = if (config.hasKey("mode")) config.getString("mode") else "argon2id"
                val mode = when (modeStr) {
                    "argon2d" -> Argon2Mode.ARGON2_D
                    "argon2i" -> Argon2Mode.ARGON2_I
                    else -> Argon2Mode.ARGON2_ID
                }

                val hashResult = argon2Kt.hash(
                    mode = mode,
                    password = passwordBytes,
                    salt = saltBytes,
                    tCostInIterations = iterations,
                    mCostInKibibyte = memory,
                    parallelism = parallelism,
                    hashLengthInBytes = hashLength
                )

                val rawHash = hashResult.rawHashAsHexadecimal(false)
                val encodedHash = hashResult.encodedOutputAsString()

                val map = WritableNativeMap().apply {
                    putString("rawHash", rawHash)
                    putString("encodedHash", encodedHash)
                }
                promise.resolve(map)
            } catch (e: Exception) {
                promise.reject("ARGON2_ERROR", "Error generando hash Argon2id: ${e.message}", e)
            }
        }
    }
}
