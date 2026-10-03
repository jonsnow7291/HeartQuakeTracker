# 03 – Contratos TypeScript (borrador v0.1 para firmar en Semana 1)

Dueño: **Juan Diego** (publica) · Revisor/aprobador: **Santiago**. Archivo destino: `src/contracts/*.ts`. Solo tipos e interfaces. JD entrega estos contratos + mocks al **final de la Semana 1** (ver su plan).

Convenciones: todo método asíncrono devuelve `Promise`; todo flujo de eventos usa `subscribe(cb): Unsubscribe`; errores = `AppError`.

## types.ts
```ts
export type Unsubscribe = () => void;
export type ISODate = string;
export type Severity = 'ILESO' | 'CON_LESIONES' | 'ATRAPADO';

export interface GeoPoint { lat: number; lon: number; ts: ISODate; accuracyM?: number }
export interface AppError { code: ErrorCode; message: string; recoverable: boolean }
export interface Page<T> { items: T[]; next?: string }
```

## errors.ts
```ts
export type ErrorCode =
  | 'PERMISSION_DENIED' | 'BLUETOOTH_OFF' | 'LOCATION_OFF' | 'NO_FLASH' | 'NO_SENSORS'
  | 'CONTENT_CORRUPT' | 'CONTENT_MISSING' | 'STORAGE_FAILED' | 'AUTH_REQUIRED' | 'AUTH_FAILED'
  | 'MAP_NOT_CACHED' | 'NETWORK_UNAVAILABLE' | 'SYNC_PARTIAL' | 'RECEIVER_NOT_AUTHORIZED'
  | 'VALIDATION' | 'UNKNOWN';
```

## session.ts  (RF-04; decisión D-01 abierta)
```ts
export interface SessionService {
  isUnlocked(): boolean;
  hasAccount(): Promise<boolean>;
  createLocalAccount(input: { displayName: string; email?: string; pin: string; acceptTerms: true }): Promise<void>;
  unlock(method: { pin: string } | { biometric: true }): Promise<void>; // AUTH_FAILED
  lock(): void;
  subscribe(cb: (unlocked: boolean) => void): Unsubscribe;
  getUser(): Promise<{ id: string; displayName: string; email?: string }>;
}
```

## permissions.ts
```ts
export type PermissionKind = 'location' | 'bluetooth' | 'notifications' | 'motion' | 'camera_flash' | 'background_location';
export type PermissionStatus = 'granted' | 'denied' | 'blocked' | 'undetermined';
export interface PermissionsService {
  status(kind: PermissionKind): Promise<PermissionStatus>;
  request(kind: PermissionKind): Promise<PermissionStatus>;
  missingForEmergency(): Promise<PermissionKind[]>;   // lo que falta para pánico+baliza
  openSettings(): Promise<void>;
}
```

## medical.ts  (RF-04, RF-13)
```ts
export interface EmergencyContact { name: string; phone: string; relation?: string }
export interface MedicalProfile {
  bloodType?: 'A+'|'A-'|'B+'|'B-'|'AB+'|'AB-'|'O+'|'O-';
  allergies: string[]; conditions: string[]; medications?: string[];
  contacts: EmergencyContact[]; notes?: string; updatedAt: ISODate;
}
export interface MedicalProfileService {
  exists(): Promise<boolean>;
  get(): Promise<MedicalProfile | null>;             // requiere sesión desbloqueada
  save(p: Omit<MedicalProfile,'updatedAt'>): Promise<void>; // VALIDATION si faltan obligatorios
  remove(): Promise<void>;
  requiredFields(): (keyof MedicalProfile)[];
}
```

## emergency.ts  (RF-05, RF-06, RF-07)
```ts
export type EmergencyPhase = 'IDLE' | 'CONFIRMING' | 'ACTIVE' | 'STOPPED';
export interface EmergencyState {
  phase: EmergencyPhase;
  severity?: Severity;
  startedAt?: ISODate;
  cancelDeadline?: ISODate;        // en CONFIRMING: hasta cuándo se puede cancelar (3 s)
  lowPower: boolean;               // SOS prolongado (<20 % batería)
  beaconActive: boolean; meshActive: boolean; medicalCardArmed: boolean;
  lastPosition?: GeoPoint;
}
export interface EmergencyService {
  getState(): EmergencyState;
  subscribe(cb: (s: EmergencyState) => void): Unsubscribe;
  requestPanic(): Promise<{ missing: PermissionKind[] }>; // IDLE→(permisos) ; si faltan, no avanza
  selectSeverity(s: Severity): Promise<void>;             // →CONFIRMING (3 s) → ACTIVE
  cancel(): Promise<void>;                                // solo en CONFIRMING
  stop(): Promise<void>;                                  // ACTIVE → STOPPED → IDLE
  markSafe(): Promise<void>;                              // "Estoy a salvo" (encola reporte)
}
```
RF-06 (flash/tono) **no** forma parte de este servicio: lo implementa SA suscribiéndose a `subscribe` (ACTIVE ⇒ encender, otro ⇒ apagar; `lowPower` ⇒ pulsos intermitentes más espaciados).

## mesh.ts  (RF-07, RF-08)
```ts
export interface NearbyNode { idEphemeral: string; severity?: Severity; distanceHint: 'near'|'mid'|'far'; rssi: number; lastSeen: ISODate; position?: GeoPoint; verified: boolean }
export interface MeshStatus { scanning: boolean; advertising: boolean; bluetoothOn: boolean; nodesInRange: number; relayedLastMin: number; bridgeNearby: boolean }
export interface MeshService {
  getStatus(): MeshStatus;
  subscribeStatus(cb: (s: MeshStatus) => void): Unsubscribe;
  listNearby(): NearbyNode[];
  subscribeNearby(cb: (nodes: NearbyNode[]) => void): Unsubscribe;
}
```

## rescuer.ts  (RF-13)
```ts
export interface ReceivedMedicalCard { fromIdEphemeral: string; severity: Severity; receivedAt: ISODate; position?: GeoPoint; profile: Partial<MedicalProfile>; incomplete: boolean; signatureValid: boolean }
export interface RescuerService {
  isRescuerModeAvailable(): boolean;
  enable(credential: { code: string }): Promise<void>;   // RECEIVER_NOT_AUTHORIZED
  disable(): void;
  subscribeReceived(cb: (c: ReceivedMedicalCard) => void): Unsubscribe;
  listReceived(): Promise<ReceivedMedicalCard[]>;
}
```

## sensors.ts / alerts.ts  (RF-09)
```ts
export interface SeismicAlert { id: string; ts: ISODate; level: 'POSSIBLE'|'CONFIRMED'|'DISCARDED'; peakG: number; quorumNodes: number; note?: string }
export interface SensorService {
  isAvailable(): boolean;
  start(): Promise<void>; stop(): void;
  subscribe(cb: (a: SeismicAlert) => void): Unsubscribe;
}
export interface AlertItem { id: string; kind: 'SEISMIC'|'DRILL'|'INFO'; title: string; body?: string; ts: ISODate; seismic?: SeismicAlert }
export interface AlertsService {
  list(page?: string): Promise<Page<AlertItem>>;
  subscribeNew(cb: (a: AlertItem) => void): Unsubscribe;
  scheduleDrill(at: ISODate, title: string): Promise<void>;
}
```

## sync.ts  (RF-12)
```ts
export interface SyncStatus { online: boolean; pending: number; lastSyncAt?: ISODate; syncing: boolean; lastError?: AppError }
export interface SyncService {
  getStatus(): SyncStatus;
  subscribe(cb: (s: SyncStatus) => void): Unsubscribe;
  syncNow(): Promise<void>;
}
export interface ReportService {
  reportDamage(input: { category: 'ESTRUCTURAL'|'SERVICIOS'|'VIAS'|'OTRO'; description: string; position?: GeoPoint }): Promise<void>;
  requestAid(input: { need: string; people: number; position?: GeoPoint }): Promise<void>;
  listOwnReports(): Promise<{ id: string; kind: string; ts: ISODate; synced: boolean }[]>;
}
```

## content.ts  (RF-01)
```ts
export interface GuideMeta { id: string; title: string; summary: string; category: 'MOCHILA'|'ESTRUCTURAL'|'PLAN_FAMILIAR'|'PRIMEROS_AUXILIOS'|'OTRO'; version: string; readMin: number }
export interface ContentService {
  listGuides(): Promise<GuideMeta[]>;
  getGuideMarkdown(id: string): Promise<string>;     // CONTENT_CORRUPT | CONTENT_MISSING
  checkUpdates(): Promise<{ available: boolean; applied: boolean }>; // en segundo plano
  getQuizBank(): Promise<QuizBank>;                  // JSON validado contra schema
}
export interface QuizBank { levels: { id: string; order: number; title: string; questions: { id: string; text: string; options: string[]; correctIndex: number; explanation: string; protocolRef?: string; guideId?: string }[] }[] }
```
> El **JSON/MD** vive en `content/` (SA). JD valida esquema y los distribuye (empaqueta/versiona/actualiza). Esquema oficial en `content/schema/*.json` (lo define JD en Semana 1, SA lo respeta).

## progress.ts  (RF-02/03)
```ts
export interface QuizAttempt { levelId: string; score: number; maxScore: number; answers: { questionId: string; chosen: number; correct: boolean }[]; finishedAt?: ISODate; partial: boolean }
export interface Badge { code: string; title: string; awardedAt?: ISODate }
export interface ProgressRepository {
  saveAttempt(a: QuizAttempt): Promise<void>;
  getPartial(levelId: string): Promise<QuizAttempt | null>;
  getLevelStatus(): Promise<{ levelId: string; unlocked: boolean; bestScore: number; completed: boolean }[]>;
  listBadges(): Promise<Badge[]>;
  awardBadge(code: string): Promise<void>;
  resetAll(): Promise<void>;                          // A.8.10 eliminación
}
```

## map.ts  (RF-10)
```ts
export type PoiType = 'ALBERGUE'|'ACOPIO'|'BOMBEROS'|'SALUD'|'ZONA_SEGURA';
export interface Poi { id: string; type: PoiType; name: string; lat: number; lon: number; address?: string; phone?: string; active: boolean }
export interface PoiService {
  listInBounds(b: { minLat: number; minLon: number; maxLat: number; maxLon: number }, types?: PoiType[]): Promise<Poi[]>;
  nearest(p: GeoPoint, types?: PoiType[], limit?: number): Promise<(Poi & { distanceM: number })[]>;
  reportProblem(poiId: string, reason: 'NO_DISPONIBLE'|'DIRECCION_ERRONEA'|'OTRO', note?: string): Promise<void>;
}
export interface TileRegion { id: string; name: string; sizeMB: number; downloaded: boolean; version: string }
export interface TileService {
  listRegions(): Promise<TileRegion[]>;
  download(regionId: string, onProgress: (pct: number) => void): Promise<void>; // NETWORK_UNAVAILABLE
  getLocalTilesPath(regionId: string): Promise<string | null>;   // ruta al .mbtiles
  remove(regionId: string): Promise<void>;
}
```
La ruta estimada la calcula SA en UI (línea recta/ruteo básico sobre `nearest`). Si SA necesita un grafo de rutas, se abre un CCR.

## aid.ts  (RF-11)
```ts
export interface AidEntity { id: string; name: string; kind: 'GOBIERNO'|'ONG'|'SOCORRO'; description?: string; active: boolean; verifiedAt: ISODate; channels: { type: 'WEB'|'TEL'|'CUENTA'|'EMAIL'; value: string; requirements?: string; active: boolean }[] }
export interface AidNeed { id: string; category: string; label: string; urgency: 'ALTA'|'MEDIA'|'BAJA' }
export interface AidDirectoryService { listEntities(): Promise<AidEntity[]>; listNeeds(): Promise<AidNeed[]> }
```

## power.ts  (RNF-02)
```ts
export interface PowerService { getLevel(): number; subscribe(cb: (level: number, charging: boolean) => void): Unsubscribe }
```

## container.ts (acceso desde la UI)
```ts
export interface Services {
  session: SessionService; permissions: PermissionsService; medical: MedicalProfileService;
  emergency: EmergencyService; mesh: MeshService; rescuer: RescuerService;
  sensors: SensorService; alerts: AlertsService; sync: SyncService; reports: ReportService;
  content: ContentService; progress: ProgressRepository; poi: PoiService; tiles: TileService;
  aid: AidDirectoryService; power: PowerService;
}
// SA lo usa así: const { emergency } = useServices();   (hook en src/ui/hooks, envuelve el container)
```

## dev.ts (solo mocks / debug)
```ts
export interface DevScenario { id: string; title: string; description: string }
export interface DevScenarioController {
  list(): DevScenario[];
  activate(id: string): void;   // p. ej. 'sismo_detectado', 'mesh_5_nodos', 'bluetooth_apagado'
  reset(): void;
  active(): string[];
}
```

## Mocks que debe incluir JD (ver su plan)
Cada servicio tiene un mock en memoria con **escenarios** activables desde una pantalla oculta de depuración (`DevScenarios`): "sismo detectado", "mesh con 5 nodos", "sin Bluetooth", "sin permisos", "contenido corrupto", "sync parcial", "socorrista recibe ficha", "batería 15 %". Esa pantalla de debug la construye SA a partir de `DevScenarioController` que expone JD.
