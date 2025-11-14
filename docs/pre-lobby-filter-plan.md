# Pre-Lobby Queue Filtering Feature Plan

## Context Recap
- Server gathers media when a room is created by calling each provider's `getMedia({ filters })` in `internal/app/moviematch/room.ts`, so any new pre-lobby filters must be passed through the existing `CreateRoomRequest.filters` array defined in `types/moviematch.ts`.
- Plex providers already expose dynamic filter metadata via `getFilters`, `getFilterValues`, and translate active filters into query params in `internal/app/moviematch/providers/plex.ts` (see `filtersToPlexQueryString` / `filterToQueryString`).
- The current Create Room screen (`web/app/src/components/screens/Create.tsx`) renders a generic `FilterField` control stack, but it leaves key UX gaps for common tasks (movie vs show vs genre vs release date) and does not persist pending filters in Redux beyond the `useRef`.
- Redux only stores `createRoom.availableFilters` and suggestion caches (`web/app/src/store/reducer.ts`), so enhancing the filter workflow will require additional state and validation plumbing.
- End-to-end coverage for filters is limited to `e2e-tests/create_room_test.ts`, which only exercise a single genre filter path.

## Desired Outcomes
1. Allow hosts to pre-filter the movie queue before lobby creation using curated, user-friendly controls for:
   - Library selection when multiple Plex movie libraries exist (TV support can come later).
   - Genre inclusion / exclusion.
   - Release date windows (before/after/year range) and possibly ratings/runtime knobs.
   - Plex collections (watchlists, custom collections) surfaced as first-class options.
2. Ensure chosen filters flow through the Create Room request so they are reflected in the queue that is broadcast to joined clients (no need to persist them beyond the active create flow).
3. Provide confident automated coverage (unit + e2e) to verify that pre-lobby filtering actually changes the fetched Plex items.

## Implementation Plan

### 1. Backend capabilities & API schema
1.1 Extend the shared `Filter`/`Filters` types (`types/moviematch.ts`) with helper enums/constants describing the curated filter sets (e.g., `FilterPreset = "libraryType" | "genre" | "releaseDate"`).  
1.2 Teach the Plex provider (`internal/app/moviematch/providers/plex.ts`) to normalize "library" filter handling: surface available Plex **movie** libraries (title + type) through `getFilters` or a new `getLibraries`-derived helper exposed to the client so a host can explicitly select which movie libraries to include.  
1.3 Add server-side validation in `internal/app/moviematch/room.ts` (during `createRoom`) to reject malformed filter payloads (unknown keys, missing operator/value), logging actionable errors for hosts.  
1.4 Update `filtersToPlexQueryString` / `filterToQueryString` to cover the operators needed for release-date ranges (e.g., `year>=`, `year<=`) and document supported mappings.  
1.5 Provide a “preview count” endpoint or reuse `getMedia` behind a cheap head query so the frontend can request the filtered count before room creation; return an explicit warning/error when zero items match.  
1.6 If we introduce any new server messages (e.g., `requestLibraries`, `requestFilteredCount`, or richer filter presets), update `internal/app/moviematch/client.ts` message handlers plus the exported `MovieMatchClient` API (`web/app/src/api/moviematch.ts`).

### 2. Frontend UX changes
2.1 Keep filter builder state local to the Create form (no persistence required) but ensure it serializes correctly when the room is created.  
2.2 Design a preset-based UI on Create Screen:  
&nbsp;&nbsp;a. Introduce atoms/molecules for toggles and range pickers (e.g., `GenreMultiSelect`, `YearRangeField`).  
&nbsp;&nbsp;b. Map presets to real Plex filter keys/operators internally (e.g., selected collections ⇒ `{ key: "collection", operator: "=", value: [<id>] }`).  
&nbsp;&nbsp;c. Keep the existing advanced `FilterField` list for power users, but surface the preset controls above it for quick access.  
2.3 Wire the new controls to dispatch deterministic filter payloads via `createRoom` action (keep `useRef` or migrate to component state, but ensure `handleCreateRoom` serializes both preset + advanced filters) and call the new “preview count” check; disable the Create button with inline messaging when zero titles match.  
2.4 Provide live feedback summarizing the current filter set (chips or inline text) so hosts understand what will affect the queue.  
2.5 Update translations in `configs/localization/*` for any new labels/instructions.

### 3. Documentation & discoverability
3.1 Update `README.markdown` and, if necessary, add a `docs/features/pre-lobby-filtering.md` walkthrough that explains how to use the new filtering UI and the relationship to Plex library metadata.  
3.2 Mention any environment/config requirements (e.g., ensuring Plex exposes movie libraries to MovieMatch, collections metadata requires Plex version ≥ X).  
3.3 Capture troubleshooting tips (e.g., what happens if a filter combination yields zero media, referencing the `NoMediaError` path in `room.ts`).

### 4. Testing & QA enablement
4.1 Backend: add focused unit tests for `filtersToPlexQueryString` and any new normalization helpers (Deno test files under `internal/app/moviematch/providers/__tests__`).  
4.2 Frontend: add React component tests (using `@testing-library/react`) for the new preset controls to ensure they emit correct filter payloads and coexist with the existing advanced list.  
4.3 E2E: extend `e2e-tests/create_room_test.ts` to cover representative combinations (single movie library, specific genres, collections, year range) and verify that the resulting queue contains only matching cards—and that the zero-result guard appears when conflicting filters are chosen.  
4.4 Manual checklist: document how to verify in a development environment by inspecting WebSocket `createRoom` payloads and server logs.

## Decisions + Remaining Questions
- Preset selections do **not** need to persist beyond the current Create flow.
- Plex collections should be exposed as first-class presets alongside genre/year controls.
- Initial scope is movie libraries only; TV libraries can be introduced in a follow-up.
- Zero-result guardrails will block lobby creation; frontend should show inline warnings tied to the preview count.
- Still to decide: whether to add additional heuristics for conflicting advanced filters beyond the preview count (e.g., lint rules before firing the validation request).
