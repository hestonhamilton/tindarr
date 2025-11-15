# Tindarr

Tindarr is a modern web application designed to help friends and families discover movies together. Connect to your Plex Media Server, create a room, set filters, and swipe through movie suggestions Tinder-style. When everyone in the room likes the same movie, it's a match!

## Features

-   **Plex Integration:** Securely authenticate with your Plex account to access your media libraries.
-   **Room Creation:** Create private rooms to invite friends for collaborative movie discovery.
-   **Advanced Filtering:** Filter movies by genre, year range, content rating, and more.
-   **Movie Count Preview:** See how many movies match your criteria before starting a session.
-   **Tinder-style Swiping:** Intuitively swipe left to dislike and right to like movie suggestions.
-   **Real-time Updates:** See who liked which movie in real-time.
-   **Match Screen:** View a curated list of movies that everyone in the room has liked.
-   **Monorepo Structure:** Organized into `client` (React/Vite) and `server` (Node.js/Express) packages.

## For End-Users

### Requirements

-   A running [Plex Media Server](https://www.plex.tv/media-server-downloads/) with movie libraries.
-   A Plex account for authentication.

### How to Use (High-Level)

1.  **Log in with Plex:** On the landing page, click "Login with Plex" and follow the authentication prompts.
2.  **Create a Room:** Select your desired Plex libraries and apply filters (genre, year, content rating) to narrow down movie suggestions.
3.  **Invite Friends:** Share the room ID with your friends.
4.  **Start Swiping:** Begin swiping through movie suggestions. Like movies you want to watch, dislike those you don't.
5.  **Discover Matches:** Once everyone in the room has liked the same movie, it will appear on the "Matches" screen!

## For Developers

### Getting Started

This project is structured as a monorepo using npm workspaces.

#### Prerequisites

-   [Node.js](https://nodejs.org/) 18+ and npm 9+ (ships with Node)
-   [Docker](https://www.docker.com/products/docker-desktop) & [Docker Compose](https://docs.docker.com/compose/install/) if you prefer containerized development

#### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/hestonhamilton/tindarr.git
    cd tindarr
    ```
2.  **Install dependencies (root command uses npm workspaces):**
    ```bash
    npm install
    ```

#### Local configuration

Create `.env` files based on the included examples:

-   `packages/server/.env` (copy from `.env.example`)
    ```ini
    PLEX_URL=http://localhost:32400
    PLEX_TOKEN=replace-with-plex-token
    FRONTEND_ORIGIN=http://localhost:5173
    PORT=3001
    ```
-   `packages/client/.env` (copy from `.env.example`)
    ```ini
    VITE_BACKEND_URL=http://localhost:3001
    ```

Never commit real tokens—GitHub Actions runs [Gitleaks](https://github.com/gitleaks/gitleaks) to enforce this.

Additional deep dives are available in:

- [`docs/configuration.md`](docs/configuration.md) – comprehensive environment variable reference
- [`docs/docker-compose.md`](docs/docker-compose.md) – container-based workflow
- [`docs/reverse-proxy.md`](docs/reverse-proxy.md) – examples for fronting Tindarr with Nginx/Traefik/Apache
- [`docs/AGENTS.md`](docs/AGENTS.md) – internal guidelines for automated contributors

#### Running the application (Node dev servers)

Start both workspaces from the repo root:
```bash
npm run dev
```
This runs `npm run dev` inside the server (Express + Socket.IO on `http://localhost:3001`) and the client (Vite dev server on `http://localhost:5173`) simultaneously. Hot reload is enabled for both packages.

#### Running with Docker Compose

A Compose file mirrors the manual setup and is helpful for contributors who want isolation or are testing Vite builds:

```bash
docker compose up --build
```

-   Client: `http://localhost:5173`
-   Server API/WebSocket: `http://localhost:3001`

Environment variables can be supplied via shell exports or an `.env` file in the repo root. Common overrides:

```bash
FRONTEND_ORIGIN=http://192.168.1.50:5173 \
PLEX_URL=http://192.168.1.20:32400 \
PLEX_TOKEN=your-token \
docker compose up --build
```

#### Running Tests

-   **Server (Jest):**
    ```bash
    npm test --workspace=packages/server
    ```
-   **Client (Vitest unit tests):**
    ```bash
    npm test --workspace=packages/client
    ```
-   **Client Playwright E2E:** ensure both services are running (locally or via Docker) then execute:
    ```bash
    npm test --workspace=packages/client -- e2e/login.spec.ts
    ```
    *These specs currently assume localhost hosts and may need Plex login stubs for automation.*

### Project Structure

-   `packages/client/`: Contains the React frontend application built with Vite.
-   `packages/server/`: Contains the Node.js/Express backend API and Socket.IO server.
-   `Dockerfile`: Defines how to build the client and server into Docker images.
-   `docker-compose.yml`: Orchestrates the client and server services for local development.
-   `AGENTS.md`: Guidelines for AI agents contributing to the project.
-   `TODO.md`: Project development roadmap and task tracking.

### Key Technologies

-   **Frontend:** React, Vite, TypeScript, React Router DOM, `@tanstack/react-query`, Axios, Playwright (E2E testing)
-   **Backend:** Node.js, Express, TypeScript, Socket.IO, Axios, `xml2js`, Jest (unit testing), Supertest (API testing)

### Environment Variables

The client and server use environment variables for configuration.

-   **Client (`packages/client/.env` or `docker-compose.yml`):**
    -   `VITE_BACKEND_URL`: The URL of the backend API (e.g., `http://localhost:3001`).

-   **Server (`packages/server/.env` or `docker-compose.yml`):**
    -   `PLEX_URL`: Your Plex Media Server URL (e.g., `http://your-plex-ip:32400`).
    -   `PLEX_TOKEN`: Your Plex authentication token.
    -   `PORT`: The port the server should listen on (default: `3001`).

### Contributing

We welcome contributions! Please see our [CONTRIBUTING.markdown](CONTRIBUTING.markdown) for guidelines.

### Releases

- Release history lives under [`docs/releases/`](docs/releases/) (see [v2.0.0](docs/releases/v2.0.0.md) for the current milestone).
- Update the [`VERSION`](VERSION) file before tagging so CI sees the correct semantic version.
- Tag new versions from `main` using `git tag -a vX.Y.Z -m "Tindarr vX.Y.Z"` and `git push origin vX.Y.Z`.
- The [`Release`](.github/workflows/release.yaml) workflow runs automatically for version tags, builds both workspaces, uploads release archives, and publishes Docker images.

## License

This project is licensed under the terms of the [LICENSE](LICENSE) file.

## Credits

Tindarr draws inspiration from [Luke Channings' MovieMatch project](https://github.com/LukeChannings/moviematch) while modernizing the stack around a React/Vite frontend and a Node/Express backend.
