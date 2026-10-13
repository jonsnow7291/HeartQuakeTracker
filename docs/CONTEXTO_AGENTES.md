# Contexto para agentes (herdr) – EarthQuakeTracker

**Proyecto:** app móvil offline-first (React Native 0.87 bare + TypeScript) para prevención, respuesta y recuperación ante sismos en Colombia. Código MW-2026, UNIMINUTO Ing. de Software. Estado a 12-oct-2026: **funciona en Android** (probado en un Motorola edge 50 fusion, Android 15); **iOS sin compilar** (el entorno es Linux).

**Fuentes de verdad (solo lectura):** `BASE_CONOCIMIENTO/` (requisitos RF-01…13, RNF-01…07), `PLAN_DESARROLLO/compartido/06_decisiones_semana_1.md` (decisiones D-01…D-38), `DOCS/` (propuesta, ISO 20000-1), `design/mockups/earthquake_tracker/DESIGN.md` y las capturas de `design/mockups/*/screen.png`.

## Mapa del repositorio
| Carpeta | Contenido |
|---|---|
| `src/contracts/` | Interfaces TS de los 16 servicios (no se cambian sin acuerdo) |
| `src/core/` | Lógica pura y probada en Node (sesión, contenido, progreso, ficha, emergencia, malla, sensores, sync, poi, aid, rescuer) |
| `src/platform/` | Adaptadores de React Native y módulos nativos (SQLCipher, Keychain, BLE, ubicación, Argon2 nativo, mapa) |
| `src/ui/` | Pantallas, componentes del sistema de diseño, navegación |
| `src/app/bootstrap.ts` | Orden de registro de servicios reales (el orden importa: `emergency` antes de `mesh`) |
| `android/`, `ios/` | Nativo. Kotlin: señalización, BLE, acelerómetro, Argon2 (`com.earthquaketracker.*`). iOS escrito pero sin verificar |
| `assets/bundle/` | **Va dentro del APK:** `map/` (bogota.pmtiles 19 MB + fuentes), `poi/pois.json` (697 puntos), `rescuer/list.json` (lista firmada) |
| `server/` | API Fastify. **Solo corre en local** (`localhost:3000`, en memoria) |
| `scripts/` | `build-map.sh`, `build-pois.js`, `rescuer-keys.js`, `issue-rescuer-codes.js`, validadores |
| `docs/` | Esta documentación (índice en `docs/README.md`) |

## Reglas que ya se cumplen (no las rompas)
1. **Texto con `components/Text`** y **íconos con `components/Icon`**; nunca `Text`/`SafeAreaView` de `react-native` ni emojis. `SafeAreaView` de `react-native-safe-area-context`.
2. **No mostrar datos inventados como reales.** Sin valores de relleno del mockup: si no hay dato, «—», «sin dato» o un estado explícito.
3. **Lógica en `src/core`, nunca en la UI.** Lo que dependa de React Native o de nativo va en `src/platform`.
4. **Cripto:** Ed25519 real con `@noble/curves` (en Node y en Hermes). No uses `node:crypto` con respaldo falso.
5. **Códigos de socorrista:** solo hashes firmados; ningún código en claro en el código (`docs/SOCORRISTAS.md`). `server/.env` guarda la clave privada y no se versiona.
6. Hermes **no tiene** `TextDecoder` ni `crypto.getRandomValues` nativos (ya hay polyfill y utilidades propias).
7. SQLite: escrituras en cola y `busy_timeout`; las alertas se procesan en fila.
8. Android 15: el `SafeAreaView` de `react-native` rompe Fabric; el servicio en primer plano solo declara tipos con permisos concedidos.

## Cómo probar
- `npx tsc --noEmit` y `npx tsc --noEmit -p tsconfig.app.json`; `npx jest --runInBand` (172 pruebas, solo el núcleo).
- Dispositivo: Metro (`npx react-native start`) + `adb reverse tcp:8081 tcp:8081`; la compilación nativa con `android/gradlew installDebug`. Requiere `JAVA_HOME=/usr/lib/jvm/java-17-openjdk` y SDK en `~/Android/Sdk`.
- **No ejecutes gradle, yarn ni jest en paralelo** (la máquina se satura) y **cierra los demonios de Gradle al terminar** (`./gradlew --stop`).
- El teléfono se desconecta de `adb` con frecuencia: `adb kill-server; adb start-server` y reautorizar.

## Trabajo con agentes
- `agy` (Gemini) y `opencode` se lanzan por herdr: `herdr pane split` → `herdr agent start <nombre> --kind agy|opencode --pane <id>` → `herdr agent prompt`. Nombres en minúsculas, dígitos, `-` o `_`.
- `opencode` con su modelo por defecto falla (retirado): usar `-- -m opencode/big-pickle`.
- Dale a cada agente un documento (`docs/TAREAS_*.md`) y archivos permitidos disjuntos; pide que avise con `herdr agent prompt w4:p1 "…"`.
- **Revisa su trabajo**: ya cometieron errores (datos de ejemplo del mockup mostrados como reales, usar `lastPosition` que solo existe en emergencia).

## Estado funcional (resumen)
Verificado en teléfono: onboarding, guías, quiz y logros (persisten), checklists, ficha médica cifrada, PIN con Argon2 nativo, pánico con flash y cola de sincronización, mapa offline con GPS real y 697 puntos, modo socorrista con lista firmada, compartir estado, modo avión.
**Sin verificar o pendiente:** BLE/malla/quórum/ficha al socorrista entre teléfonos (A-18), servidor desplegado (A-17), iOS (A-16), puntos no verificados oficialmente (A-19), respaldo por SMS (A-20), avisos de posible sismo (A-21), actualización de contenido (A-23), modo oscuro y accesibilidad (A-24), pruebas de interfaz (A-25). Detalle en `Historial_de_Fallos.docx`.
