# Política de Privacidad y Cero Telemetría – EarthQuakeTracker

En EarthQuakeTracker la privacidad no es un ajuste secundario, sino la piedra angular de la arquitectura del sistema:

## 1. Principio de Cero Telemetría
* La aplicación **no incluye SDKs de publicidad, rastreo comercial, analítica de comportamiento ni identificadores de dispositivo persistentes**.
* No se recopila IMEI, dirección MAC ni números de serie del terminal.

## 2. Identificadores Efímeros en la Malla
Cuando la aplicación participa en la red comunitaria o emite una baliza de socorro, utiliza identificadores aleatorios derivados mediante HMAC-SHA256 que rotan automáticamente cada 15 minutos. Esto impide que cualquier receptor cree perfiles de desplazamiento o rastree la ubicación habitual de los usuarios.

## 3. Almacenamiento Local y Claves Criptográficas
* Toda información de salud o intentos de cuestionarios reside de forma exclusiva en la memoria cifrada del terminal.
* Las claves de derivación de base de datos se generan a partir de una clave aleatoria almacenada en el hardware de seguridad del procesador (Android Keystore / iOS Keychain).
