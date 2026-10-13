# Tareas A-22: controles de la interfaz que no hacen nada

Reglas: `docs/BRIEF_REDISENO.md` (usa `Text`, `Icon`, `brand`; sin emojis; **no ejecutes gradle, yarn ni jest**; valida solo con `npx tsc --noEmit -p tsconfig.app.json`; sin `git commit`). **Edita solo los archivos de tu paquete.** No inventes datos.

## Paquete AGY (eqt-d8) — navegación del Inicio
Archivos permitidos: `src/ui/screens/HomeScreen.tsx` y `src/ui/navigation/MainTabs.tsx`.
- En `HomeScreen`, la **campana** (accessibilityLabel «Notificaciones») debe llevar a la pestaña **Alertas**, y el **círculo de perfil** (accessibilityLabel «Perfil») a la pestaña **Perfil**. Hoy no hacen nada (la campana es un `Pressable` sin `onPress` y el avatar es un `View`).
- Añade props opcionales `onNavigateToAlerts?` y `onNavigateToProfile?` a `HomeScreenProps`, haz el avatar un `Pressable` con `accessibilityRole="button"` y zona táctil ≥ 48 px, y conéctalos en `MainTabs.tsx` con `nav.navigate('Main', { screen: 'Alerts' })` y `nav.navigate('Main', { screen: 'Profile' })` (mira cómo se usa ya en `MapScreen.tsx`).
- No cambies nada más del Inicio.

## Paquete OPENCODE (eqt-oc4) — botones de compartir
Archivos permitidos: `src/ui/screens/EmergencyActiveScreen.tsx`, `src/ui/screens/DuringScreen.tsx`, `src/ui/screens/AfterScreen.tsx`.
Ya existe `shareStatus(kind, position?)` en `src/ui/features/share/shareStatus.ts` (abre la hoja nativa de compartir; `kind` es `'SAFE'` o `'HELP'`; la posición es un `GeoPoint` real o `undefined`). Úsalo:
- `EmergencyActiveScreen`: el botón de compartir (accessibilityLabel «Compartir estado de emergencia») hoy solo muestra un `Alert`. Debe llamar `shareStatus('HELP', emergencyState.lastPosition)`.
- `DuringScreen`: el botón «Compartir estado» hoy muestra un aviso falso «Enlace de alerta copiado» (no copia nada). Quita ese texto y llama `shareStatus('HELP', position)`, donde `position` sale de `useEmergency().state.lastPosition` (puede ser `undefined`). Si el usuario cierra la hoja sin compartir, no muestres nada.
- `AfterScreen`: el botón «Compartir estado» ya marca «Estoy a salvo» con `handleMarkSafe`. Déjalo marcando y, **después de guardar el estado**, abre `shareStatus('SAFE', position)` con la posición de `useEmergency().state.lastPosition`.
- Importa con ruta relativa (`../features/share/shareStatus`). No modifiques `shareStatus.ts`.

## Al terminar
`herdr agent prompt w4:p1 "<tu-nombre> TERMINADO: <archivos · pendientes>"` (o `BLOQUEADO: <motivo>`).
