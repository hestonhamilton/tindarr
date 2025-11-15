# Jest & Vite Upgrade Plan

Improving test coverage unblocked us to upgrade the tooling. This document proposes the concrete steps for updating both stacks while minimizing regressions.

## Objectives

1. Eliminate the `npm audit` findings tied to our current Jest + ts-jest dependency tree.
2. Move the client build/test pipeline to Vite 7 so we can adopt current security patches.
3. Preserve the new Vitest/React Testing Library setup and the server’s Jest suite with minimal churn.

## Target Versions

- **Server**
  - `jest` → `^30.2.x` (already declared) but ensure a compatible `ts-jest` release (`^30.3.0` when available) and `@types/jest`.
  - `ts-node` / `typescript` should track the ts-jest peer requirements.

- **Client**
  - `vite` → `^7.2.x`.
  - `@vitejs/plugin-react` → matching major.
  - Update `vitest` (already 4.x) if Vite 7 requires newer bundler hooks.

## Server Upgrade Steps

1. `npm install --workspace=packages/server jest@latest ts-jest@latest @types/jest@latest` (expect ts-jest ≥ 30.3.0).
2. Update `jest.config.js` if ts-jest introduces config changes (e.g., `isolatedModules`, `diagnostics` flags).
3. Re-run `npm test --workspace=packages/server` with `--runInBand` to confirm the Express/Supertest suites still pass.
4. Capture any new diagnostics (watch for stricter fake timers behavior).
5. Update `docs/branch-hardening-baseline.md` if commands change.

## Client Upgrade Steps

1. `npm install --workspace=packages/client vite@latest @vitejs/plugin-react@latest vitest@latest`.
2. Review `vite.config.ts` for breaking changes (Vite 7 tightened the `server.fs` defaults—verify our config does not rely on deprecated options).
3. Run:
   - `npm run dev --workspace=packages/client` to validate hot reload.
   - `npm run build --workspace=packages/client` to ensure production build succeeds.
   - `npm test --workspace=packages/client` (Vitest) and Playwright e2e scripts.
4. Rebuild Docker images (`docker-compose build`) to confirm the new Vite version plays nicely inside containers.

## Rollout / Verification

- Perform upgrades on a feature branch and keep the new unit tests as regression guards.
- Share the results (`npm audit`, `npm test`, `npm run build`) in PR description.
- Once merged, cut a follow-up ticket to re-run `npm audit` to confirm CVE resolution.
