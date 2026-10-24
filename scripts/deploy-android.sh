#!/usr/bin/env bash
# Despliega EarthQuakeTracker en un teléfono Android conectado por USB.
#
#   scripts/deploy-android.sh              debug: instala, levanta Metro y abre la app
#   scripts/deploy-android.sh --release    release firmado (JS empaquetado, sin Metro)
#   scripts/deploy-android.sh --no-build   solo reinicia la app y Metro (sin gradle)
#   scripts/deploy-android.sh --stop       apaga Metro y los demonios de Gradle
#
# Variables opcionales: ANDROID_SERIAL (si hay varios dispositivos), ANDROID_HOME, JAVA_HOME,
# METRO_PORT (8081), GRADLE_XMX (1536m), GRADLE_WORKERS (2).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_ID="com.earthquaketracker"
PORT="${METRO_PORT:-8081}"
MODE="debug"; BUILD=1; STOP_ONLY=0
STATE_DIR="${TMPDIR:-/tmp}/eqt-deploy"; mkdir -p "$STATE_DIR"
METRO_PID="$STATE_DIR/metro.pid"; METRO_LOG="$STATE_DIR/metro.log"

for a in "$@"; do
  case "$a" in
    --release)  MODE="release" ;;
    --no-build) BUILD=0 ;;
    --stop)     STOP_ONLY=1 ;;
    -h|--help)  sed -n '2,11p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "Opción desconocida: $a (usa --help)" >&2; exit 2 ;;
  esac
done

log()  { printf '\033[1;34m▶\033[0m %s\n' "$*"; }
ok()   { printf '\033[1;32m✔\033[0m %s\n' "$*"; }
fail() { printf '\033[1;31m✘\033[0m %s\n' "$*" >&2; exit 1; }

export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
if [ -z "${JAVA_HOME:-}" ] && [ -d /usr/lib/jvm/java-17-openjdk ]; then export JAVA_HOME=/usr/lib/jvm/java-17-openjdk; fi
ADB="$ANDROID_HOME/platform-tools/adb"; [ -x "$ADB" ] || ADB="$(command -v adb || true)"
[ -x "$ADB" ] || fail "No encuentro adb. Define ANDROID_HOME (ahora: $ANDROID_HOME)."

metro_up() { curl -s -m 2 "http://localhost:$PORT/status" 2>/dev/null | grep -q "packager-status:running"; }
stop_metro() {
  local pid; pid="$(cat "$METRO_PID" 2>/dev/null || true)"
  if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
    kill -- "-$pid" 2>/dev/null || kill "$pid" 2>/dev/null || true   # grupo entero (npx + node)
    ok "Metro detenido"
  fi
  rm -f "$METRO_PID"
}
stop_gradle() { (cd "$ROOT/android" && ./gradlew --stop >/dev/null 2>&1) || true; }

if [ "$STOP_ONLY" = 1 ]; then stop_metro; stop_gradle; ok "Gradle detenido"; exit 0; fi

# --- 1. Dispositivo -------------------------------------------------------------------------
"$ADB" start-server >/dev/null 2>&1 || true
mapfile -t DEVS < <("$ADB" devices | awk 'NR>1 && $2=="device"{print $1}')
if [ -n "${ANDROID_SERIAL:-}" ]; then SERIAL="$ANDROID_SERIAL"
elif [ "${#DEVS[@]}" -eq 1 ]; then SERIAL="${DEVS[0]}"
elif [ "${#DEVS[@]}" -eq 0 ]; then
  "$ADB" devices | tail -n +2 | grep -q unauthorized && fail "El teléfono no ha autorizado la depuración USB: desbloquéalo y acepta el aviso."
  fail "No hay teléfono conectado. Revisa el cable de datos y la depuración USB (adb kill-server; adb start-server)."
else fail "Hay varios dispositivos (${DEVS[*]}). Usa: ANDROID_SERIAL=<id> $0"; fi
ADBD=("$ADB" -s "$SERIAL")
MODEL="$("${ADBD[@]}" shell getprop ro.product.model | tr -d '\r')"
ABI="$("${ADBD[@]}" shell getprop ro.product.cpu.abi | tr -d '\r')"
ok "Dispositivo: $MODEL ($SERIAL, $ABI) · modo $MODE"

# --- 2. Metro (solo debug) ------------------------------------------------------------------
if [ "$MODE" = "debug" ]; then
  "${ADBD[@]}" reverse "tcp:$PORT" "tcp:$PORT" >/dev/null
  if metro_up; then ok "Metro ya está corriendo en el puerto $PORT"
  else
    log "Levantando Metro en el puerto $PORT (log: $METRO_LOG)"
    cd "$ROOT"
    # setsid: Metro queda en su propio grupo, sin heredar la terminal, y sobrevive al script.
    setsid nohup npx react-native start --port "$PORT" </dev/null >"$METRO_LOG" 2>&1 &
    echo $! >"$METRO_PID"
    for _ in $(seq 1 60); do metro_up && break; sleep 1; done
    metro_up || fail "Metro no arrancó en 60 s. Mira $METRO_LOG"
    ok "Metro listo"
  fi
fi

# --- 3. Compilar e instalar -----------------------------------------------------------------
if [ "$BUILD" = 1 ]; then
  if [ "$MODE" = "release" ]; then
    [ -f "$ROOT/android/release-signing.properties" ] && [ -f "$ROOT/android/app/release.keystore" ] \
      || fail "Faltan android/release-signing.properties o android/app/release.keystore (no se versionan)."
    TASK="installRelease"
  else TASK="installDebug"; fi
  log "gradle $TASK (un solo proceso, sin demonio, para cuidar la RAM)"
  (cd "$ROOT/android" && ./gradlew "$TASK" \
      -PreactNativeArchitectures="$ABI" --no-daemon --max-workers="${GRADLE_WORKERS:-2}" \
      -Dorg.gradle.jvmargs="-Xmx${GRADLE_XMX:-1536m}" -q) || { stop_gradle; fail "Falló la compilación."; }
  stop_gradle
  ok "Instalada en el teléfono"
fi

# --- 4. Abrir la app ------------------------------------------------------------------------
"${ADBD[@]}" shell input keyevent KEYCODE_WAKEUP
"${ADBD[@]}" shell am force-stop "$APP_ID"
"${ADBD[@]}" shell am start -W -n "$APP_ID/.MainActivity" >/dev/null
sleep 3
TOP="$("${ADBD[@]}" shell dumpsys activity activities | grep -m1 topResumedActivity || true)"
case "$TOP" in
  *"$APP_ID"*) ok "App abierta en primer plano" ;;
  *) echo "⚠ La app arrancó pero no está al frente: ¿el teléfono está bloqueado? Desbloquéalo." ;;
esac
if [ "$MODE" = "debug" ]; then
  echo "   Metro sigue corriendo (primer empaquetado: ~1 min). Para apagar todo: $0 --stop"
fi
