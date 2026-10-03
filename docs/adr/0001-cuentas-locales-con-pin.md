# ADR 0001 – Cuentas locales con PIN (D-01)

- Estado: Aceptado (2026-10-03) · Decide: Juan Diego

## Contexto
RF-04 exige sesión, pero la app debe funcionar sin red. No hay servidor de cuentas en el MVP.

## Decisión
Cuenta **local**: nombre + PIN de 6 dígitos + biometría opcional. El PIN no se almacena; se usa KDF (Argon2id) para envolver la clave maestra de la BD (Keystore/Keychain). El botón de pánico **no** requiere desbloqueo; la ficha médica y el progreso sí.

## Consecuencias
`SessionService` es local. Olvidar el PIN implica perder la ficha (se documenta). Sin recuperación remota en el MVP.
