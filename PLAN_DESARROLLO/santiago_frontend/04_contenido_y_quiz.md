# Santiago – Contenido educativo y quiz

Carpeta: `content/` (tuya). JD valida esquema y empaqueta (`manifest.json` con hashes). Validar siempre con `yarn validate-content`.

## Estructura
```
content/
├─ guias/            *.md (una por guía, con front-matter)
├─ imagenes/         ilustraciones locales referenciadas por las guías
├─ quiz/             banco.json (niveles y preguntas)
├─ legal/            consentimiento.md, terminos.md, privacidad.md
├─ textos/           microcopy y errores (es.json)
└─ schema/           (JD) *.schema.json
```

## Front-matter de guía
```md
---
id: mochila-emergencia
title: Mochila de emergencia
summary: Qué incluir y cómo mantenerla lista
category: MOCHILA
version: 1.0.0
readMin: 4
sources: ["UNGRD", "Cruz Roja Colombiana"]
---
# Contenido…
```

## Guías mínimas del MVP (8)
| # | Guía | Categoría | Semana |
| --- | --- | --- | --- |
| 1 | Mochila de emergencia | MOCHILA | 5 |
| 2 | Aseguramiento estructural del hogar | ESTRUCTURAL | 5 |
| 3 | Plan familiar de emergencia | PLAN_FAMILIAR | 5 |
| 4 | Qué hacer durante el sismo (Agáchate, Cúbrete, Agárrate) | OTRO | 7 |
| 5 | Qué hacer después del sismo | OTRO | 7 |
| 6 | Primeros auxilios básicos | PRIMEROS_AUXILIOS | 7 |
| 7 | Zonas seguras y evacuación | OTRO | 8 |
| 8 | Cómo usar EarthQuakeTracker en una emergencia (pánico, baliza, ficha) | OTRO | 8 |

Reglas: lenguaje simple (nivel de lectura bajo), frases cortas, listas, ilustraciones livianas, sin enlaces externos obligatorios (offline), citar fuente oficial (D-15). Revisión por una persona externa idealmente (bombero/defensa civil/profesor).

## Banco de preguntas (`quiz/banco.json`)
```json
{ "levels": [ { "id": "n1", "order": 1, "title": "Nivel 1 – Básico",
  "questions": [ { "id": "q001", "text": "…", "options": ["A","B","C","D"], "correctIndex": 1,
                   "explanation": "…", "protocolRef": "UNGRD – Guía …", "guideId": "mochila-emergencia" } ] } ] }
```
- ≥3 niveles (Básico, Intermedio, Avanzado), ≥60 preguntas en total (≥15 por nivel como mínimo).
- Cada pregunta con explicación y `protocolRef`.
- Desbloqueo de nivel: p. ej. ≥70 % del puntaje del nivel anterior (regla en el motor de SA).

## Motor de quiz (UI, `src/ui/features/quiz/engine`)
- Entrada: `QuizBank` + `Partial` opcional. Salida: `QuizAttempt` para `progress.saveAttempt`.
- Reglas: secuencial; feedback inmediato (<1 s); puntaje = aciertos; si todas incorrectas → sugerir repasar `guideId`.
- Abandono → guardar `partial: true`; reanudar con `getPartial`.
- Insignias (SA define reglas y llama `awardBadge`): "Primera guía leída", "Nivel 1 completado", "Perfecto", "Preparado" (todos los niveles), "Plan familiar listo".

## Textos legales (con asesoría en S15)
Consentimiento informado Habeas Data (Ley 1581/2012): qué datos, finalidad (emergencia), almacenamiento local cifrado, transmisión por proximidad, derechos (consultar, actualizar, suprimir), contacto. Borrador S3, final S15.

## Microcopy
`content/textos/es.json` con claves: errores (`ErrorCode`), permisos, estados (offline, sync), botones de pánico, mensajes de cancelación y confirmación.
