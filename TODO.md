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

- [ ] **Display Enhanced Movie Details on Voting Screen (`packages/client/src/pages/Room.tsx`)**
    - [ ] **Update `Movie` interface (if not already done):** Ensure `tagline`, `duration`, `rating`, `audienceRating`, `studio`, `genres`, `countries`, `directors`, `writers`, `roles` are available. (Already done in previous step for `types.ts`).
    - [ ] Display `tagline`.
    - [ ] Display `duration` (formatted, e.g., "1h 40m").
    - [ ] Display `rating` (critic score) with an IMDb icon.
    - [ ] Display `audienceRating` (audience score) with a Rotten Tomatoes icon.
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