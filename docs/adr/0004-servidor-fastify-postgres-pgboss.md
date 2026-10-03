# ADR 0004 – Servidor Fastify + PostgreSQL + pg-boss (D-16, D-28, D-29, D-30)

- Estado: Aceptado · Decide: Juan Diego

## Decisión
Node.js + TypeScript + Fastify, Zod para validación, PostgreSQL (sin PostGIS; filtros por bounding box), cola con pg-boss (sin Redis). Hosting: Supabase (BD) + servicio Node. Dispositivos se autentican con clave pública Ed25519 y peticiones firmadas (timestamp ±5 min). **La ficha médica nunca se envía al servidor.**

## Consecuencias
Menos infraestructura que operar. Ingesta idempotente por `eventId` (ya implementada en `server/src/app.ts`).
