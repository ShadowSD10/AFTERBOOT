# Changelog

All notable changes to AFTERBOOT are documented here.

## [Unreleased]

### Added

- A DOM-independent SHADOW OS runtime with typed lifecycle snapshots, reset/failure commands, synchronous fact events, and explicit disposal.
- Injectable clock infrastructure with deterministic runtime, system-time, and boot/reset integration tests.
- An accessible staged boot-to-desktop shell with keyboard skip, reduced-motion handling, a browser-local system clock, and in-place restart behavior.
- Browser coverage for boot, reduced motion, desktop readiness, restart without reload, responsive layouts, console errors, and failed requests.
- A minimal responsive AFTERBOOT host surface with SHADOW OS preparation state and startup fallback.
- A Vite and strict TypeScript foundation using vanilla browser APIs and CSS.
- ESLint, Prettier, Vitest, and Playwright quality tooling with unit and browser smoke coverage.
- GitHub Actions workflows for continuous integration and static GitHub Pages deployment.
- Contributor setup, command, browser-baseline, and static-deployment documentation.

### Changed

- Replaced the Milestone 0 static host projection with a disposable shell view driven exclusively by runtime snapshots.
- Made Prettier line-ending checks portable across Windows and Unix worktrees.
