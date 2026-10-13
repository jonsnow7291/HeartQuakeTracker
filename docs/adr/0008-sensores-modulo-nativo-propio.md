# ADR 0008 – Acelerómetro con módulo nativo propio

- Estado: Aceptado
- Decide: equipo del proyecto
- Fecha: 2026-10-12

## Contexto
RF-09 necesita lecturas a 50 Hz. `react-native-sensors` está abandonado: su `build.gradle` usa `jcenter()` (retirado, rompe Gradle 9) y filtra las ABI sin arm64.

## Decisión
Módulo propio: Kotlin con `SensorManager` (`TYPE_ACCELEROMETER`, 20 ms) en `com.earthquaketracker.sensors` y Swift con `CMMotionManager` en iOS, con eventos hacia JavaScript.

## Alternativas consideradas
`react-native-sensors` (descartada), `expo-sensors` (no aplica a RN bare).

## Consecuencias
Se mantiene código nativo propio. En Android está verificado (el cliente aparece en `dumpsys sensorservice` con periodo de 20 ms); la versión de iOS está escrita pero sin compilar.
