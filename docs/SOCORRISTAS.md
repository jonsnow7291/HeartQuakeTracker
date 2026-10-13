# Códigos de socorrista (RF-13, D-06)

El modo socorrista permite recibir fichas médicas de otras personas, así que **quien lo active tiene acceso a datos sensibles**. Por eso los códigos no viajan en claro en la app.

## Cómo funciona
1. El servidor firma con **Ed25519** una lista de **hashes** de los códigos vigentes: `sha256(pimienta:CÓDIGO)`, con el código recortado y en mayúsculas. Mensaje firmado: `issuedAt|hash1,hash2,…` (ordenados).
2. La app lleva una lista inicial en `assets/bundle/rescuer/list.json` y, cuando hay red, descarga una más nueva de `GET /v1/rescuer/list`.
3. Para aceptar una lista, la app verifica la firma con la **clave pública fijada** en `src/core/rescuer/trust.json` (se ignora la clave que anuncie el servidor), exige que no sea más vieja de 90 días y que no sea anterior a la ya cargada (evita volver a una lista previa a una revocación).
4. Al escribir un código, se calcula su hash y se busca en la lista. **Funciona sin conexión.**
5. Un código de desarrollo (`RESCUER-OFFLINE-TEST`) solo existe en compilaciones `__DEV__`.

Código: `src/core/rescuer/RescuerCodeAuthority.ts` · `src/platform/mesh/rescuerAuthority.ts` · pruebas: `__tests__/core/rescuerAuthority.test.ts`.

## Emitir o rotar códigos
```
node scripts/rescuer-keys.js                      # una sola vez: par de claves + pimienta (privada → server/.env)
node scripts/issue-rescuer-codes.js "Cruz Roja Colombiana" "Defensa Civil Colombiana"
```
- Genera códigos de **60 bits** (`ABC-XXXX-XXXX-XXXX`, alfabeto sin 0/O/1/I/L).
- Escribe la lista firmada en `assets/bundle/rescuer/list.json` y los hashes en `server/seed/rescuer_hashes.json` (el servidor los carga con `SEED_ON_START=true`).
- Imprime los códigos en claro **una sola vez**. Entrégalos por un canal seguro; no se guardan en ningún archivo.
- `scripts/rescuer-keys.js --force` regenera las claves e **invalida todos los códigos emitidos**.
- Hay que **recompilar la app** tras emitir, porque la lista inicial va dentro del APK.

## Limitaciones conocidas
- La pimienta va dentro de la app (no puede ser secreta). La seguridad depende de la **entropía de los códigos**: por eso son aleatorios y largos. Un código corto o con patrón se podría adivinar contra la lista.
- **Revocar** un código solo llega a un teléfono cuando este descarga la lista nueva. Sin red, vale la lista que tenga (hasta 90 días).
- Cualquiera que **conozca** un código válido puede usarlo: el código identifica al organismo, no a la persona. Conviene un código por organismo, rotarlos cuando cambie su personal y, más adelante, un código por persona o credencial firmada individual.
- Esto protege el acceso al modo; el cifrado de la ficha en tránsito hacia el socorrista (X25519 + XChaCha20-Poly1305, ADR 0005) es un tema aparte y no se verificó en esta sesión.
- `server/.env` guarda la clave privada: no se versiona (`.gitignore`) y debe respaldarse fuera del repositorio. Sin ella no se pueden firmar listas nuevas.
