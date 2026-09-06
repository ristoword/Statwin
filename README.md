# STATWIN — Sports Analytics AI

Piattaforma SaaS di **analisi statistica sportiva**. Il primo sport attivo è il **calcio**. L'architettura è multi-sport: basketball, volleyball, tennis, ippica, baseball e F1 sono moduli predisposti.

STATWIN non è un bookmaker. Le probabilità sono **stime**, non certezze. Non promette vincite. Accesso 18+.

## Stack

- Backend: NestJS, Prisma, PostgreSQL, Redis, BullMQ, JWT, Swagger
- Frontend: Next.js (porta 3000)
- Admin: Next.js (porta 3002)
- Monorepo: npm workspaces + Turborepo

## Avvio locale

Serve Node.js 20+ e PostgreSQL 16. Su questo PC PostgreSQL è già installato come servizio Windows `postgresql-x64-16`.

```bash
copy .env.example .env
npm install
npx prisma generate --schema=prisma/schema.prisma
npx prisma db push --schema=prisma/schema.prisma
npm run db:seed
npm run dev:api
npm run dev:web
npm run dev:admin
```

Database locale:

- host `localhost:5432`
- database `statwin`
- user `statwin` / password `statwin_secret`
- superuser di installazione: `postgres` / `postgres`

Account seed admin: `admin@statwin.local` / `ChangeMeAdmin1!`

Redis è opzionale in questa fase (i job restano idle). Docker Compose resta disponibile se preferisci i container.

- API: http://localhost:3001/api/v1/health
- Swagger: http://localhost:3001/docs
- Web: http://localhost:3000
- Admin: http://localhost:3002

Stack Docker completo:

```bash
docker compose --profile full up --build
```

## API versionate

Prefisso: `/api/v1`

- `/auth` register, login, refresh, logout, password reset, email verification
- `/users/me`
- `/subscriptions`
- `/sports`
- `/football`
- `/matches`
- `/statistics`
- `/predictions` (piano PREMIUM+)
- `/ai` (piano PRO)
- `/notifications`
- `/admin` (ruolo ADMIN)
- `/health`

## Architettura

```
CORE COMUNE + SPORT MODULES + DATA PROVIDERS
+ STATISTICS ENGINE + PREDICTION ENGINE + AI ENGINE
```

Il motore statistico è sport-agnostico. Il modello predittivo è sostituibile via DI. OpenAI è un adapter, mai chiamato dai controller.

Provider calcio attuale: **OpenLigaDB** (Bundesliga, dati reali). Sync:

```bash
curl -X POST http://localhost:3001/api/v1/football/sync
```

Per aggiungere la 2. Bundesliga: `OPENLIGADB_LEAGUES=bl1,bl2` in `.env`. Un altro provider si collega implementando `FootballDataProvider`, senza toccare i controller.

## Piani

| Piano   | Funzioni                         |
| ------- | -------------------------------- |
| FREE    | Dati e statistiche               |
| PREMIUM | + probabilità modellistiche      |
| PRO     | + report AI                      |

## Qualità

```bash
npm run lint
npm run typecheck
npm test
```

Verificato in questa base:

- `npm install`
- typecheck API / web / admin
- test unitari API (7/7)
- `nest build`, `next build` web e admin
- Prisma generate OK
- Docker Compose definito (postgres + redis; profilo `full` per API/web)
