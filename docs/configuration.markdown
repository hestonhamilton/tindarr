# Configuration

MovieMatch is configured primarily through environment variables. These variables can be set directly in your environment, in a `.env` file, or managed via `docker-compose.yml` for local development.

## Server Configuration

The backend server requires the following environment variables:

-   `PORT`: (Optional) The port the server should listen on. Defaults to `3001`.
-   `PLEX_URL`: The base URL of your Plex Media Server (e.g., `http://your-plex-ip:32400`).
-   `PLEX_TOKEN`: Your Plex authentication token. This can be obtained after logging in via the frontend.

**Example `.env` for Server:**

```
PORT=3001
PLEX_URL=http://192.168.1.100:32400
PLEX_TOKEN=your_plex_auth_token_here
```

## Client Configuration

The frontend client requires the following environment variable:

-   `VITE_BACKEND_URL`: The URL where the backend server is running.

**Example `.env` for Client (in `packages/client/.env`):**

```
VITE_BACKEND_URL=http://localhost:3001
```

When running with `docker-compose`, these environment variables are set within the `docker-compose.yml` file, ensuring proper communication between services.