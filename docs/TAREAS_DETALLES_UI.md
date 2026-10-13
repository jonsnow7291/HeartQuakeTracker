# Tareas de detalles de interfaz (hallazgos abiertos)

Reglas generales: `docs/BRIEF_REDISENO.md` (usa `Text`, `Icon` y `brand` de `src/ui`; **nunca emojis**; no ejecutes gradle, yarn ni jest; valida solo con `npx tsc --noEmit -p tsconfig.app.json` al terminar; sin `git commit`). **Edita solo los archivos de tu paquete.** Los textos en español (es-CO). No inventes datos.

## Paquete D7 (agy) — quiz, mapa, textos recortados, agendar simulacro
Archivos permitidos: `src/ui/screens/{Home,Profile,Achievements,QuizLevels,Quiz,Alerts,Map,EmergencyActive}Screen.tsx`.
- **A-07 textos recortados:** en Inicio la píldora de estado («En línea» se corta), en Perfil el botón «Ver todas las insignias», en Logros la etiqueta «Bloqueada», el título del quiz y «Estado Vital & Gravedad» en EmergencyActiveScreen. Usa `flexShrink`, `flexWrap` y `numberOfLines` con `ellipsizeMode`, o deja que el texto ocupe varias líneas. Que se lea bien también con la fuente grande del sistema.
- **A-11 quiz:** `QuizLevelsScreen`: el botón dice «Continuar nivel» si hay un intento en curso (mira `progress`) y «Comenzar Nivel» si no. En `QuizScreen` la guía recomendada muestra el **título** de la guía (`content.listGuides()`), no su identificador.
- **A-13 agendar simulacro (AlertsScreen):** el diálogo no debe pedir una fecha ISO escrita. Ofrece chips de día (Hoy, Mañana, En 3 días, En 1 semana) y de hora (8:00, 10:00, 14:00, 18:00) y arma el ISO por dentro. Sin dependencias nuevas.
- **A-15 mapa (MapScreen):** la hoja inferior de detalle solo aparece **después** de elegir un punto (hoy hay uno seleccionado por defecto que tapa la lista) y se puede cerrar. No toques `OfflineMap` ni la lógica de posición.

## Paquete OC2 (opencode) — ayuda, permisos, sincronización
Archivos permitidos: `src/ui/screens/AidScreen.tsx`, `PermissionsScreen.tsx`, `SyncScreen.tsx`.
- **A-06 AidScreen:** los canales deben ser accionables. Teléfono → `Linking.openURL('tel:…')`; web → `Linking.openURL(url)`; ambos con manejo de error y `accessibilityLabel` («Llamar a …», «Abrir …»). El botón «Hacer donación» abre el canal oficial (D-05: la app no procesa pagos).
- **A-12 PermissionsScreen:** en Android «Sensores de movimiento» no requiere permiso: muéstralo como «Concedido» y no ofrezcas solicitarlo.
- **A-10 SyncScreen:** si la sincronización falla, muestra **un solo** mensaje con el motivo real (`err.code` / `err.message`: `NETWORK_UNAVAILABLE`, `AUTH_FAILED`, `SYNC_PARTIAL`) en el banner, y no además un `Alert` contradictorio.
- **A-09 SyncScreen:** en la lista de reportes, el que tiene descripción `ESTOY_A_SALVO` se muestra como «Estoy a salvo» con ícono `check_circle`, no como «DAÑO: OTRO».

## Al terminar
Avísame con `herdr agent prompt w4:p1 "<tu-nombre> TERMINADO: <archivos · pendientes>"` (o `BLOQUEADO: <motivo>`).
