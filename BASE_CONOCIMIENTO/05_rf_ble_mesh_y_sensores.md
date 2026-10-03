# 05 – RF de red BLE, malla P2P y sensores (RF-07, RF-08, RF-09)

## RF-07 – Emisión de baliza BLE (advertising)  (Alta)
- **ISO:** A.8.20 Seguridad de redes. **Actor:** Ciudadano en emergencia.
- **Descripción:** transmitir continuamente paquetes comprimidos vía BLE con: **ID único de usuario, estado de gravedad, última coordenada GPS**.
- **Precondición:** modo emergencia activo y Bluetooth habilitado.
- **Flujo:** 1) detecta activación → 2) compone paquete (ID, gravedad, última coordenada) → 3) inicia advertising continuo → 4) actualiza periódicamente la coordenada mientras haya señal GPS.
- **Alternos:** A1 Bluetooth apagado → pedir activarlo. A2 sin GPS → transmite última coordenada conocida con **marca de tiempo**.
- **Aceptación:** transmisión continua, detectable por nodos cercanos a **10–30 m**.
- **Notas [INFERIDO]:** payload BLE de advertising es muy limitado (≈31 B legacy; más con extended advertising en BLE 5) → codificar compacto (ID efímero corto, 2 bits de gravedad, lat/lon cuantizados, timestamp, firma truncada). Canales de advertising 37/38/39 (los usa el sniffer del laboratorio, ver `12`).

## RF-08 – Escaneo y malla peer-to-peer (mesh)  (Alta)
- **ISO:** A.8.20. **Actor:** Ciudadano.
- **Descripción:** escanear nodos BLE/Wi-Fi Direct cercanos y **retransmitir mensajes cortos de socorro (multihop)** entre móviles sin antenas celulares ni internet.
- **Precondición:** BLE y/o Wi-Fi Direct habilitados.
- **Flujo:** 1) escaneo continuo → 2) detecta nodo emitiendo socorro → 3) recibe y guarda temporalmente el mensaje → 4) retransmite a otros nodos (salto a salto) → 5) evita retransmitir duplicados ya procesados.
- **Alternos:** A1 sin nodos → escaneo periódico en segundo plano. A2 malla saturada → **prioriza mensajes de mayor gravedad**.
- **Postcondición:** el mensaje se propaga hasta un punto con conectividad.
- **Aceptación:** retransmite a nodos cercanos en **< 2 s** sin intervención del usuario.
- **Diseño [INFERIDO]:**
  - Identidad de mensaje = hash(id_efímero, seq, timestamp) para deduplicación (caché con TTL).
  - TTL/hops máximos para evitar inundación; backoff aleatorio (trickle) para reducir colisiones.
  - Cola de prioridad: `ATRAPADO > CON_LESIONES > ILESO`, luego antigüedad.
  - Store-and-forward local; al encontrar conectividad, el nodo "puente" sube al servidor (RF-12).
  - Firmas criptográficas livianas + verificación entre pares contra suplantación (R-05).
  - Si no hay nodos puente en 50 m tras 2 min → fallback SMS geolocalizado (R-05).
  - Alcance por salto 10–30 m (RNF-06); prueba de estrés objetivo: **200 nodos** (`12`, `13`).

## RF-09 – Lectura de sensores inerciales  (Media)
- **ISO:** A.8.16. **Actor:** Ciudadano.
- **Descripción:** registrar variaciones de acelerómetro e inclinómetro para detectar posibles sacudidas sísmicas y **procesar la señal localmente**.
- **Precondición:** sensores funcionales; app en primer o segundo plano.
- **Flujo:** 1) lectura continua → 2) procesa localmente → 3) compara con umbrales de sacudida sísmica → 4) marca posible sismo al superar el umbral → 5) envía lectura colaborativa para confirmación con otras fuentes.
- **Alternos:** A1 lectura ruidosa/inconsistente → descarta y sigue. A2 sin sensores → desactiva el módulo y notifica.
- **Postcondición:** lecturas colaborativas disponibles para confirmar el evento.
- **Aceptación:** procesa y clasifica cada lectura en **< 500 ms**.
- **Anti falsos positivos (R-03):** filtros de umbral + **quórum de ≥ 3 nodos adyacentes** en una ventana de tiempo antes de alerta general.
- **Notas [INFERIDO]:** ventana deslizante (ej. STA/LTA o RMS con filtro paso-banda), distinguir caídas/movimiento cotidiano por patrón y duración; el envío colaborativo usa malla (RF-08) o servidor (RF-12).
