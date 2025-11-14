# MovieMatch

MovieMatch is a modern web application designed to help friends and families discover movies together. Connect to your Plex Media Server, create a room, set filters, and swipe through movie suggestions Tinder-style. When everyone in the room likes the same movie, it's a match!

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

-   [Node.js](https://nodejs.org/en/) (v18 or higher recommended)
-   [npm](https://www.npmjs.com/) (comes with Node.js)
-   [Docker](https://www.docker.com/products/docker-desktop) & [Docker Compose](https://docs.docker.com/compose/install/) (for easy local development)

#### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-repo/moviematch.git
    cd moviematch
    ```
2.  **Install root dependencies:**
    ```bash
    npm install
    ```
    This will install dependencies for both `packages/client` and `packages/server`.

#### Running the Application (Development Mode with Docker Compose)

The easiest way to get the application running for development is using Docker Compose. This will build the client and server, and set up live reloading.

1.  **Build and run the services:**
    ```bash
    docker-compose up --build
    ```
    -   The **server** will be accessible at `http://localhost:3001`.
    -   The **client** (frontend) will be accessible at `http://localhost:5173`.

2.  **Access the application:** Open your web browser and navigate to `http://localhost:5173`.

#### Running Tests

-   **Server Unit Tests:**
    ```bash
    npm test --workspace=packages/server
    ```
-   **Client E2E Tests (Playwright):**
    1.  Ensure the client and server are running (e.g., via `docker-compose up`).
    2.  Run Playwright tests:
        ```bash
        npm test --workspace=packages/client -- e2e/login.spec.ts # Or specify other test files
        ```
        *(Note: The current E2E test for login is a simplified check and might require mocking Plex authentication for full automation.)*

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

## License

This project is licensed under the terms of the [LICENSE](LICENSE) file.
