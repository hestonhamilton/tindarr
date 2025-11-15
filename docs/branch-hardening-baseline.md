# Branch Hardening Baseline Reference

Establishing a single source of truth for local tooling prevents drift between audit findings and how the code actually runs. Use these commands verbatim when verifying fixes or reproducing bugs.

## Repo Layout & Toolchain

- Monorepo managed via npm workspaces (`packages/client`, `packages/server`).
- Node 18+ with npm; Docker + Docker Compose for local stack parity.
- TypeScript everywhere; Vite on the client, Express/Socket.IO on the server.
- Tests rely on `jest` (server) and Playwright (client).

## Root-Level Commands

| Purpose | Command |
| --- | --- |
| Install all workspaces | `npm install` |
| Start both dev servers (server + Vite) | `npm run dev` |
| Build client then server bundles | `npm run build` |
| Run every workspace test target | `npm test` |

## Server (`packages/server`)

| Purpose | Command |
| --- | --- |
| Start watch mode API/socket | `npm run dev --workspace=packages/server` (nodemon + ts-node) |
| Type-check/build | `npm run build --workspace=packages/server` |
| Unit / socket tests | `npm test --workspace=packages/server` |
| Direct script aliases | `cd packages/server && npm run <script>` for `dev`, `build`, `test` |

Key files:
- `src/index.ts` bootstraps Express + Socket.IO.
- `src/routes/*.ts` (REST) and `src/socket.ts` (events).
- `src/plex.ts` coils Plex XML API wrappers + filtering logic.
- Jest config: `packages/server/jest.config.js`.

## Client (`packages/client`)

| Purpose | Command |
| --- | --- |
| Start Vite dev server | `npm run dev --workspace=packages/client` (or `cd packages/client && npm run dev`) |
| Type-check + build | `npm run build --workspace=packages/client` (runs `tsc && vite build`) |
| Playwright e2e (requires running backend) | `npm test --workspace=packages/client -- e2e/<spec>` |

Key files:
- `src/pages/CreateRoom.tsx`, `Room.tsx` contain the voting UI, filter UX, and socket glue.
- Hooks (`src/hooks/`) for data fetching (e.g., `usePlexMovies`).
- Shared types live in `src/types.ts`.

## Docker & Compose (Full Stack)

| Purpose | Command |
| --- | --- |
| Build + run with live reload | `docker-compose up --build` |
| Stop stack / cleanup | `docker-compose down` |
| Build release image manually | `docker build -t <tag> .` |
| Run production-style container | `docker run -p 3001:3001 -e PLEX_URL=... -e PLEX_TOKEN=... <tag>` |

Compose exposes:
- Client at `http://localhost:5173`.
- Server at `http://localhost:3001`.

## Environment Variables Snapshot

| Component | Variables |
| --- | --- |
| Client | `VITE_BACKEND_URL` (point to server-origin) |
| Server | `PLEX_URL`, `PLEX_TOKEN`, optional `PORT`, optional `FRONTEND_ORIGIN` for CORS (docker compose defaults to localhost). |

Keep `.env` files out of version control and prefer `.env.example` updates when new settings appear.

## Test Coverage Gaps to Investigate

- Client has no automated unit tests configured; only Playwright scaffolding exists.
- Server tests focus on Plex helpers and sockets; no integration coverage for new duration/sorting features.
- No shared lint/type commands beyond Vite `tsc`; ensure we run `npm run build` to catch TS errors.

## Next Steps

1. Use these commands when executing the vulnerability, documentation, and bug sweeps outlined in `TODO.md`.
2. Extend this document with CI steps and any bespoke scripts discovered during the audit.
