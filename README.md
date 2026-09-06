# STATWIN — Sports Analytics AI

Piattaforma SaaS di **analisi statistica sportiva**. Il **calcio** (TheSportsDB + OpenLigaDB) e gli altri desk TheSportsDB — basket, tennis, pallavolo, MLB, NFL, NHL, F1, rugby, pallamano, UFC, golf, ciclismo, IPL, darts — si aggiornano via sync. **Ippica** resta vuota: nessun feed pubblico legale. Nessun risultato inventato.

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

Account admin ufficiale: `basilepaolo@me.com` (password solo in `.env` locale: `ADMIN_EMAIL` / `ADMIN_PASSWORD`). Il seed non cancella gli altri utenti.

Redis è opzionale in questa fase (i job restano idle). Docker Compose resta disponibile se preferisci i container.

- API: http://localhost:3001/api/v1/health
- Swagger: http://localhost:3001/docs
- Web: http://localhost:3000
- Admin: http://localhost:3002

Stack Docker completo:

```bash
docker compose --profile full up --build
```

## Deploy su Railway

Il servizio pubblico è pensato per **https://statwin-production.up.railway.app**. Un solo servizio avvia web (porta `$PORT`) e API interna (`127.0.0.1:3001`). Il frontend proxya `/api` e `/docs` verso l'API.

### 1. Plugin nel progetto Railway

- **Postgres**
- **Redis**

### 2. Servizio dal repo `ristoword/Statwin`

Builder: Dockerfile (`railway.toml` in root). Dominio: `statwin-production.up.railway.app`.

### 3. Variabili del servizio

| Variabile | Valore |
|---|---|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | stringa lunga casuale |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `REDIS_URL` | `${{Redis.REDIS_URL}}` |
| `REDIS_PRIVATE_URL` | `${{Redis.REDIS_PRIVATE_URL}}` |
| `FRONTEND_URL` | `https://statwin-production.up.railway.app` |
| `ADMIN_URL` | `https://statwin-production.up.railway.app` |
| `API_INTERNAL_URL` | `http://127.0.0.1:3001` |
| `SEED_ON_BOOT` | `true` per upsertare l'admin ufficiale (non cancella gli account clienti). Poi `false` se non vuoi riscrivere la password ad ogni boot. |
| `ADMIN_EMAIL` | `basilepaolo@me.com` |
| `ADMIN_PASSWORD` | la password scelta dal owner, solo in Railway Variables / `.env` locale, mai in git |
| `FOOTBALL_DATA_PROVIDER` | `composite` |
| `OPENLIGADB_BASE_URL` | `https://api.openligadb.de` |
| `OPENLIGADB_SEASON` | `2026` |
| `OPENLIGADB_LEAGUES` | `bl1,bl2,dfb` |
| `THESPORTSDB_LEAGUES` | Premier, La Liga, Serie A/B/C, Ligue 1/2, Eredivisie, UEFA CL/EL, … |
| `OPENAI_API_KEY` | chiave OpenAI (solo Railway / `.env` locale) |
| `OPENAI_MODEL` | `gpt-4o` |
| `OPENAI_MAX_TOKENS` | `1024` |
| `OPENAI_TEMPERATURE` | `0.7` |
| `AI_DEFAULT_PROVIDER` | `openai` |
| `AI_DEFAULT_MODEL` | `gpt-4o` |
| `AI_SCHEDULER_TOKEN` | token per i job AI schedulati |

Dopo il deploy, imposta `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `SEED_ON_BOOT=true` in Railway e **ridistribuisci**. Il seed crea o aggiorna `basilepaolo@me.com` e disattiva il vecchio `admin@statwin.local` se è rimasto un account separato. Poi sincronizza i dati calcio:

```bash
curl -X POST https://statwin-production.up.railway.app/api/v1/football/sync
```

Cambia subito la password admin. Non committare `.env`.

## API versionate

Prefisso: `/api/v1`

- `/auth` register, login, refresh, logout, password reset, email verification
- `/users/me`
- `/subscriptions`
- `/sports`
- `/football`
- `/basketball`
- `/tennis` e gli altri sport del catalogo (`GET` overview/matches/standings, `POST /{sport}/sync`)
- `POST /sports/sync` sincronizza tutti gli sport cablati in sequenza (backoff 429)
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

Provider calcio: **TheSportsDB** (campionati europei e coppe UEFA) + **OpenLigaDB** (Bundesliga, 2. Bundesliga, DFB-Pokal). Sync:

```bash
curl -X POST http://localhost:3001/api/v1/football/sync
```

Per aggiungere un campionato: metti l’ID TheSportsDB in `THESPORTSDB_LEAGUES` o lo shortcut OpenLigaDB in `OPENLIGADB_LEAGUES`. Un altro provider si collega implementando `FootballDataProvider`, senza toccare i controller.

Provider basket e altri sport: **TheSportsDB**. Nome e paese arrivano da `lookupleague.php`, non da elenchi Italia hard-coded. Prefissi `externalId` per sport (`tsd-bsk:`, `tsd:nfl:`, `tsd:tennis:`, …). Solo punteggi `FINISHED` della fonte.

```bash
curl -X POST http://localhost:3001/api/v1/basketball/sync
curl -X POST http://localhost:3001/api/v1/american-football/sync
curl -X POST http://localhost:3001/api/v1/sports/sync
```

Stagioni e liste ID: `THESPORTSDB_BASKETBALL_LEAGUES`, `THESPORTSDB_TENNIS_LEAGUES`, `THESPORTSDB_NFL_LEAGUES`, … (vedi `.env.example`). Intervallo job: `SPORTS_SYNC_INTERVAL_MS` (default 6h). TheSportsDB 429 è reale: le richieste sono scaglionate. **Ippica** non ha provider: `POST /horse-racing/sync` risponde con nota onesta e archivio vuoto.

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
