# 02 – Estructura del repositorio y reglas de Git

## Monorepo
```
earthquake-tracker/
├─ src/
│  ├─ contracts/          ← JD (interfaces TS + tipos + códigos de error)  [SOLO TIPOS, sin lógica]
│  ├─ core/               ← JD (implementaciones reales)
│  │   ├─ container.ts    ← DI: registra real o mock según config
│  │   ├─ mocks/          ← JD (implementaciones falsas con escenarios)
│  │   ├─ security/ medical/ emergency/ mesh/ sensors/ sync/ content/ progress/ poi/ aid/ power/
│  ├─ ui/                 ← SA
│  │   ├─ app/ (App.tsx, providers)
│  │   ├─ navigation/
│  │   ├─ theme/ (tokens, light/dark)
│  │   ├─ components/ (design system)
│  │   ├─ screens/ (splash, home, prevencion, durante, despues, mapa, alertas, ayuda, perfil, panico, ficha, quiz, guia, rescatista)
│  │   ├─ features/ (quiz/engine, signaling, map)
│  │   ├─ hooks/ (useService, useEmergency, …)
│  │   └─ i18n/
├─ android/  ios/         ← JD (nativo)
├─ content/               ← SA (guias/*.md, quiz/*.json, legal/*.md)
├─ assets/ design/        ← SA
├─ server/                ← JD (api/, db/, workers/, tiles/, tests/)
├─ __tests__/{core,ui}/   ← JD / SA
├─ e2e/                   ← SA
├─ docs/                  ← ambos (docs/jd, docs/sa, docs/adr)
├─ CODEOWNERS
└─ package.json
```

## CODEOWNERS (pegar en `.github/CODEOWNERS`)
```
/src/contracts/        @juan-diego @santiago      # ambos aprueban
/src/core/             @juan-diego
/android/ /ios/        @juan-diego
/server/               @juan-diego
/__tests__/core/       @juan-diego
/src/ui/               @santiago
/content/              @santiago
/assets/ /design/      @santiago
/__tests__/ui/ /e2e/   @santiago
/package.json /yarn.lock /tsconfig.json /metro.config.js /babel.config.js   @juan-diego
/docs/adr/             @juan-diego @santiago
```
(Reemplazar handles por los de GitHub reales.) Activar *branch protection* en `main` y `develop`: PR obligatorio, CI verde, aprobación del CODEOWNER.

## Ramas
- `main`: estable, solo recibe de `develop` en cada hito (sem. 4, 8, 12, 16).
- `develop`: integración continua.
- `feat/jd/<tema>` y `feat/sa/<tema>`: una por tarea, vida corta (≤ 3 días).
- `contract/<tema>`: cambios en `src/contracts` (ver abajo).
- `hotfix/…` solo sobre `main`.

## Reglas de PR
1. Un PR toca **solo carpetas propias**. Si toca ajenas, el CI lo marca (script `scripts/check-ownership.sh` que compara con CODEOWNERS y falla).
2. Tamaño: ≤ 400 líneas de diff.
3. El otro **revisa** (code review cruzado) para conocer lo que consume, pero solo aprueba el dueño de la carpeta.
4. Commits tipo Conventional: `feat(ui): …`, `feat(core): …`, `fix(server): …`, `chore(contracts): …`.
5. `rebase` sobre `develop` antes de abrir PR; sin merge commits.
6. Dependencias nuevas (`package.json`): PR separado de 1 sola línea de propósito, con aviso en el chat; después el otro hace `pull`.
7. Nunca subir secretos (`.env`, claves, `google-services.json` de producción). `.env.example` obligatorio (JD).

## Protocolo de cambio de contrato (CCR)
1. Quien necesita el cambio abre issue `CCR: <nombre>` con: problema, propuesta de firma TS, impacto.
2. JD crea rama `contract/<nombre>` con el cambio **y** actualiza mocks en el mismo PR.
3. SA aprueba (debe poder compilar con los nuevos tipos).
4. Cambios **aditivos** (campo opcional, método nuevo) → cualquier día. Cambios **rompientes** → solo al inicio de semana o en puntos de integración, con aviso de 48 h. Versión semántica en `src/contracts/VERSION.md`.
5. Está prohibido "arreglar" un contrato editando el mock o el servicio sin pasar por el CCR.

## Convenciones de código
- TypeScript estricto (`strict: true`), sin `any` en contracts.
- Estado asíncrono en UI vía hooks que envuelven `subscribe()` (SA).
- Los servicios nunca importan nada de `src/ui`; la UI nunca importa de `src/core` (regla ESLint `no-restricted-imports`, configurada por JD en Semana 1).
- Errores: JD lanza `AppError { code, message, recoverable }` con códigos de `src/contracts/errors.ts`; SA mapea `code` → texto.

## Entornos
| Entorno | Uso | Dueño |
| --- | --- | --- |
| `MOCK` | Desarrollo de UI sin servicios reales (`APP_MODE=mock`) | SA lo usa; JD lo mantiene |
| `LOCAL` | Servicios reales en dispositivo, servidor local (docker-compose) | JD |
| `STAGING` | Servidor desplegado + builds de prueba (TestFlight/Internal testing) | JD |
| `PROD` | Tiendas | ambos, en Semana 16 |
