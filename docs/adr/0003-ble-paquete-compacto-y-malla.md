# ADR 0003 – Paquete BLE compacto y malla solo BLE (D-10, D-23, D-24)

- Estado: Aceptado · Decide: Juan Diego

## Contexto
El advertising BLE legacy admite ~31 B; BLE 5 extended permite más pero no todos los móviles lo soportan. Wi-Fi Direct/Multipeer duplican el trabajo nativo.

## Decisión
Paquete ≤31 B obligatorio (versión+flags, tipo, ID efímero 6 B, seq 2 B, gravedad, lat/lon cuantizados 3+3 B, timestamp 4 B, TTL 1 B). Firma truncada solo con extended advertising; si no, `verified=false` hasta verificar por GATT. Malla solo BLE, TTL inicial 4, dedupe (idEph, seq) 10 min, backoff 50–300 ms, cola máx. 200 priorizada por gravedad. Ficha médica por conexión GATT.

## Consecuencias
Menor precisión de coordenadas (~1,2 m). Sin canal de alto ancho de banda. Wi-Fi Direct/Multipeer quedan fuera del MVP.
