# Árbol de Navegación – EarthQuakeTracker (S-E2 / SA-002)

## 1. Principio Rector de Navegación
- **Flujo de Pánico en ≤ 2 toques:** Accesible de forma global mediante botón persistente en la cabecera / barra principal o pestaña Inicio.
- **Funcionamiento 100 % Offline:** Ninguna transición de pantalla queda bloqueada esperando respuesta de red.
- **Navegador:** Implementado con React Navigation (`@react-navigation/native`, `@react-navigation/bottom-tabs`, `@react-navigation/native-stack`).

## 2. Diagrama de Navegación

```mermaid
flowchart TD
  Splash["/splash (Verificación de cuenta y bienvenida)"] --> Onboarding["/onboarding (Consentimiento Habeas Data + PIN)"]
  Splash --> MainTabs["/main (Tab Bar Global)"]
  Onboarding --> MainTabs

  subgraph MainTabs["Navegación Principal (Bottom Tabs)"]
    HomeTab["/home (Inicio: Pánico Primario, Accesos Rápidos, Estado)"]
    MapTab["/map (Mapa Offline de Bogotá + POIs)"]
    AlertsTab["/alerts (Detección de Sismos + Historial)"]
    ProfileTab["/profile (Mi Perfil, Desbloqueo, Contactos SOS)"]
  end

  subgraph PanicFlow["Flujo Crítico de Emergencia (Modal / Stack Prioritario)"]
    HomeTab --> PanicOverlay["/panic (Selector de Gravedad en 3 opciones)"]
    PanicOverlay --> Countdown["Cancelación de 3 segundos"]
    Countdown --> ActiveEmergency["/emergency (Modo Activo: Baliza BLE, Malla, Flash/Tono)"]
    ActiveEmergency --> DuringScreen["/during (Acciones Durante: Agáchate/Cúbrete/Agárrate)"]
    ActiveEmergency --> StopConfirm["Detener Emergencia (Confirmación)"]
    StopConfirm --> AfterScreen["/after (Acciones Después: Estoy a salvo / Reportar)"]
  end

  subgraph PreventionFlow["Stack Prevención"]
    HomeTab --> PreventionHub["/prevention (Hub Educativo)"]
    PreventionHub --> GuidesList["/guides (Lista de Guías Offline)"]
    GuidesList --> GuideReader["/guides/:id (Lector Markdown)"]
    PreventionHub --> QuizLevels["/quiz (Selector de Niveles 1-3)"]
    QuizLevels --> QuizSession["/quiz/:levelId (Motor de Preguntas)"]
    PreventionHub --> Achievements["/achievements (Insignias y Progreso)"]
    PreventionHub --> FamilyPlan["/plan (Checklist Plan Familiar)"]
    PreventionHub --> KitChecklist["/kit (Checklist Mochila de Emergencia)"]
  end

  subgraph SecondaryScreens["Pantallas Secundarias y Utilidades"]
    ProfileTab --> UnlockModal["/unlock (Desbloqueo PIN / Biometría)"]
    ProfileTab --> MedicalCard["/medical (Ficha Médica Cifrada)"]
    MapTab --> MapRegions["/map/regions (Descarga de Paquetes de Tiles)"]
    AfterScreen --> ReportDamage["/report (Reportar Daño Estructural/Vías)"]
    AfterScreen --> RequestAid["/aid-request (Solicitar Ayuda Inmediata)"]
    AfterScreen --> AidDirectory["/aid (Directorio Oficial de Ayuda y Donaciones)"]
    HomeTab --> SyncStatusScreen["/sync (Centro de Sincronización Local)"]
    HomeTab --> RescuerScreen["/rescuer (Modo Socorrista - Recepción GATT)"]
    HomeTab --> DevScenarios["/dev (Panel de Pruebas DevScenarios)"]
  end
```

## 3. Matriz de Rutas y Accesibilidad

| Ruta | Tipo | Requisitos de Acceso | Servicio Contrato Principal |
| --- | --- | --- | --- |
| `/splash` | Stack | Ninguno | `SessionService.hasAccount()` |
| `/onboarding` | Stack | Solo en primera apertura | `SessionService.createLocalAccount()` |
| `/home` | Tab | Público | `EmergencyService`, `SyncService`, `PowerService` |
| `/map` | Tab | Público (Bogotá offline) | `PoiService`, `TileService` |
| `/alerts` | Tab | Público | `AlertsService`, `SensorService` |
| `/profile` | Tab | Público (detalles sensibles protegidos) | `SessionService`, `MedicalProfileService` |
| `/panic` | Modal prioritario | Público (≤ 2 toques desde `/home`) | `EmergencyService.requestPanic()`, `selectSeverity()` |
| `/emergency` | Fullscreen activo | Estado `phase === 'ACTIVE'` | `EmergencyService`, `MeshService`, `SignalingController` |
| `/during` | Stack / Overlay | Durante la sacudida | `EmergencyService`, `SensorService` |
| `/after` | Stack | Post-emergencia | `EmergencyService.markSafe()`, `ReportService` |
| `/medical` | Stack seguro | Requiere sesión desbloqueada (`isUnlocked`) | `MedicalProfileService` |
| `/unlock` | Modal de seguridad | PIN de 6 dígitos o huella/FaceID | `SessionService.unlock()` |
| `/guides` | Stack | Público | `ContentService.listGuides()` |
| `/guides/:id` | Stack | Público | `ContentService.getGuideMarkdown()` |
| `/quiz` | Stack | Público | `ContentService.getQuizBank()`, `ProgressRepository` |
| `/quiz/:levelId` | Stack | Nivel previo ≥ 70 % | `ProgressRepository.saveAttempt()` |
| `/achievements` | Stack | Público | `ProgressRepository.listBadges()` |
| `/aid` | Stack | Solo canales oficiales | `AidDirectoryService` |
| `/sync` | Stack / Sheet | Indicador en cabecera | `SyncService.syncNow()` |
| `/rescuer` | Stack autenticado | Código oficial de socorrista | `RescuerService.enable()` |
| `/dev` | Oculto (Debug) | Solo compilación desarrollo / mock | `DevScenarioController` |
