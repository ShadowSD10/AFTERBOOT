# Changelog

All notable changes to AFTERBOOT are documented here.

## [Unreleased]

### Added

- A DOM-independent SHADOW OS runtime lifecycle with typed snapshots, synchronous fact events, reset/failure handling, and explicit disposal.
- A staged boot experience spanning power-on, firmware-style output, sequential service initialization, finalization, and desktop readiness.
- An injectable clock boundary with browser-local desktop time and deterministic lifecycle/time tests.
- Accessible boot skipping, reduced-motion timing, in-place restart, and responsive desktop/mobile shell behavior.
- Browser verification for staged boot progression, desktop readiness, restart without reload, local clock output, responsive layouts, console errors, and failed requests.
- A minimal responsive AFTERBOOT host surface with SHADOW OS preparation state and startup fallback.
- A Vite and strict TypeScript foundation using vanilla browser APIs and CSS.
- ESLint, Prettier, Vitest, and Playwright quality tooling with unit and browser smoke coverage.
- GitHub Actions workflows for continuous integration and static GitHub Pages deployment.
- Contributor setup, command, browser-baseline, and static-deployment documentation.

### Changed

- Replaced the Milestone 0 static host projection with a disposable shell view driven by runtime snapshots.
