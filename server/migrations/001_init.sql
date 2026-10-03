-- EarthQuakeTracker – esquema inicial (ver PLAN_DESARROLLO/juan_diego_backend/03_servidor_api.md)

CREATE TABLE IF NOT EXISTS devices (
  id            TEXT PRIMARY KEY,
  pubkey        TEXT NOT NULL UNIQUE,
  platform      TEXT NOT NULL CHECK (platform IN ('android','ios')),
  app_version   TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked       BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS events (
  event_id     TEXT PRIMARY KEY,
  device_id    TEXT NOT NULL REFERENCES devices(id),
  type         TEXT NOT NULL,
  ts           TIMESTAMPTZ NOT NULL,
  payload      JSONB NOT NULL DEFAULT '{}',
  lat          DOUBLE PRECISION,
  lon          DOUBLE PRECISION,
  acc          DOUBLE PRECISION,
  received_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  status       TEXT NOT NULL DEFAULT 'RECEIVED'
);
CREATE INDEX IF NOT EXISTS events_device_idx ON events(device_id, ts);
CREATE INDEX IF NOT EXISTS events_type_idx ON events(type, ts);

CREATE TABLE IF NOT EXISTS seismic_readings (
  id            BIGSERIAL PRIMARY KEY,
  event_id      TEXT UNIQUE,
  device_id     TEXT NOT NULL,
  ts            TIMESTAMPTZ NOT NULL,
  peak_g        DOUBLE PRECISION NOT NULL,
  lat           DOUBLE PRECISION,
  lon           DOUBLE PRECISION,
  quorum_nodes  INTEGER NOT NULL DEFAULT 0,
  classification TEXT NOT NULL DEFAULT 'POSSIBLE'
);
CREATE INDEX IF NOT EXISTS readings_ts_idx ON seismic_readings(ts);

CREATE TABLE IF NOT EXISTS seismic_events (
  id             TEXT PRIMARY KEY,
  started_at     TIMESTAMPTZ NOT NULL,
  lat            DOUBLE PRECISION NOT NULL,
  lon            DOUBLE PRECISION NOT NULL,
  confidence     DOUBLE PRECISION NOT NULL,
  devices_count  INTEGER NOT NULL,
  confirmed      BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS pois (
  id          TEXT PRIMARY KEY,
  type        TEXT NOT NULL CHECK (type IN ('ALBERGUE','ACOPIO','BOMBEROS','SALUD','ZONA_SEGURA')),
  name        TEXT NOT NULL,
  lat         DOUBLE PRECISION NOT NULL,
  lon         DOUBLE PRECISION NOT NULL,
  address     TEXT,
  phone       TEXT,
  active      BOOLEAN NOT NULL DEFAULT true,
  source      TEXT,
  verified    BOOLEAN NOT NULL DEFAULT false,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pois_geo_idx ON pois(lat, lon);
CREATE INDEX IF NOT EXISTS pois_updated_idx ON pois(updated_at);

CREATE TABLE IF NOT EXISTS poi_reports (
  id         BIGSERIAL PRIMARY KEY,
  poi_id     TEXT NOT NULL,
  device_id  TEXT NOT NULL,
  reason     TEXT NOT NULL,
  note       TEXT,
  status     TEXT NOT NULL DEFAULT 'OPEN',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS aid_entities (
  id          TEXT PRIMARY KEY,
  data        JSONB NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS aid_needs (
  id          TEXT PRIMARY KEY,
  data        JSONB NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content_packages (
  version       TEXT PRIMARY KEY,
  manifest      JSONB NOT NULL,
  files         JSONB NOT NULL,
  published_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tile_regions (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  size_mb     DOUBLE PRECISION NOT NULL,
  hash        TEXT,
  version     TEXT NOT NULL,
  url         TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rescuer_codes (
  code_hash     TEXT PRIMARY KEY,
  organization  TEXT NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  revoked       BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS audit_log (
  id      BIGSERIAL PRIMARY KEY,
  actor   TEXT NOT NULL,
  action  TEXT NOT NULL,
  entity  TEXT NOT NULL,
  ts      TIMESTAMPTZ NOT NULL DEFAULT now()
);
