# Docker Compose

This project includes a `docker-compose.yml` file to simplify local development and deployment. It orchestrates the client (frontend) and server (backend) services, building them from the `Dockerfile` and setting up necessary environment variables and volumes for live reloading.

## Usage for Local Development

1.  **Ensure Docker is running:** Make sure Docker Desktop or your Docker daemon is active.

2.  **Navigate to the project root:**
    ```bash
    cd /path/to/your/moviematch
    ```

3.  **Start the services:**
    ```bash
    docker-compose up --build
    ```
    This command will:
    -   Build the `server` image using the `server-builder` stage of the `Dockerfile`.
    -   Build the `client` image using the `client-builder` stage of the `Dockerfile`.
    -   Start both services.
    -   Mount the local `packages/server` and `packages/client` directories into their respective containers, enabling live reloading for development changes.

4.  **Access the application:**
    -   The **backend server** will be running on `http://localhost:3001`.
    -   The **frontend client** will be accessible in your web browser at `http://localhost:5173`.

5.  **Stop the services:**
    To stop the running services and remove their containers, networks, and volumes:
    ```bash
    docker-compose down
    ```

## Environment Variables

The `docker-compose.yml` sets up environment variables for inter-service communication.

-   **Client (`client` service):**
    -   `VITE_BACKEND_URL: http://server:3001` - This tells the frontend client to connect to the `server` service within the Docker network on port `3001`.

-   **Server (`server` service):**
    -   You will need to provide `PLEX_URL` and `PLEX_TOKEN` either in a `.env` file at the root of the `packages/server` directory or directly in the `docker-compose.yml` under the `environment` section for the `server` service.
    -   Example:
        ```yaml
        services:
          server:
            # ... other configurations
            environment:
              PLEX_URL: "http://your-plex-ip:32400"
              PLEX_TOKEN: "your_plex_auth_token"
        ```
    -   **`FRONTEND_ORIGIN`**: This variable is crucial for configuring Cross-Origin Resource Sharing (CORS) for the Socket.IO server. It must match the exact URL (including protocol, IP/domain, and port) from which your browser is accessing the client application.

        If you are accessing the client from `http://192.168.4.14:5173`, you must set this environment variable before running `docker compose up`:
        ```bash
        FRONTEND_ORIGIN=http://192.168.4.14:5173 docker compose up
        ```
        If not set, it defaults to `http://localhost:5173`, which works if you access the client via `localhost`.

## Building for Production

For production deployment, you would typically build the final Docker image without development volumes and run it.

1.  **Build the production image:**
    ```bash
    docker build -t moviematch:latest .
    ```

2.  **Run the production container:**
    ```bash
    docker run -p 3001:3001 -e PLEX_URL="your_plex_url" -e PLEX_TOKEN="your_plex_token" moviematch:latest
    ```
    *(Note: Ensure `VITE_BACKEND_URL` is correctly configured in the client build stage if your production setup differs from the default.)*