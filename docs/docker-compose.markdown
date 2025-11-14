# Docker Compose

```yaml
version: '3'
services:
  moviematch:
   image: lukechannings/moviematch:latest
   container_name: moviematch
   environment:
    PLEX_URL: "<Plex URL>"
    PLEX_TOKEN: "<Plex Token>"
   ports:
      - 8000:8000
```

If your Plex server is hosted at `https://plex.example.com`, and your token was `abc123` for example, your environment would look like this:

```yaml
environment:
  PLEX_URL: "https://plex.example.com"
  PLEX_TOKEN: "abc123"
```

If you want to use an [env file](https://github.com/LukeChannings/moviematch/blob/main/.env-template) instead of passing variables via environment, you can use that with docker-compose using the [`env_file`](https://docs.docker.com/compose/compose-file/compose-file-v3/#env_file) option.

## Testing a local branch (e.g. `feature/pre-lobby-queue-filtering`)

1. **Clone & checkout the branch**

   ```bash
   git clone https://github.com/LukeChannings/moviematch.git
   cd moviematch
   git checkout feature/pre-lobby-queue-filtering
   ```

2. **Create a compose file that builds the local Dockerfile**

   ```yaml
   # docker-compose.local.yaml
   services:
     moviematch:
       build:
         context: .
         dockerfile: Dockerfile
       image: moviematch:pre-lobby-filtering
       environment:
         PLEX_URL: "https://plex.example.com"
         PLEX_TOKEN: "abc123"
       ports:
         - "8000:8000"
   ```

3. **Start MovieMatch from the branch**

   ```bash
   docker compose -f docker-compose.local.yaml up --build
   ```

4. **Test the new pre-lobby filters**

   - Visit `http://localhost:8000`, log in, and head to **Create Room**.
   - Use the **Quick Filters** (libraries, genres, collections, release years) and ensure the preview badge shows a non-zero count before creating the lobby.
   - Try conflicting filters to confirm the “No media match” warning and disabled Create button appear.

Stop the stack with `docker compose down` when finished testing.
