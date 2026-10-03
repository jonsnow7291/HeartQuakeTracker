# JD – Seguridad y protocolo de malla (decisiones D-17, D-23, D-24, D-25 vigentes; este documento detalla)

> **Resolución MVP:** payload compacto ≤31 B (legacy) obligatorio; firma truncada solo con extended advertising (BLE 5), el resto `verified=false` hasta verificar por GATT; TTL inicial 4; sin Wi-Fi Direct/Multipeer; SMS solo prellenado. Donde este texto diga "TTL 6", "Wi-Fi Direct" o "SMS automático", prevalece `06_decisiones_semana_1.md`.

## 1. Datos locales
- SQLite con **SQLCipher** (AES-256). Clave de BD aleatoria generada al crear la cuenta, **guardada en Keystore (Android) / Keychain (iOS)**, protegida por PIN/biometría. El PIN no se guarda; se usa KDF (Argon2id o PBKDF2 con iteraciones altas) para envolver la clave.
- La ficha médica vive solo en esa BD. Borrado seguro al eliminar cuenta (`resetAll`, `MedicalProfileService.remove`).
- Logs: nunca imprimir ficha, ubicaciones exactas ni claves.

## 2. Identidad en la malla
- Cada dispositivo genera un par **Ed25519**. La clave pública se registra en el servidor cuando hay red (no obligatorio para operar).
- **ID efímero**: `idEph = truncate(HMAC(secretoLocal, floor(t / 15min)), 4–6 bytes)`; rota cada 15 min para evitar rastreo. El dispositivo puede demostrar su identidad real al servidor/rescatista con la firma.
- Cada mensaje de socorro va firmado (firma truncada o firma completa en canal de datos largo).

## 3. Formato del paquete BLE (propuesta para advertising extendido; versión de protocolo en el primer byte)
| Campo | Bytes | Notas |
| --- | --- | --- |
| Versión + flags | 1 | bits: versión(3), relayed(1), lowPower(1), medicalAvailable(1), reservado |
| Tipo de mensaje | 1 | 0x01 SOS, 0x02 ACK, 0x03 SEISMIC_READING, 0x04 RESCUER_HELLO |
| ID efímero origen | 6 | |
| Secuencia | 2 | contador por origen |
| Gravedad | 1 (2 bits útiles) | 0 Ileso, 1 Con lesiones, 2 Atrapado |
| Latitud / Longitud | 3 + 3 | cuantizado (~1,2 m) |
| Timestamp | 4 | epoch s (UTC) |
| TTL / hops | 1 | |
| Firma truncada | 8–16 | sobre todos los campos anteriores |
Total ≈ 31–40 B: usar **BLE 5 extended advertising** cuando haya soporte; **fallback legacy (31 B)** con campos recortados (sin firma completa; firma 4 B + verificación posterior por canal de datos). Evaluar y fijar en el spike JD-016/JD-050.

## 4. Reglas de la malla
1. **Dedupe:** clave `(idEphOrigen, seq)`; caché LRU con TTL (p. ej. 10 min).
2. **TTL/hops:** valor inicial 4; decrementa en cada relé; se descarta en 0.
3. **Backoff aleatorio** (trickle) antes de relé para evitar colisiones; se cancela si se escucha el mismo mensaje relevado por otros ≥ k veces.
4. **Prioridad:** `ATRAPADO > CON_LESIONES > ILESO`, luego menor edad; cola acotada (p. ej. 200 mensajes) que descarta lo menos prioritario.
5. **Verificación:** descartar mensajes con firma inválida o timestamp fuera de ±24 h; marcar `verified` en `NearbyNode`.
6. **Quórum sísmico:** para elevar `POSSIBLE` → `CONFIRMED` se requieren lecturas coincidentes de ≥3 nodos distintos en una ventana (p. ej. 10 s) y radio razonable.
7. **Duty cycle:** normal = ráfagas continuas con intervalo optimizado; `lowPower` (<20 %) = ráfagas cada 30 s.
8. **Puente a internet:** cualquier nodo con conectividad sube lo recibido al servidor (con `eventId` idempotente).
9. **SMS fallback:** si pasan 2 min sin nodos puente en 50 m, ofrecer/enviar SMS geolocalizado (permiso del usuario).

## 5. Ficha médica a socorristas (RF-13)
- Modo socorrista con código de organismo (validado online o por lista local firmada).
- El rescatista emite `RESCUER_HELLO` con su pubkey; el ciudadano en emergencia (ACTIVE y `medicalCardArmed`) responde por **canal de datos** (GATT/Wi-Fi Direct/Multipeer) con la ficha **comprimida y cifrada** para esa pubkey (X25519 + AEAD). Campos faltantes → `incomplete=true`.
- Meta: <3 s dentro de rango.
- La app del rescatista verifica la firma y muestra la ficha; registra recepción en `listReceived`.

## 6. Anti-suplantación
Firma por mensaje, verificación mutua, límites de tasa por origen, revocación de dispositivos en servidor, y listas locales de bloqueo.

## 7. Privacidad
Consentimiento Habeas Data (texto lo redacta SA; JD valida técnicamente), minimización (ficha solo local y proximidad), derecho a borrar, retención en servidor configurable.

## 8. Permisos y SO
Android 10–15: `BLUETOOTH_SCAN/ADVERTISE/CONNECT`, ubicación (foreground + background si necesario), `FOREGROUND_SERVICE_*`, notificaciones. iOS 15+: `NSBluetoothAlwaysUsageDescription`, ubicación en uso/siempre, modos de background `bluetooth-central/peripheral`, notificaciones. Texto de permisos coordinado con SA.
