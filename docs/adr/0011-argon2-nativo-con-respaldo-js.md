# ADR 0011 – Argon2id nativo en Android con respaldo en JavaScript

- Estado: Aceptado
- Decide: equipo del proyecto
- Fecha: 2026-10-12

## Contexto
El desbloqueo con PIN tardaba hasta unos 14 s porque Argon2id corría en JavaScript sobre Hermes (fallo F-32). `react-native-argon2` usa `jcenter` y no compila con Gradle 9.

## Decisión
Módulo Kotlin propio (`com.earthquaketracker.crypto.Argon2Module`) con `argon2kt` de Maven Central, mismos parámetros (t=2, m=16 MiB, p=1, 32 bytes) fuera del hilo de JavaScript. Si falla, `NobleCryptoPort` usa la versión de JavaScript. No se redujo el costo del cifrado.

## Alternativas consideradas
Bajar el costo del KDF (rechazada: un PIN de 6 dígitos solo tiene un millón de combinaciones y la protección real es el Keystore y limitar intentos), `react-native-argon2` (no compila).

## Consecuencias
La clave derivada es idéntica en ambas rutas, por lo que las cuentas existentes abren (verificado en un teléfono con una cuenta creada antes). iOS sigue con la versión de JavaScript hasta contar con un Mac.
