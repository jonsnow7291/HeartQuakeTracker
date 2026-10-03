# EarthQuakeTracker Server (API REST & Backend)

Servidor HTTP de sincronización, ingesta de eventos de emergencia y distribución de catálogos offline para **EarthQuakeTracker (MW-2026)**. Construido con **Node.js 22**, **Fastify 5**, **PostgreSQL 16**, validación estricta con **Zod 3** y autenticación criptográfica asimétrica basada en **Ed25519**.

---

## 1. Requisitos Previos

- **Node.js:** Versión $\ge 22.0.0$.
- **Yarn:** Versión 1.x (Classic).
- **PostgreSQL (Opcional para desarrollo local):** Versión 16. Si no se dispone de PostgreSQL, el servidor opera automáticamente con almacenamiento volátil en memoria (`MemoryStore`).
- **Docker & Docker Compose (Opcional):** Para levantar PostgreSQL en un contenedor listo para desarrollo.

---

## 2. Instalación

Desde la carpeta del servidor:

```bash
cd server
yarn install
```

O si te encuentras en la raíz del repositorio:
```bash
yarn --cwd server install
```

---

## 3. Variables de Entorno

El servidor carga su configuración desde variables de entorno según [`server/src/config.ts`](file:///home/lazarus/Downloads/uni/Ing.De Software/earthquake-tracker/server/src/config.ts) y la plantilla [`/.env.example`](file:///home/lazarus/Downloads/uni/Ing.De Software/earthquake-tracker/.env.example).

Copia la plantilla a tu archivo local `.env`:
```bash
cp ../.env.example .env
```

### Tabla de Variables de Configuración

| Variable | Tipo / Formato | Valor por Defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `PORT` | Entero | `3000` | Puerto TCP en el que escucha el servidor HTTP Fastify. |
| `DATABASE_URL` | URI de Postgres | *Ninguno* (modo en memoria) | Cadena de conexión a PostgreSQL (ej. `postgres://eqt:eqt_dev@localhost:5432/eqt`). Si no se define, el servidor utiliza `MemoryStore` en memoria RAM (se reinicia en blanco). |
| `ADMIN_TOKEN` | Cadena | *Ninguno* | Token secreto Bearer para autorizar las rutas administrativas `/admin/*`. Si no está definido, `/admin/*` responde `503 ADMIN_DISABLED`. |
| `SEED_ON_START` | Booleano (`true`/`false`) | `false` | Si se establece en `true`, carga automáticamente los datos semilla de `server/seed/*.json` al iniciar el servidor (funciona tanto en PostgreSQL como en memoria). |
| `SIGNATURE_SKEW_MS` | Entero (milisegundos) | `300000` (5 minutos) | Ventana máxima de tolerancia temporal permitida entre la marca de tiempo del cliente (`X-Timestamp`) y la hora del servidor para peticiones firmadas. |
| `RATE_LIMIT_PER_MIN` | Entero | `120` | Número máximo de peticiones por minuto permitidas por dirección IP/dispositivo (`0` desactiva el rate limiter). |
| `RESCUER_PEPPER` | Cadena secreta | `'dev-pepper-cambiar'` | Salting criptográfico (*pepper*) utilizado para generar los hashes SHA-256 de los códigos institucionales de socorristas. |
| `SERVER_SIGNING_KEY` | Clave privada Ed25519 (base64) | *Ninguno* (efímera) | Clave privada en formato PKCS#8 DER base64 con la que el servidor firma la lista de hashes de socorristas vigentes. Si se omite, el servidor genera una clave efímera en memoria al arrancar. |
| `TEST_DATABASE_URL` | URI de Postgres | *Ninguno* | Conexión a base de datos PostgreSQL dedicada para ejecutar los tests de integración en `yarn test`. |

---

## 4. Ejecución del Servidor

### Modo Desarrollo (Hot-Reload)
Utiliza `tsx watch` para reiniciar automáticamente el proceso ante cambios en el código TypeScript:

```bash
yarn dev
```

### Levantar con PostgreSQL local (Docker Compose)
Si deseas persistencia real sin instalar PostgreSQL manualmente en tu máquina:

```bash
# Desde la raíz del repositorio
docker compose up -d db

# Ejecutar el servidor apuntando al contenedor
DATABASE_URL=postgres://eqt:eqt_dev@localhost:5432/eqt yarn dev
```

### Modo Producción
Compila y ejecuta el punto de entrada principal:

```bash
yarn start
```

---

## 5. Migraciones de Base de Datos

Las migraciones SQL residen en el directorio `server/migrations/` y siguen el formato de nombres ordenados alfanuméricamente (ej. `001_init.sql`).

Para aplicar manualmente las migraciones pendientes:

```bash
DATABASE_URL=postgres://eqt:eqt_dev@localhost:5432/eqt yarn migrate
```

- Las migraciones se ejecutan de manera atómica dentro de una transacción SQL (`BEGIN ... COMMIT`).
- Se registran en la tabla de control `schema_migrations`.
- **Nota:** Si `DATABASE_URL` está configurada, el arranque estándar (`yarn dev` o `yarn start`) comprueba y aplica automáticamente las migraciones pendientes antes de abrir el puerto HTTP.

---

## 6. Carga de Datos Semilla (Seed)

El servidor incluye cargadores para poblar puntos de interés de Bogotá, entidades de ayuda oficiales y catálogo de necesidades desde `server/seed/*.json`:

> [!WARNING]
> **DATOS NO VERIFICADOS:** Todos los registros en `server/seed/` son datos de prueba marcados con `verified: false`. Consulta [`server/seed/README.md`](file:///home/lazarus/Downloads/uni/Ing.De Software/earthquake-tracker/server/seed/README.md) antes de utilizarlos en producción.

### Opción A: Carga automática al arrancar
Establece la variable de entorno:
```bash
SEED_ON_START=true yarn dev
```

### Opción B: Script explícito para PostgreSQL
```bash
DATABASE_URL=postgres://eqt:eqt_dev@localhost:5432/eqt yarn seed
```

---

## 7. Pruebas Automatizadas (Testing)

El servidor utiliza **Vitest** para pruebas unitarias y de integración:

```bash
yarn test
```

- **Pruebas en memoria:** Por defecto, los tests cubren autenticación Ed25519, rate limiting, validación Zod, ingesta idempotente y rutas de catálogo contra `MemoryStore` sin necesidad de una base de datos externa.
- **Pruebas con PostgreSQL real:** Si configuras la variable `TEST_DATABASE_URL`, la suite ejecuta automáticamente los tests de persistencia y concurrencia contra PostgreSQL (`server/tests/pgStore.test.ts`):
  ```bash
  TEST_DATABASE_URL=postgres://eqt:eqt_dev@localhost:5432/eqt_test yarn test
  ```

---

## 8. Estructura del Directorio

```
server/
├── migrations/
│   └── 001_init.sql              # Esquema SQL inicial (tablas devices, events, pois, etc.)
├── seed/
│   ├── README.md                 # Advertencia y documentación de datos semilla
│   ├── pois.json                 # 20 POIs reales de referencia en Bogotá
│   ├── entidades_ayuda.json      # Entidades de socorro (Defensa Civil, UNGRD, Cruz Roja, IDIGER)
│   └── necesidades.json          # 8 necesidades estandarizadas de ayuda humanitaria
├── src/
│   ├── domain/
│   │   └── events.ts             # Definición de tipos de eventos y esquemas Zod (batchSchema)
│   ├── routes/
│   │   ├── admin.ts              # Rutas /admin/* (POIs, ayudas, contenido, tiles, socorristas)
│   │   ├── catalogs.ts           # Rutas públicas y de ingesta (/v1/pois, /v1/aid, /v1/content, etc.)
│   │   ├── devices.ts            # Registro y prueba de posesión (/v1/devices/register)
│   │   ├── schemas.ts            # Esquemas de validación Zod de entrada/salida
│   │   └── sync.ts               # Ingesta por lotes store-and-forward (/v1/sync/batch)
│   ├── security/
│   │   ├── deviceAuth.ts         # Verificación Ed25519, nonces, canonicalRequest y requireDevice
│   │   └── rateLimit.ts          # Limitador de tasa en memoria por IP/dispositivo
│   ├── services/
│   │   ├── rescuer.ts            # Hashing de códigos y firma de lista de socorristas
│   │   └── seismic.ts            # Detección colaborativa y agregación de lecturas sísmicas
│   ├── store/
│   │   ├── memoryStore.ts        # Implementación en memoria volátil para desarrollo rápido
│   │   ├── migrate.ts            # Lógica de aplicación secuencial de migraciones SQL
│   │   ├── pgStore.ts            # Implementación sobre PostgreSQL con pool de conexiones pg
│   │   └── types.ts              # Interfaz Store y tipos de persistencia
│   ├── app.ts                    # Fábrica de la aplicación Fastify (buildApp)
│   ├── config.ts                 # Carga y validación de variables de entorno (loadConfig)
│   ├── main.ts                   # Punto de entrada ejecutable del servidor
│   └── seed.ts                   # Lógica de carga de datos semilla (seedStore)
├── tests/
│   ├── admin.test.ts             # Tests de rutas administrativas y publicación
│   ├── api.test.ts               # Tests de endpoints públicos y catálogos
│   ├── auth.test.ts              # Tests de firma Ed25519, nonces y timestamps
│   ├── helpers.ts                # Clientes de prueba simulados y generadores de firmas
│   ├── pgStore.test.ts           # Tests de integración contra PostgreSQL real
│   ├── rescuer.test.ts           # Tests de códigos y firmas de socorristas
│   └── sync.test.ts              # Tests de ingesta por lotes, idempotencia y ACKs
├── Dockerfile                    # Definición de contenedor Docker para despliegue
├── package.json                  # Scripts y dependencias del servidor
└── tsconfig.json                 # Configuración de TypeScript en modo estricto
```
