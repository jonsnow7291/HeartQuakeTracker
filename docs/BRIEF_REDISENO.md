# Brief de rediseño de interfaz (agentes) – EarthQuakeTracker

**Objetivo:** que cada pantalla se vea como su mockup oficial. La app hoy usa una serif de respaldo, emojis como íconos y tarjetas genéricas; los mockups usan **Plus Jakarta Sans**, **Material Symbols**, cabeceras por fase y una barra inferior oscura.

## Fuentes de verdad (léelas antes de tocar código)
- `design/mockups/earthquake_tracker/DESIGN.md` – paleta, tipografía, espaciado, formas, componentes.
- `design/mockups/<pantalla>/screen.png` – la imagen del mockup (ábrela y compárala con lo que construyes).
- `design/mockups/<pantalla>/code.html` – estructura, textos, colores, tamaños (clases Tailwind) y nombres de íconos Material exactos.
- `design/mockups/image.png/screen.png` – composición de todas las pantallas (incluye el splash).
- `docs/evidencia/` y la app actual – para saber qué hay hoy.

## Base ya construida (úsala, no la reescribas)
| Pieza | Archivo |
|---|---|
| Texto con la fuente y el peso correctos | `src/ui/components/Text.tsx` (`Text`, `TextInput`; **nunca** importes `Text` de `react-native`) |
| Íconos Material Symbols por nombre | `src/ui/components/Icon.tsx` → `<Icon name="home" size={24} color="#2A1D13" filled />` (los nombres están en los `code.html`) |
| Logo oficial (SVG) | `src/ui/components/LogoMark.tsx` |
| Cabecera de pantalla por fase | `src/ui/components/ScreenHeader.tsx` (`tone`: plain, prevention, during, after, espresso) |
| Colores de marca y fases | `brand` en `src/ui/theme/tokens.ts` (espresso `#2A1D13`, prevención `#3D7D54`, durante `#D47A22`, después `#3F6F8E`, terracota `#C24726`, borde `#E2D5C3`) |
| Tipografía/espacios/radios | `typography.scale.*`, `spacing`, `borderRadius` en `tokens.ts`; `lightPalette` en `theme.ts` |
| Barra inferior (ya hecha) | `src/ui/navigation/AppTabBar.tsx` |
| Botón pastilla de 52 px, Card con borde cálido | `Button.tsx`, `Card.tsx` |

## Reglas
1. **Solo editas los archivos de tu paquete** (abajo). Los componentes compartidos de `src/ui/components/` y los tokens **no se editan**: si algo falta, crea un componente nuevo dentro de `src/ui/features/<tu-area>/` o dentro del archivo de la pantalla, y avísame.
2. **No cambies la lógica ni los servicios** (hooks, `useServices`, contratos, `src/core`, `src/platform`). Solo presentación. Conserva los textos con significado funcional, `accessibilityLabel`/`accessibilityRole` y los `testID`; si cambias el texto de un botón, que siga diciendo lo mismo en esencia.
3. **Sin emojis como íconos**: usa `Icon`. Sin imágenes remotas (todo offline).
4. Zonas táctiles ≥ 48 px (pánico ≥ 96), contraste AA, texto en español (es-CO).
5. Respeta `SafeAreaView` de `react-native-safe-area-context` (nunca el de `react-native`) y `ScrollView` con `contentContainerStyle`.
6. No uses `fontWeight` sin `Text` del proyecto ni `fontFamily` a mano; los pesos pasan por `Text`.
7. **No ejecutes gradle, pods ni yarn, ni jest.** Valida con `npx tsc --noEmit -p tsconfig.app.json` solo al terminar (la máquina es compartida). La comprobación en el teléfono la hago yo con el equipo conectado.
8. No hagas `git commit`/`push`.
9. Cuando termines, avísame con: `herdr agent prompt w4:p1 "<tu-nombre> TERMINADO: <archivos tocados · qué quedó distinto al mockup>"` (o `BLOQUEADO: <motivo>`). Después deja el resumen en tu respuesta.

## Paquetes
| Agente | Pantallas (archivos en `src/ui/screens/` salvo indicación) | Mockup |
|---|---|---|
| **D1** | `SplashScreen`, `HomeScreen` | `inicio_earthquake_tracker` + el primer teléfono de `image.png` (splash: logo con anillo Prevención·Durante·Después, «EARTHQUAKE TRACKER», lema «PREPARA · PROTÉGETE · ACTÚA · AYUDA», skyline difuminado) |
| **D2** | `DuringScreen`, `EmergencyActiveScreen`, `PanicModal`, y `components/SeveritySelector.tsx`, `components/PanicButton.tsx` (estos tres **sí** puedes editarlos) | `durante_el_sismo_emergencia`, `modo_crisis_sos_y_baliza_ble` |
| **D3** | `PreventionScreen`, `GuidesListScreen`, `GuideReaderScreen`, `KitScreen`, `FamilyPlanScreen` | `prevenci_n_mochila_y_simulacros` |
| **D4** | `QuizLevelsScreen`, `QuizScreen`, `AchievementsScreen`, `AlertsScreen` | `trivias_y_logros_gamificados`, `centro_de_alertas_s_smicas` |
| **D5** | `MapScreen`, `MapRegionsScreen`, `AfterScreen`, `AidScreen`, `AidRequestScreen`, `ReportScreen` | `mapa_de_zonas_seguras`, `despu_s_ayuda_y_donaciones` |
| **D6** | `ProfileScreen`, `MedicalScreen`, `UnlockScreen`, `OnboardingScreen`, `PermissionsScreen`, `SyncScreen`, `RescuerScreen`, `DevScenariosScreen` | `mi_perfil_y_contactos_de_emergencia` (las demás no tienen mockup: aplica DESIGN.md con coherencia: mismas tarjetas, botones, tipografía y cabecera) |

## Criterio de «terminado»
La captura de tu pantalla en el teléfono se parece a `screen.png`: misma jerarquía, tipografía, colores, íconos, radios y espaciado, con los datos reales de la app. Donde el mockup muestre datos que la app no tiene (por ejemplo «Intensidad estimada: Moderada»), usa lo que el servicio ofrezca o un texto neutro y dímelo; **no inventes datos** ni muestres valores simulados como si fueran reales.
