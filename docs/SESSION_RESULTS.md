# Milestone 0 Session Results

Milestone 0 is implemented and locally verified.

## Files Created

- Tooling: `package.json`, `package-lock.json`, `tsconfig.json`, `vite.config.ts`, `eslint.config.js`, `playwright.config.ts`
- Formatting and ignores: `.prettierrc.json`, `.prettierignore`, `.gitignore`
- Host: `index.html`, `src/main.ts`, `src/bootstrap/host-model.ts`, `src/bootstrap/render-host.ts`, `src/bootstrap/start-afterboot.ts`, `src/styles/main.css`
- Tests: `tests/unit/host-model.test.ts`, `tests/e2e/host.smoke.spec.ts`
- Automation: `.github/workflows/afterboot-build.yml`, `.github/workflows/afterboot-release.yml`
- Documentation: `README.md`

## Files Modified

- `CHANGELOG.md`
- `docs/AFTERBOOT_PROJECT.md`

## Dependencies

- `vite@7.3.6`: development server and static build.
- `typescript@5.9.3`, `@types/node@24.13.6`: strict typing and configuration types.
- `eslint@9.39.5`, `@eslint/js@9.39.5`, `typescript-eslint@8.70.1`, `globals@16.5.0`: linting.
- `prettier@3.9.9`: formatting.
- `vitest@3.2.7`: unit testing.
- `@playwright/test@1.63.0`: production browser smoke testing.

All are development dependencies.

## Project Structure

```text
.github/workflows/
  afterboot-build.yml
  afterboot-release.yml
docs/
  AFTERBOOT_PROJECT.md
src/
  bootstrap/
    host-model.ts
    render-host.ts
    start-afterboot.ts
  styles/main.css
  main.ts
tests/
  e2e/host.smoke.spec.ts
  unit/host-model.test.ts
CHANGELOG.md
README.md
index.html
package.json
tsconfig.json
vite.config.ts
eslint.config.js
playwright.config.ts
```

Generated `dist/`, `node_modules/`, Playwright results, and `.playwright-mcp/` are ignored.

## Scripts

- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run typecheck`
- `npm run lint`
- `npm run format`
- `npm run format:check`
- `npm test`
- `npm run test:watch`
- `npm run test:e2e`

## Automation

- CI checks formatting, typing, linting, unit tests, production build, and Chromium smoke testing.
- The Pages workflow builds and uploads only `dist/`.
- Vite emits relative `./assets/...` URLs, avoiding a hardcoded repository name.

## Verification

- Typecheck: passed
- ESLint: passed
- Prettier: passed
- Vitest: 1 test passed
- Production build: passed
- Playwright: 1 smoke test passed
- Desktop and mobile visual checks: passed
- Console errors, page errors, and failed requests: none

## Architectural Decisions

Vanilla TypeScript and Vite are now recorded as decided. The browser baseline is current evergreen browsers, with Chromium automated initially.

## Remaining Verification

Hosted CI and Pages execution remains pending repository initialization and push. At the end of this session, the workspace had no `.git` metadata.

## Release Status

No `v0.1.0` changelog entry, Git tag, GitHub Release, or release claim was created.
