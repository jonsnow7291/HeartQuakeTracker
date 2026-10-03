# ADR 0005 – Criptografía con libsodium e ID efímero (D-17)

- Estado: Aceptado · Decide: Juan Diego

## Decisión
Ed25519 para firmas; X25519 + XChaCha20-Poly1305 para enviar la ficha a un socorrista; ID efímero = HMAC-SHA256(secreto local, ventana de 15 min) truncado a 6 B; KDF del PIN con Argon2id; clave maestra en Keystore/Keychain.

## Consecuencias
La identidad real solo se prueba por firma. Rotación cada 15 min dificulta el rastreo. Requiere binding de libsodium para React Native.
