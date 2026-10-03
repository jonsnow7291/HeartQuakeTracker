# 03 – RF de prevención y educación (RF-01, RF-02, RF-03)

Actor en todos: Ciudadano/Usuario. Versión 1.0. Código de proyecto MW-2026.

## RF-01 – Gestión de guías de emergencia offline  (Prioridad Alta)
- **ISO:** A.8.9 Gestión de la configuración / A.5.34 Privacidad.
- **Descripción:** consultar guías interactivas (mochila de emergencia, aseguramiento estructural, planes familiares) en **Markdown** almacenadas localmente, sin red.
- **Precondición:** app instalada y paquete de contenido descargado localmente.
- **Flujo:** 1) entra a Educación/Preparación → 2) lista de guías → 3) selecciona → 4) se renderiza el Markdown local → 5) navega sin internet.
- **Alternos:** A1 contenido corrupto/incompleto → error y sugerir reinstalar paquete. A2 con red → verificar y descargar actualizaciones en segundo plano sin interrumpir la lectura.
- **Postcondición:** la guía queda disponible offline.
- **Aceptación:** contenido completo en **< 2 s**, legible sin conexión.
- **Notas de implementación [INFERIDO]:** paquete de contenido versionado (manifest + archivos .md), validación por hash para detectar corrupción, renderer Markdown liviano.

## RF-02 – Evaluación gamificada / quizzes  (Alta)
- **ISO:** A.8.28 Codificación segura.
- **Descripción:** motor de trivias por niveles que evalúa preparación y retroalimenta en tiempo real con respuestas basadas en protocolos oficiales.
- **Precondición:** haber revisado ≥1 guía o entrar directo al módulo.
- **Flujo:** 1) módulo de trivias/simulaciones → 2) nivel disponible según progreso → 3) elige nivel e inicia → 4) preguntas secuenciales → 5) responde → 6) validación y retroalimentación inmediata → 7) puntaje final del nivel.
- **Alternos:** A1 abandona → guarda progreso parcial y permite reanudar. A2 todas incorrectas → sugiere repasar la guía relacionada.
- **Postcondición:** puntaje y nivel registrados para logros y progresión.
- **Aceptación:** retroalimentación por respuesta **< 1 s**; puntaje final registrado.

## RF-03 – Persistencia de logros y progresión  (Media)
- **ISO:** A.8.10 Eliminación de la información.
- **Descripción:** guardar localmente puntaje, nivel e insignias (SQLite / AsyncStorage).
- **Precondición:** al menos un cuestionario o actividad completada.
- **Flujo:** 1) termina actividad (trivia, simulación o reto) → 2) calcula puntaje e insignias → 3) guarda local → 4) actualiza perfil de progresión → 5) consulta historial con/sin conexión.
- **Alternos:** A1 falla de almacenamiento → reintenta y notifica si persiste. A2 reinstalación sin respaldo → informar que el progreso previo no está disponible.
- **Aceptación:** conserva **100 %** del progreso tras cerrar/reabrir la app.
- **Nota:** la política de eliminación (A.8.10) implica permitir borrar el progreso/datos locales del usuario [INFERIDO].

## Datos locales asociados [INFERIDO]
`guias(id, titulo, version, ruta_md, hash)`, `quiz_nivel(id, orden, titulo)`, `quiz_pregunta(id, nivel_id, texto, opciones, correcta, protocolo_ref)`, `progreso(usuario, nivel_id, puntaje, estado, updated_at)`, `insignia(id, codigo, obtenida_en)`.
