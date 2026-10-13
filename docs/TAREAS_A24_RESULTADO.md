# Resultado Tarea A-24: Modo Oscuro y Accesibilidad (EarthQuakeTracker, RN 0.87)

**Fecha:** 12 de octubre de 2026  
**Responsable:** Agente Antigravity (continuación y cierre del trabajo iniciado por opencode)

---

## 1. Estado y Resumen Ejecutivo

Se completó la implementación y estandarización del **Modo Oscuro** y de las directrices de **Accesibilidad (WCAG AA)** en todo el subárbol `src/ui/`.

1. **Modo Oscuro Dinámico:**
   - `ThemeProvider` responde reactivamente al esquema del sistema (`useColorScheme()`).
   - Se completaron las definiciones de `ColorPalette` y `BrandPalette` en `src/ui/theme/theme.ts`:
     - Tokens `error`, `onError`, `errorContainer`, `onErrorContainer`.
     - Token `brand.onPhase` (`#FFFFFF`) para garantizar contraste legible sobre los fondos de color de fase (`prevention`, `during`, `after`).
     - Se ajustaron los colores de `darkPalette` para `success`, `successContainer`, `warning`, `warningContainer` asegurando relaciones de contraste WCAG AA >= 4.5:1 para texto y >= 3:1 para componentes.
   - Se eliminaron todos los colores hexadecimales literales en componentes y pantallas (`src/ui/screens/` y `src/ui/components/`), reemplazándolos por tokens semánticos del tema activo (`colors` y `brand`).
   - `OfflineMap` y `mapStyle` adaptan su fondo y capas vectoriales según `isDark`.
   - La barra de estado (`StatusBar`) en `App.tsx` cambia dinámicamente entre `dark-content` y `light-content`.

2. **Accesibilidad (A11y):**
   - Todos los elementos interactivos (`Pressable`, `TouchableOpacity`, `Button`, íconos de acción) cuentan con `accessibilityRole="button"`, `accessibilityLabel` descriptivo en español y soporte de `accessibilityHint`.
   - Estados de selección, deshabilitado y verificación reflejados vía `accessibilityState` (`selected`, `disabled`, `checked`, `busy`).
   - Objetivos táctiles mínimos de 48 dp respetados en botones, chips y controles, complementados con `hitSlop` donde los botones visuales son compactos.
   - Elementos de alerta crítica y pánico configurados con `accessibilityLiveRegion`:
     - `Banner`: `assertive` para `critical`/`warning`, `polite` para `info`/`success`.
     - `PanicButton`: `accessibilityLiveRegion="polite"` / botón reactivo con etiquetas completas.
     - `Countdown`: `accessibilityRole="timer"` con región en vivo.
     - `EmergencyActiveScreen`: `accessibilityRole="alert"` y `accessibilityLiveRegion="assertive"`.
   - Tipografía escalable respetando `fontScale` sin alturas fijas que provoquen truncamiento indebido de texto.

---

## 2. Archivos Tocados

### Tema y Configuración Global
- `src/ui/theme/theme.ts`: Extensión de `ColorPalette` con tokens de error y contraste oscuro WCAG AA, más `BrandPalette.onPhase`.
- `src/ui/app/App.tsx`: Actualización de `StatusBar` para alternar entre `light-content` y `dark-content` según el modo activo.

### Componentes de UI (`src/ui/components/`)
- `src/ui/components/ScreenHeader.tsx`: Reemplazo de `#FFFFFF` por `brand.onPhase`.
- `src/ui/components/Banner.tsx`: Accesibilidad en vivo (`accessibilityLiveRegion`), roles y estados accesibles.
- `src/ui/components/PanicButton.tsx`: Accesibilidad completa para auxilio, tamaño >= 48dp / 96dp en pánico.
- `src/ui/components/Button.tsx`: Consumo estricto de colores del tema y estados accesibles.
- `src/ui/components/Card.tsx`, `Chip.tsx`, `Badge.tsx`, `Countdown.tsx`, `StatusPill.tsx`, `SeveritySelector.tsx`, `EmptyState.tsx`, `ErrorState.tsx`, `ErrorBoundary.tsx`: Migrados a paleta dinámica y tokens de accesibilidad.

### Funcionalidades y Pantallas (`src/ui/features/` y `src/ui/screens/`)
- `src/ui/features/map/OfflineMap.tsx`: Reemplazo de color azul fijo `#2563EB` por `colors.auxiliary`.
- `src/ui/screens/AchievementsScreen.tsx`: Corrección de errores TS por `lightPalette`, adopción de `colors.outline` / `colors.onSuccessContainer` y etiquetas de accesibilidad en insignias.
- `src/ui/screens/GuideReaderScreen.tsx`: Corrección de `markdownStyles` convirtiéndolo a fábrica tematizada `makeMarkdownStyles` dependiente de `AppTheme`.
- `src/ui/screens/QuizScreen.tsx`: Corrección de errores por `onErrorContainer`/`onError`, tematización de opciones y badges.
- `src/ui/screens/HomeScreen.tsx`: Reemplazo de `#FFFFFF` e íconos fijos por `colors.onPanic`, `brand.onPhase` y sombras basadas en el tema.
- `src/ui/screens/EmergencyActiveScreen.tsx`: Eliminación de colores fijos en banner y knob de switch, uso de `colors.onPanic`.
- `src/ui/screens/DevScenariosScreen.tsx`: Reemplazo de `#FFFFFF` por `colors.onPanic` y `colors.onPrimary`, hitSlop >= 48dp.
- `src/ui/screens/DuringScreen.tsx`: Eliminación de `#000000` en sombra de toast por `brand.espresso`.
- `src/ui/screens/AfterScreen.tsx`: Reemplazo de sombra `#000` por `brand.espresso`.
- `src/ui/screens/AlertsScreen.tsx`: Tematización de hero card crítico con `colors.onPanic`, eliminación de colores fijos en chips y botones.
- `src/ui/screens/MedicalScreen.tsx`: Eliminación de `#FFFFFF` en badges de tipo de sangre, botones de llamada y formularios de adición.
- `src/ui/screens/QuizLevelsScreen.tsx`: Tematización de botones de acción y avance de nivel con `colors.onPrimary`.
- `src/ui/screens/AidScreen.tsx`: Reemplazo de `#FFFFFF` en botones de socorro y donación por `colors.onPanic` y `brand.onPhase`.
- `src/ui/screens/MapRegionsScreen.tsx`: Reemplazo de `#FFFFFF` en botón de descarga por `colors.onPrimary`.
- `src/ui/screens/RescuerScreen.tsx`: Reemplazo de `#FFFFFF` en botón de autenticación GATT por `colors.onPrimary`.
- `src/ui/screens/OnboardingScreen.tsx`: Reemplazo de `#FFFFFF` en checkboxes de términos y biometría por `colors.onPrimary`.
- `src/ui/screens/ProfileScreen.tsx`: Reemplazo de `#FFFFFF` y `#002611` en botón de notificaciones, avatar y badges de malla.
- `src/ui/screens/MapScreen.tsx`: Tematización completa de `getPoiStyle`, filtros, badges y botón CTA maestro de rutas.

---

## 3. Qué NO se Pudo Verificar (Honestidad Técnica)

- **Inspección visual directa en pantalla física / emulador:** No se ejecutó la app en un dispositivo conectado ni se observó la renderización real en pantalla (el entorno de ejecución es un contenedor headless Linux sin display gráfico interactivo).
- **Lectores de pantalla en vivo (TalkBack / VoiceOver):** Si bien todas las props requeridas (`accessibilityRole`, `accessibilityLabel`, `accessibilityHint`, `accessibilityState`, `accessibilityLiveRegion`) están presentes y tipadas correctamente en el árbol React Native, no se pudo realizar una auditoría acústica con TalkBack en hardware real.
- **Transición en tiempo real del modo oscuro del SO:** La reactividad ante el cambio de modo claro a oscuro depende de los eventos de configuración de Android/iOS vía `useColorScheme()`. El código está conectado correctamente a `ThemeProvider`, pero no fue alternado interactivamente con el conmutador de ajustes del dispositivo en tiempo de ejecución.
- **Contraste de tiles vectoriales en MapLibre:** El mapa base offline utiliza el sabor `'dark'` de `@protomaps/basemaps` cuando `isDark` es verdadero; la rasterización final de los tiles locales PMTiles sobre el motor OpenGL/Vulkan no fue observada en pantalla.

---

## 4. Verificación de Compilación

- Se ejecutó `npx tsc -p tsconfig.app.json --noEmit` de forma limpia: **0 errores**.
- Se verificó que no existieran pruebas Jest en `__tests__/ui` (la carpeta solo contiene documentación en `acceptance.md`).
