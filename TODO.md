# MovieMatch Enhancements - Phase 2

This document outlines the tasks for enhancing movie display, filtering, and sorting based on Plex metadata.

## Core Tasks

- [X] **Implement Duration Filtering (Min/Max)**
    - [X] **Server-side (`packages/server/src/plex.ts`):**
        - [X] Modify `getMovies` to accept `durationMin` and `durationMax` parameters.
        - [X] Implement server-side filtering for `duration` based on `durationMin` and `durationMax`.
        - [X] Modify `getMoviesCount` to accept `durationMin` and `durationMax` parameters and apply filtering.
    - [X] **Client-side (`packages/client/src/pages/CreateRoom.tsx`):**
        - [X] Add state variables for `durationMin` and `durationMax`.
        - [X] Add input fields for `durationMin` and `durationMax` to the "Create Room" UI.
        - [X] Pass `durationMin` and `durationMax` to `useMovieCount` and `usePlexMovies`.
        - [X] Implement client-side validation for `durationMin` and `durationMax` (e.g., min <= max).
    - [X] **Client-side (`packages/client/src/hooks/usePlexMovies.ts`):**
        - [X] Update `PlexMoviesParams` interface to include `durationMin` and `durationMax`.
        - [X] Pass `durationMin` and `durationMax` to the server's `/api/plex/movies` endpoint.
    - [X] **Client-side (`packages/client/src/pages/Room.tsx`):**
        - [X] Retrieve `durationMin` and `durationMax` from `localStorage` and pass to `usePlexMovies`.

- [X] **Implement New Sorting Options**
    - [X] **Server-side (`packages/server/src/plex.ts`):**
        - [X] Modify `getMovies` sorting logic to handle:
            - `duration:asc` / `duration:desc`
            - `rating:asc` / `rating:desc` (critic score)
            - `audienceRating:asc` / `audienceRating:desc` (audience score)
    - [X] **Client-side (`packages/client/src/pages/CreateRoom.tsx`):**
        - [X] Update `SORT_OPTIONS` to include new duration, critic rating, and audience rating sorting choices.
        - [X] Ensure `sortOrder` is correctly passed to `useMovieCount` and `usePlexMovies`.

- [X] **Display Enhanced Movie Details on Voting Screen (`packages/client/src/pages/Room.tsx`)**
    - [X] **Update `Movie` interface (if not already done):** Ensure `tagline`, `duration`, `rating`, `audienceRating`, `studio`, `genres`, `countries`, `directors`, `writers`, `roles` are available. (Already done in previous step for `types.ts`).
    - [X] Display `tagline`.
    - [X] Display `duration` (formatted, e.g., "1h 40m").
    - [X] Display `rating` (critic score) with an IMDb icon. (Icons are placeholders)
    - [X] Display `audienceRating` (audience score) with a Rotten Tomatoes icon. (Icons are placeholders)
    - [ ] Consider displaying `studio`, `genres`, `countries`, `directors`, `writers`, `roles` if space permits and it enhances the UX.

## Pre-requisite/Cleanup Tasks

- [X] **Update `PlexMovieResponse.Metadata` interface (`packages/server/src/plex.ts`):**
    - [X] Add `tagline?: string;`
    - [X] Add `studio?: string;`
    - [X] Add `duration?: number;`
    - [X] Add `Genre?: { tag: string }[];`
    - [X] Add `Country?: { tag: string }[];`
    - [X] Add `Director?: { tag: string }[];`
    - [X] Add `Writer?: { tag: string }[];`
    - [X] Add `Role?: { tag: string }[];`
    - [X] Add `audienceRating?: number;`
    - [X] Add `audienceRatingImage?: string;` (for Rotten Tomatoes icon)
    - [X] Add `ratingImage?: string;` (for IMDb icon)
- [X] **Update `Movie` interface (`packages/server/src/types.ts` and `packages/client/src/types.ts`):**
    - [X] Ensure all new fields from `PlexMovieResponse.Metadata` are reflected in the `Movie` interface, converting tag arrays to `string[]` where appropriate.
- [X] **Modify `getMovies` mapping (`packages/server/src/plex.ts`):**
    - [X] Map all new fields from `PlexMovieResponse.Metadata` to the `Movie` object.

## Icons for Ratings

- [ ] **Client-side (`packages/client/public` or `src/assets`):**
    - [ ] Source appropriate IMDb and Rotten Tomatoes icons (SVG or PNG).
    - [ ] Integrate icons into `Room.tsx` for displaying ratings.

## Room Code Generation and Joining

- [X] **Server-side (`packages/server/src/room.ts`):**
    - [X] Modify `createRoom` to generate a unique, short, and memorable code.
    - [X] Store this code along with the `roomId` (UUID).
    - [X] Add a function `getRoomByCode` to find a room by its code.
    - [X] Modify `joinRoom` to accept a room code.
    - [X] Modify `leaveRoom` to remove the room code mapping if the room is deleted.
    - [X] Rename `getRoom` to `getRoomById`.
- [X] **Server-side (`packages/server/src/socket.ts`):**
    - [X] When `createRoom` is called, the `roomCreated` event should emit the generated room code (and `roomId`).
    - [X] When `joinRoom` is called, it should use the room code to find the room.
- [X] **Server-side (`packages/server/src/types.ts`):**
    - [X] Update `Room` interface to include `code: string`.
    - [X] Update `CreateRoomPayload` and `JoinRoomPayload` if necessary.
- [X] **Client-side (`packages/client/src/types.ts`):**
    - [X] Update `User` interface (if needed).
    - [X] Update `ClientToServerEvents` for `createRoom` and `joinRoom`.
    - [X] Update `ServerToClientEvents` for `roomCreated`, `roomJoined`, and `userJoined`.
- [X] **Client-side (`packages/client/src/pages/CreateRoom.tsx`):**
    - [X] After `roomCreated` event, navigate to `/room/${roomCode}` (using the generated code).
    - [X] Add an input field for "Join Room with Code" and a "Join Room" button.
- [X] **Client-side (`packages/client/src/pages/Login.tsx` or a new component):**
    - [X] Add an input field for "Join Room with Code".
    - [X] Handle submission of the room code.
    - [X] Navigate to `/room/${enteredRoomCode}`.
- [X] **Client-side (`packages/client/src/pages/Room.tsx`):**
    - [X] The `roomId` in `useParams` will now be the `roomCode`.
    - [X] Modify `socket.emit('joinRoom', ...)` to pass the `roomCode`.

## Bug Fix: Movie Queue Not Shared

- [X] **Server-side (`packages/server/src/types.ts`):**
    - [X] Update `Room` interface to include movie selection criteria.
    - [X] Update `CreateRoomPayload` to include movie selection criteria.
- [X] **Server-side (`packages/server/src/room.ts`):**
    - [X] Modify `createRoom` to store movie selection criteria in the `Room` object.
- [X] **Server-side (`packages/server/src/socket.ts`):**
    - [X] When `createRoom` is emitted, the `CreateRoomPayload` needs to include the movie selection criteria.
    - [X] When `userJoined` is emitted, the `Room` object (with criteria) is sent to all users in the room.
- [X] **Client-side (`packages/client/src/types.ts`):**
    - [X] Update `CreateRoomPayload` to include the movie selection criteria.
    - [X] Update `Room` interface to include movie selection criteria.
- [X] **Client-side (`packages/client/src/pages/CreateRoom.tsx`):**
    - [X] When emitting `createRoom`, pass the movie selection criteria to the server.
    - [X] Remove saving movie selection criteria to `localStorage`.
- [X] **Client-side (`packages/client/src/pages/Room.tsx`):**
    - [X] When a user joins a room, the `usePlexMovies` hook needs to get its parameters from the *room state* (received from the server) instead of `localStorage`.
    - [X] Listen for `userJoined` events to update the room state and re-evaluate `usePlexMovies`.
    - [X] Remove retrieving movie selection criteria from `localStorage`.

## Bug Fix: Client-side `crypto.randomUUID` runtime error

- [X] **Client-side (`packages/client/package.json`):**
    - [X] Install `uuid` package.
- [X] **Client-side (`packages/client/src/pages/CreateRoom.tsx`):**
    - [X] Update to use `uuidv4()` for UUID generation.
- [X] **Client-side (`packages/client/src/pages/Login.tsx`):**
    - [X] Update to use `uuidv4()` for UUID generation.

## Bug Fix: Client-side routing issue

- [X] **Client-side (`packages/client/src/App.tsx`):**
    - [X] Update route path for `RoomPage` and `MatchPage` from `/room/:roomId` to `/room/:roomCode`.

## Cleanup: Debugging Artifacts

- [X] **Client-side (`packages/client/src/pages/Room.tsx`):**
    - [X] Remove debug logging.
    - [X] Remove temporary debug UI element.

## Feature: Display Shared Liked Movies

- [X] **Server-side (`packages/server/src/types.ts`):**
    - [X] Update `Room` interface to include `likedMovies: Movie[]`.
- [X] **Server-side (`packages/server/src/socket.ts`):**
    - [X] Modify `likeMovie` event handler to:
        - [X] Add the liked `Movie` object to the `room.likedMovies` array.
        - [X] Emit an event (e.g., `roomUpdated` or `likedMoviesUpdated`) to all users in the room with the updated `room.likedMovies` list.
- [X] **Client-side (`packages/client/src/types.ts`):**
    - [X] Update `Room` interface to include `likedMovies: Movie[]`.
    - [X] Update `ServerToClientEvents` to listen for the new event (e.g., `roomUpdated` or `likedMoviesUpdated`).
- [X] **Client-side (`packages/client/src/pages/Room.tsx`):**
    - [X] Listen for the new event (e.g., `roomUpdated` or `likedMoviesUpdated`) and update the `roomState` with the new `likedMovies` list.
    - [X] Render a horizontally expanding list below the like/dislike buttons.
    - [X] For each liked movie, display its title and poster.
    - [X] Implement basic styling for the horizontal list (e.g., using flexbox with `overflow-x: auto`).

## Feature: Only Add Movies to Liked List if All Users Like Them

- [X] **Server-side (`packages/server/src/types.ts`):**
    - [X] Update `Room` interface to include a mechanism to track individual user likes for movies (e.g., `movieLikes: Map<string, Set<string>>` where key is `movieId` and value is a set of `userId`s).
- [X] **Server-side (`packages/server/src/room.ts`):**
    - [X] Modify `addLikedMovie` (or create a new method) to:
        - [X] Record the `userId` as having liked the `movieId`.
        - [X] Check if all users in the room have liked this specific `movieId`.
        - [X] If all users have liked it, then add the `Movie` object to `room.likedMovies`.
        - [X] Ensure duplicate entries in `room.likedMovies` are still prevented.
- [X] **Client-side (`packages/client/src/pages/Room.tsx`):**
    - [X] No direct changes expected for rendering, as it will still display `room.likedMovies`. The logic change is server-side.

## Feature: Prevent Single-User Likes from Populating Shared List

- [X] **Server-side (`packages/server/src/room.ts`):**
    - [X] Modify `addLikedMovie` to include a guard: if `room.users.length <= 1`, then the movie should not be added to `room.likedMovies`, even if the `allUsersLiked` condition would otherwise be met.

## Feature: Generate Room Codes with Letters Only and Length 4

- [X] **Server-side (`packages/server/src/room.ts`):**
    - [X] Modify `generateRoomCode` to use only uppercase letters.
    - [X] Set `codeLength` to 4.