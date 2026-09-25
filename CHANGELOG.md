# Changelog

All notable changes to AFTERBOOT are documented here.

## [Unreleased]

### Added

- A DOM-independent window manager with deterministic centered/cascaded placement, focus ordering, constrained movement/resizing, minimize, maximize, restore, close, responsive work-area handling, and typed fact events.
- A startup-only immutable application registry and single-instance application manager with stable identities, scoped auxiliary windows, primary-window close semantics, and explicit disposal/reset behavior.
- A responsive SHADOW OS desktop with an application launcher, open-window task strip, accessible window chrome, pointer dragging/resizing, desktop floating windows, and active-window small-screen presentation.
- A minimal System Diagnostics application that proves public application mounting and multi-window lifecycle behavior without introducing filesystem or later-milestone services.
- Unit, integration, and Playwright coverage for application/window lifecycle, geometry, focus, pointer interaction, keyboard controls, responsive behavior, and reset cleanup.
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

- Replaced the static ready-desktop projection with a disposable desktop/window projection composed from explicit application and window services.
- Adopted startup-only registration, single-instance applications, primary-window disposal, pointer-only move/resize, no global window-cycling shortcut, and active-window small-screen presentation for M2.
- Replaced the Milestone 0 static host projection with a disposable shell view driven by runtime snapshots.
