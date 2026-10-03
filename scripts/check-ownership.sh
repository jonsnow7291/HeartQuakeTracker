#!/usr/bin/env bash
#
# scripts/check-ownership.sh
#
# Verifica que un PR toque únicamente archivos de un solo dueño (Juan Diego o Santiago),
# de acuerdo con la regla 'Una carpeta, un dueño' y la matriz de compartido/01_mapa_de_propiedad.md.
#
# Uso:
#   bash scripts/check-ownership.sh [rango-git]
#
# Por defecto evalúa: origin/develop...HEAD
#

set -euo pipefail

# Ayuda
if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  echo "Uso: $0 [rango-git]"
  echo "Ejemplo: $0 origin/develop...HEAD"
  echo "Ejemplo: $0 HEAD~1...HEAD"
  exit 0
fi

# Si no hay commits en el repositorio aún
if ! git rev-parse --verify HEAD >/dev/null 2>&1; then
  echo "ℹ️  Repositorio recién inicializado sin commits en HEAD. No hay cambios que verificar."
  exit 0
fi

RANGE="${1:-}"

# Si no se pasó argumento, intentar determinar el mejor rango disponible
if [ -z "$RANGE" ]; then
  if git rev-parse --verify --quiet origin/develop >/dev/null 2>&1; then
    RANGE="origin/develop...HEAD"
  elif git rev-parse --verify --quiet develop >/dev/null 2>&1; then
    RANGE="develop...HEAD"
  elif git rev-parse --verify --quiet origin/main >/dev/null 2>&1; then
    RANGE="origin/main...HEAD"
  elif git rev-parse --verify --quiet main >/dev/null 2>&1; then
    RANGE="main...HEAD"
  else
    RANGE="origin/develop...HEAD"
  fi
fi

# Obtener archivos modificados
if ! CHANGED_FILES=$(git diff --name-only "$RANGE" 2>/dev/null); then
  echo "❌ Error: No se pudo obtener el diff para el rango '$RANGE'."
  echo "   Asegúrate de que la referencia base exista o especifica un rango válido."
  echo "   Ejemplo: $0 HEAD~1...HEAD"
  exit 1
fi

if [ -z "$CHANGED_FILES" ]; then
  echo "✓ No hay archivos modificados en el rango '$RANGE'."
  exit 0
fi

jd_files=()
sa_files=()
other_files=()

while IFS= read -r file; do
  [ -z "$file" ] && continue

  is_jd=false
  is_sa=false

  case "$file" in
    src/contracts/* | src/contracts)
      is_jd=true
      ;;
    src/core/* | src/core)
      is_jd=true
      ;;
    android/* | android)
      is_jd=true
      ;;
    ios/* | ios)
      is_jd=true
      ;;
    server/* | server)
      is_jd=true
      ;;
    scripts/* | scripts)
      is_jd=true
      ;;
    __tests__/core/* | __tests__/core)
      is_jd=true
      ;;

    src/ui/* | src/ui)
      is_sa=true
      ;;
    content/guias/* | content/guias)
      is_sa=true
      ;;
    content/quiz/* | content/quiz)
      is_sa=true
      ;;
    content/legal/* | content/legal)
      is_sa=true
      ;;
    content/textos/* | content/textos)
      is_sa=true
      ;;
    assets/* | assets)
      is_sa=true
      ;;
    design/* | design)
      is_sa=true
      ;;
    __tests__/ui/* | __tests__/ui)
      is_sa=true
      ;;
    e2e/* | e2e)
      is_sa=true
      ;;
    *)
      # Archivos neutros o compartidos (docs, content/schema, package.json, config raíz, etc.)
      other_files+=("$file")
      ;;
  esac

  if [ "$is_jd" = true ]; then
    jd_files+=("$file")
  elif [ "$is_sa" = true ]; then
    sa_files+=("$file")
  fi
done <<< "$CHANGED_FILES"

# Verificar conflicto de propiedad cruzada
if [ ${#jd_files[@]} -gt 0 ] && [ ${#sa_files[@]} -gt 0 ]; then
  echo "❌ ERROR: Violación de propiedad en el PR (rango: $RANGE)."
  echo "   Un solo PR no puede modificar rutas pertenecientes a ambos dueños (Juan Diego y Santiago)."
  echo "   Regla: 'Un PR toca solo carpetas propias' (compartido/01_mapa_de_propiedad.md y compartido/02)."
  echo ""
  echo "Archivos modificados de Juan Diego (${#jd_files[@]}):"
  for f in "${jd_files[@]}"; do
    echo "  - $f"
  done
  echo ""
  echo "Archivos modificados de Santiago (${#sa_files[@]}):"
  for f in "${sa_files[@]}"; do
    echo "  - $f"
  done
  echo ""
  echo "Por favor divide tus cambios en ramas y PRs separados según el carril correspondiente."
  exit 1
fi

echo "✓ Verificación de propiedad aprobada (rango: $RANGE)."
if [ ${#jd_files[@]} -gt 0 ]; then
  echo "  Carril identificado: Juan Diego (${#jd_files[@]} archivo(s) exclusivo(s))."
elif [ ${#sa_files[@]} -gt 0 ]; then
  echo "  Carril identificado: Santiago (${#sa_files[@]} archivo(s) exclusivo(s))."
else
  echo "  No se modificaron rutas exclusivas (solo archivos compartidos/neutros)."
fi

exit 0
