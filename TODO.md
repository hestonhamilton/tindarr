# Branch Hardening, QA, and Rebrand Alignment

This branch is nearly feature complete, so our remaining work focuses on validating quality, eliminating risk, and aligning the project identity with our new direction.

## Objectives
- Exhaustively review testing, security, documentation, bug backlogs, engineering practices, and potential information leaks/hardcoded values.
- Track and remediate each finding with clear owners and acceptance criteria.

## 1. Baseline Research & Tooling
- ☐ Maintain an issue tracker / checklist for future findings (still manual).

## 2. Testing & Quality Coverage
- ☐ Extend coverage to higher-level components (CreateRoom UX, Room state machine) and ensure Playwright specs are maintained.

## 3. Vulnerability & Dependency Review
- ☐ Track `ts-jest` advisory and re-run audits once a fixed major release ships; document any interim mitigations.

## 4. Documentation & Knowledge Transfers
- ☐ Add troubleshooting/FAQ sections (e.g., Plex auth failures, Socket.IO CORS).

## 5. Bug & Best-Practice Backlog
- ☐ Review open GitHub issues/TODO comments and re-triage for the modern stack.
- ☐ Schedule exploratory testing sessions (filters, room codes, match syncing) and document findings.
- ☐ Audit TypeScript best practices (error boundaries, logging) now that the files have settled.

## 6. Information Leakage & Hardcoded Value Audit
- ☐ Spot-check server logs and browser storage for potential token leaks; document findings.

## 8. Reporting & Tracking
- ☐ Stand up an issue board or spreadsheet capturing the remaining tasks above with owners.
- ☐ Provide periodic status updates (could be GitHub Discussions or project board notes) so progress is visible to collaborators.