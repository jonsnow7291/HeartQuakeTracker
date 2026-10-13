# ADR 0007 – Cripto con @noble en lugar de libsodium nativo (modifica D-17)

- Estado: Aceptado
- Decide: equipo del proyecto
- Fecha: 2026-10-12

## Contexto
Se necesitan Ed25519, X25519, XChaCha20-Poly1305, AES-GCM, HMAC-SHA256 y Argon2id (ADR 0001 y 0005). D-17 proponía libsodium; las librerías de libsodium para React Native 0.87 dependen de módulos nativos con riesgo de compilación y no se pudieron validar en dispositivo.

## Decisión
Se usa **@noble/curves, @noble/ciphers y @noble/hashes** (JavaScript puro, auditadas). Los algoritmos y parámetros son los mismos que fijaba D-17. Argon2id corre además en un módulo nativo propio en Android (ADR 0011). Hermes no trae `crypto.getRandomValues`: se añade `react-native-get-random-values` en la primera línea de `index.js`.

## Alternativas consideradas
libsodium nativo (rechazada por riesgo de compilación); `node:crypto` con respaldo (rechazada: en el teléfono el respaldo era falso, ver fallo F-09 del historial).

## Consecuencias
El mismo código de firma se ejecuta en Node y en Hermes, por lo que las pruebas ejercitan lo que corre en el teléfono. Es más lento que lo nativo para Argon2id. Hay que mantener las dependencias de @noble al día.
