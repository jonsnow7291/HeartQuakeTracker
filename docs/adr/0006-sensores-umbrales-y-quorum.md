# ADR 0006 – Detección sísmica: umbrales y quórum (D-18)

- Estado: Aceptado, calibrable en la Semana 7 · Decide: Juan Diego

## Decisión
Acelerómetro a 50 Hz, filtro paso-alto, RMS > 0,03 g durante ≥1 s ⇒ POSSIBLE. Quórum ≥3 nodos distintos en 10 s ⇒ CONFIRMED. Los umbrales viven en `src/core/sensors/config.ts`.

## Consecuencias
Sin quórum (sin malla) la alerta queda en POSSIBLE. Se calibra con datasets de caída, caminata y sismo simulado.
