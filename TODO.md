# Branch Hardening, QA, and Rebrand Alignment

This branch is nearly feature complete, so our remaining work focuses on validating quality, eliminating risk, and aligning the project identity with our new direction.

## Objectives
- Exhaustively review testing, security, documentation, bug backlogs, engineering practices, and potential information leaks/hardcoded values.
- Track and remediate each finding with clear owners and acceptance criteria.
- Transition authorship to **Heston Hamilton** and complete the rebrand to **Tindarr** (UI/docs largely updated; repo rename + comms still pending).

## 1. Baseline Research & Tooling
- ✅ Captured the canonical dev/build/test commands in `README.md` plus the new docs under `docs/`.
- ✅ Added CI pipelines (Node test/build workflow + Gitleaks secret scan) to mirror the local experience.
- ☐ Maintain an issue tracker / checklist for future findings (still manual).

## 2. Testing & Quality Coverage
- ✅ Server Jest suites expanded (Plex metadata, filtering, socket routes) and run in CI.
- ✅ Client Vitest hook tests added (`useMovieCount`, `usePlexMovies`) with Vite 7 builds passing.
- ✅ Node workflow runs the above on every push/PR.
- ☐ Extend coverage to higher-level components (CreateRoom UX, Room state machine) and ensure Playwright specs are maintained.

## 3. Vulnerability & Dependency Review
- ✅ Ran `npm audit` (Node 22 / npm 11). Current output shows 18 moderate alerts stemming from `js-yaml` via `ts-jest`; no patched release is available yet (latest `ts-jest` is 29.4.5).
- ✅ Upgraded client to Vite 7 / Vitest 4 and server Jest stack to the latest available versions.
- ☐ Track `ts-jest` advisory and re-run audits once a fixed major release ships; document any interim mitigations.

## 4. Documentation & Knowledge Transfers
- ✅ README rewritten for the React/Node architecture (env setup, npm workspaces, Docker, testing).
- ✅ Added `docs/configuration.md`, `docs/docker-compose.md`, and `docs/reverse-proxy.md`.
- ✅ Moved `AGENTS.md` into `docs/`.
- ☐ Add troubleshooting/FAQ sections (e.g., Plex auth failures, Socket.IO CORS).

## 5. Bug & Best-Practice Backlog
- ☐ Review open GitHub issues/TODO comments and re-triage for the modern stack.
- ☐ Schedule exploratory testing sessions (filters, room codes, match syncing) and document findings.
- ☐ Audit TypeScript best practices (error boundaries, logging) now that the files have settled.

## 6. Information Leakage & Hardcoded Value Audit
- ✅ Added `.env.example` files for client/server and tightened `.gitignore` to exclude `.env*`, `.npmrc`, coverage, etc.
- ✅ Integrated Gitleaks in CI to scan every push/PR.
- ☐ Spot-check server logs and browser storage for potential token leaks; document findings.

## 7. Authorship & Rebranding Tasks
- ✅ Updated `package.json`, LICENSE, and README credits to reference Heston Hamilton.
- ☐ Decide on the new product name and update UI copy, Docker image names, and domain references.
- ☐ Prepare comms/docs for the rename and any Plex app registration updates needed.

## 8. Reporting & Tracking
- ☐ Stand up an issue board or spreadsheet capturing the remaining tasks above with owners.
- ☐ Provide periodic status updates (could be GitHub Discussions or project board notes) so progress is visible to collaborators.
