# Configuration Reference

Tindarr relies on a handful of environment variables. Use the `.env.example` files included in each workspace as a starting point and never check in real secrets—our CI pipeline runs Gitleaks to catch mistakes.

## Server (`packages/server/.env`)

| Variable | Description | Default |
| --- | --- | --- |
| `PLEX_URL` | Base URL of your Plex Media Server. | `http://localhost:32400` |
| `PLEX_TOKEN` | Plex authentication token obtained via the login flow. | _(required)_ |
| `FRONTEND_ORIGIN` | URL allowed for CORS/WebSocket connections. | `http://localhost:5173` |
| `PORT` | Port exposed by the Express app. | `3001` |

Example:

```ini
PLEX_URL=http://localhost:32400
PLEX_TOKEN=replace-with-plex-token
FRONTEND_ORIGIN=http://localhost:5173
PORT=3001
```

## Client (`packages/client/.env`)

| Variable | Description | Default |
| --- | --- | --- |
| `VITE_BACKEND_URL` | URL of the Tindarr server (used by the browser). | `http://localhost:3001` |

Example:

```ini
VITE_BACKEND_URL=http://localhost:3001
```

## Providing vars to Docker Compose

Compose inherits variables from the shell or a `.env` file placed alongside `docker-compose.yml`. This is the easiest way to run the stack without installing Node locally:

```bash
PLEX_URL=http://192.168.1.20:32400 \
PLEX_TOKEN=real-token \
FRONTEND_ORIGIN=http://192.168.1.50:5173 \
docker compose up --build
```

## CI/CD considerations

- Never store secrets in the repo. Use GitHub Secrets (or your CI secret store) and inject them as environment variables.
- Gitleaks runs automatically in `.github/workflows/secret-scan.yaml` to block leaked tokens on pull requests.
- Keep `.env.example` files current so new contributors know what values are required without copying production credentials.
