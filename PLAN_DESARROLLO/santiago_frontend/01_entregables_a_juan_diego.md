# Santiago → Juan Diego: qué le tienes que entregar

| # | Entregable | Semana | Criterio de aceptación | Lo usa JD para… |
| --- | --- | --- | --- | --- |
| S-E1 | **Design tokens v0.1** (`design/tokens.json`: colores, tipografía, espaciados, radios, elevaciones; claro/oscuro) | 1 | Contraste AA verificado; nombres estables | Colores de notificación persistente, splash nativo |
| S-E2 | **Árbol de navegación** (`design/navigation.md`): pestañas, rutas y quién llama a qué | 1 | Cubre las 9 pantallas + las implícitas (pánico, ficha, quiz, guía, socorrista, onboarding) | Verificar que los contratos cubren cada pantalla |
| S-E3 | **Catálogo de pantallas con estados** (`design/screens.md`): por pantalla: datos que necesita, acciones, estados vacío/carga/error/offline | 1–2 | Cada dato aparece en algún contrato; si no, CCR | Detectar contratos faltantes pronto |
| S-E4 | **Texto de permisos y notificación persistente** (`design/permissions_copy.md`): títulos/mensajes de Android/iOS (BLE, ubicación, notificaciones, sensores), texto y icono del Foreground Service | 3 | Aprobado por JD técnicamente | Info.plist, AndroidManifest, notificación nativa |
| S-E5 | **Textos de consentimiento Habeas Data y Términos** (borrador) (`content/legal/`) | 3–4 (final S15) | Revisado por asesoría legal en S15 | Flujo de cuenta y tratamiento de datos |
| S-E6 | **Tabla de errores → texto** (`design/errors_copy.md`) para todos los `ErrorCode` | 4 | Cobertura 100 % de `ErrorCode` | Verificar que cada error tiene respuesta de UX |
| S-E7 | **Prototipo navegable + maquetas finales** (Affinity/Figma exportadas) | 4 (H1) | Cumple RNF-03 y mockups de la propuesta | Dossier H1, revisión de viabilidad |
| S-E8 | **Contenido educativo** (`content/guias/*.md`, `content/quiz/*.json`) conforme al esquema | 5 (3 guías), 7 (6), 8 (8 + ≥60 preguntas) | `yarn validate-content` verde | Empaquetado y manifest del `ContentService` |
| S-E9 | **Banco de preguntas v1** con `protocolRef` y `guideId` | 8 | ≥60 preguntas, ≥3 niveles, todas con fuente oficial | Persistencia/progreso |
| S-E10 | **Assets**: iconos, ilustraciones (Agáchate/Cúbrete/Agárrate), splash, fuentes, **sonido del tono SOS** (archivo + parámetros de frecuencia) | 2–6 | Formatos y pesos acordados (offline) | Empaquetado nativo (ícono app, splash) |
| S-E11 | **Casos de aceptación de UI por RF** (`__tests__/ui/acceptance.md`) en Gherkin corto | 4, actualizado cada semana | Cada RF con ≥3 escenarios | Alinear servicios con la UI |
| S-E12 | **Feedback de contratos** (issues/CCR) | continuo, ≤24 h tras recibir oleada | Cada hallazgo con repro | Ajuste rápido |
| S-E13 | **Pantalla DevScenarios** (debug) sobre `DevScenarioController` | 2 | Activa los 11 escenarios | Probar servicios reales vs mocks |
| S-E14 | **Reporte de usabilidad v1 / final** + **encuesta aplicada y resultados** | 12 / 13–16 | Muestra definida; hallazgos priorizados | Priorizar fixes técnicos |
| S-E15 | **Manual de usuario** + **capturas y textos de tiendas** | 15–16 | Revisado por JD | Publicación |
| S-E16 | **Apoyo en pruebas de campo** (conteo, reportes, segundo operador de dispositivos) | 8, 10, 12–14 | Planilla de resultados completada | Informes de estrés |

## Dependencias de Santiago hacia JD (qué puede bloquearlo)
| Necesita | De JD | Plan si se retrasa |
| --- | --- | --- |
| Contratos v0.1 | S1 | No puede avanzar pantallas dependientes: mientras tanto hace tokens/navegación/componentes |
| Mocks con escenarios | S1–S2 | Usa datos estáticos locales temporalmente (en `src/ui/dev/`) — se retiran luego |
| Servicios reales | por oleada | Sigue en mock y reprograma integración |
| Esquemas de contenido | S1 | Redacta en Markdown libre y adapta después |
| Builds de prueba | S4, S8, S12 | Usa emulador/simulador con mocks |

## Lo que SA NO debe hacer
- No importar `src/core` (lo bloquea ESLint).
- No inventar campos de datos en pantalla: si falta, CCR.
- No editar nativo (`android/`, `ios/`): pedir a JD (p. ej. permiso de linterna).
- No cambiar `package.json` sin PR pequeño y aviso.
