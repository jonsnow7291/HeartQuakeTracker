# ADR 0010 – Códigos de socorrista con lista firmada de hashes (implementa D-06)

- Estado: Aceptado
- Decide: equipo del proyecto
- Fecha: 2026-10-12

## Contexto
El modo socorrista da acceso a fichas médicas. La primera versión guardaba los códigos en texto plano dentro de la app (fallo F-23).

## Decisión
El servidor firma con Ed25519 una lista de hashes `sha256(pimienta:CÓDIGO)`. La app guarda una lista inicial y acepta una más nueva solo si la firma verifica con la clave pública **fijada en la app**, no es anterior a la ya cargada y tiene menos de 90 días. Los códigos son aleatorios de 60 bits. La clave privada vive solo en `server/.env`. Detalle y límites en `docs/SOCORRISTAS.md`.

## Alternativas consideradas
Códigos en claro (rechazada), validar siempre contra el servidor (no funciona sin red), credenciales individuales firmadas (mejor, pero fuera del alcance del MVP).

## Consecuencias
Funciona sin conexión. Revocar un código solo llega al teléfono cuando descarga la lista nueva. Un código identifica al organismo, no a la persona. Perder `server/.env` impide emitir listas nuevas.
