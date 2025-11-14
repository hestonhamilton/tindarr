# MovieMatch v2 - TODO

This document outlines the tasks required to complete the new version of MovieMatch.

**Note on Documentation:** For all libraries and technologies used in this project, please refer to the up-to-date documentation using the context7 MCP server.

## Phase 1: Project Setup & Backend MVP

-   [x] Setup monorepo with npm workspaces.
-   [x] Setup server project with Node.js, Express, and TypeScript.
-   [x] Setup client project with React, Vite, and TypeScript.
-   [ ] **Backend: Plex Authentication**
    -   [x] Implement `getNewPin` and `getAuthToken` functions.
    -   [x] Write unit tests for `getNewPin` and `getAuthToken`.
    -   [ ] Create an API endpoint to initiate Plex authentication.
    -   [ ] Create an API endpoint to check the status of the authentication and retrieve the auth token.
-   [ ] **Backend: WebSocket Communication**
    -   [ ] Setup Socket.IO server.
    -   [ ] Implement basic connection and disconnection handling.
-   [ ] **Backend: Room Management**
    -   [ ] Implement logic for creating and joining rooms.
    -   [ ] Implement logic for storing room state (e.g., in-memory or a simple database).
-   [ ] **Backend: Plex API Integration**
    -   [ ] Implement function to get libraries from a Plex server.
    -   [ ] Implement function to get movies from a library.
    -   [ ] Write unit tests for Plex API integration.

## Phase 2: Frontend MVP

-   [ ] **Frontend: Plex Authentication**
    -   [ ] Create a login page.
    -   [ ] Implement the flow for a user to log in with their Plex account.
-   [ ] **Frontend: Room Creation**
    -   [ ] Create a "Create Room" page.
    -   [ ] Implement UI for selecting Plex libraries and setting filters.
    -   [ ] Implement the "preview" feature to show the number of matching movies.
-   [ ] **Frontend: Movie Swiping**
    -   [ ] Create the main "Room" page.
    -   [ ] Implement the Tinder-style swiping interface for movies.
    -   [ ] Implement real-time updates for movie likes.
-   [ ] **Frontend: Matching**
    -   [ ] Implement the "Match" screen to show matched movies.

## Phase 3: Integration & Deployment

-   [ ] Connect frontend and backend.
-   [ ] Create a `Dockerfile` for the application.
-   [ ] Create a `docker-compose.yml` for easy local development and deployment.
-   [ ] Write E2E tests.

## Phase 4: Polish & Refinements

-   [ ] Implement user feedback and bug fixes.
-   [ ] Add more advanced filtering options.
-   [ ] Improve the UI/UX.
