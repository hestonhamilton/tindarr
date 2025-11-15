# Docker Compose Development Guide

Containerizing the client and server makes it easy to get Tindarr running with a single command. The Compose file in the repo root mirrors the local Node workflows while wiring all required environment variables.

## Services

| Service | Description | Ports |
| --- | --- | --- |
| `server` | Express + Socket.IO backend. Hot reload is enabled through a bind mount on `packages/server`. | `3001:3001` |
| `client` | React/Vite frontend. Runs `npm run dev` inside the container with HMR. | `5173:5173` |

## Prerequisites

- Docker Desktop / Docker Engine 20.10+
- Docker Compose v2 (`docker compose` CLI)
- `.env` files for client and server populated per [docs/configuration.md](./configuration.md)

## Common commands

Start the stack with live reload:

```bash
docker compose up --build
```

Stop and clean up containers/volumes:

```bash
docker compose down
```

Rebuild after dependency changes (e.g., lockfile updates):

```bash
docker compose build --no-cache
```

Tail logs from both services:

```bash
docker compose logs -f
```

## Environment variables

The Compose file reads from the host environment. Export variables inline when you need non-default values:

```bash
FRONTEND_ORIGIN=http://192.168.1.50:5173 \
PLEX_URL=http://192.168.1.20:32400 \
PLEX_TOKEN=your-real-token \
docker compose up --build
```

You can also create a `.env` file next to `docker-compose.yml` to persist overrides. Sensitive values should **never** be committed—Gitleaks runs in CI to enforce this policy.

## Troubleshooting

- **CORS errors:** ensure `FRONTEND_ORIGIN` matches how you access the client (localhost vs LAN IP).
- **Socket.IO connection fails:** confirm port 3001 is reachable from your browser, and Plex tokens are valid.
- **File permission issues on bind mounts:** Windows users may need to enable file sharing for the repo drive.
