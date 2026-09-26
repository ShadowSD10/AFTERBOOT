# AFTERBOOT Session Results

## Complete Project Context Baseline

- **Date:** 2026-09-26
- **Task type:** Context-only repository and documentation review
- **Implementation branch inspected:** `main`
- **Documentation source:** `origin/documentation`
- **Result:** Complete working context established without changing implementation or remote state

### Repository State

The repository was inspected before reviewing project documentation or implementation.

- Current implementation branch: `main`
- `HEAD` and `origin/main`: `5593c50bd33a53f977f8255beb63e12bfda512d6`
- Main commit: `release: promote develop to production (#3)`
- `origin/develop`: `0135404d61219ac1e3071123179d45911c04e44a`
- Develop commit: `feat: complete M2 windows and applications (#2)`
- `origin/documentation`: `4749fa83c6a7bfdecd7464b2d91a2d39356da795`
- Documentation commit: `docs: record development environment setup`
- `main` was aligned with `origin/main`.
- The implementation working tree and index were clean.

The relevant remote-tracking references were refreshed with `git fetch`. No branch was changed during the context review, and no remote state was modified.

The current Git history establishes that M2 was merged into `develop` and subsequently promoted to `main`. Some historical documentation records describe the earlier point at which the verified M2 feature branch had not yet been merged. Those records are historical snapshots and should not be rewritten or treated as evidence that the current repository is still in that earlier state.

## Project Identity

AFTERBOOT is a browser-based interactive experience in which the user operates a fictional computer. SHADOW OS is the simulated operating system running inside AFTERBOOT.

The long-term product has two complementary layers:

1. A SHADOW OS sandbox that can be booted, explored, and operated.
2. Investigation and puzzle scenarios that consume the same OS services and applications rather than replacing the operating system with scenario-specific screens.

The simulation is the product. SHADOW OS must remain a fictional, controlled environment and must not imply access to the user's real operating system, files, processes, accounts, or network.

## Current Product State

Milestones 0, 1, and 2 are complete. The current `main` branch contains those milestones and represents the deployed AFTERBOOT product.

The deployed product currently provides:

- a static browser host;
- a staged SHADOW OS boot sequence;
- a runtime lifecycle with reset, failure, skip, and disposal behavior;
- a responsive desktop shell;
- a deterministic and testable clock boundary;
- a typed event mechanism;
- DOM-independent window state and management;
- application registration and lifecycle management;
- single-instance application behavior;
- a System Diagnostics proof application;
- focus and z-order handling;
- pointer dragging and resizing;
- minimize, maximize, restore, and close behavior;
- keyboard-operable launcher and window controls;
- functional small-screen active-window presentation; and
- reset and cleanup across runtime, applications, windows, views, listeners, and timers.

No M3 implementation exists in the current source, tests, or workflows. Milestone 3 is documented as not started.

## Runtime and Bootstrap Architecture

The application has one explicit composition root. It constructs and connects:

- the browser clock;
- the SHADOW OS runtime;
- a sequential ID generator;
- the window manager;
- the startup application registry;
- the application manager; and
- the shell view.

The runtime is a DOM-independent state machine with these phases:

- `startup`
- `booting`
- `ready`
- `resetting`
- `failed`

It owns boot-stage progression, transition validation, scheduled work, skip behavior, reset, failure handling, cancellation, and disposal. The shell renders runtime snapshots but does not own runtime truth.

Global browser error and unhandled-rejection handling provide a static failure fallback if host initialization fails.

## Shell, Clock, and Events

The shell projects runtime state into power-on, firmware, initialization, ready-desktop, and failure views.

The desktop provides:

- an application launcher;
- an open-window task strip;
- local time and date;
- a reset/restart control; and
- focus synchronization with window state.

Time is accessed through an injectable clock boundary. Browser production code uses the local browser clock, while tests can use deterministic fake time.

Reduced-motion preference changes boot timing without bypassing essential lifecycle states.

Services own their state and communicate through typed events. Events represent completed facts, while commands request state changes. There is no universal global store.

## Window Architecture

`WindowManager` is the single authority for window state. Its model is independent from the DOM and supports:

- stable window identity;
- deterministic centered and cascaded placement;
- focus order and z-order;
- constrained movement and resizing;
- minimize, maximize, restore, and close;
- active-window recovery;
- responsive work-area changes; and
- reset and cleanup.

The window view projects manager snapshots into DOM windows and translates user interaction into manager commands.

Pointer behavior includes:

- title-bar dragging;
- resize-handle interaction;
- focus on pointer interaction; and
- window control activation.

Keyboard behavior uses normal focusable controls and navigation. M2 deliberately did not introduce a global window-cycling shortcut, keyboard movement, or keyboard resizing.

Desktop layouts use floating windows. Small-screen layouts provide a functional active-window presentation rather than claiming full desktop-equivalent interaction.

## Application Architecture

Applications consume explicit public contracts.

The application registry:

- is fixed during startup;
- rejects duplicate and unknown application IDs;
- exposes immutable definitions and manifests; and
- does not support dynamic installation.

The application manager:

- launches registered applications;
- owns application instance identity and lifecycle;
- creates primary and scoped auxiliary windows;
- mounts and disposes application views;
- applies primary-window close semantics;
- resets application and window state; and
- enforces single-instance behavior by restoring or focusing an existing primary window instead of creating another application instance.

The only current registered application is System Diagnostics. It proves the public application contract, single-instance behavior, and owned auxiliary-window lifecycle without introducing filesystem, persistence, process, networking, or scenario capabilities.

## Completed Milestones

### M0 - Foundation

M0 established:

- Vite;
- strict TypeScript;
- vanilla TypeScript, DOM, and CSS;
- ESLint;
- Prettier;
- Vitest;
- Playwright;
- GitHub Actions build verification;
- static GitHub Pages deployment; and
- a minimal responsive host with startup failure fallback.

M0 established the toolchain and static deployment foundation rather than the complete simulated operating system.

### M1 - Runtime and Boot Shell

M1 added:

- the DOM-independent runtime lifecycle;
- typed runtime snapshots and fact events;
- the staged boot sequence;
- the desktop-ready shell;
- injectable time and deterministic tests;
- accessible boot skipping;
- reset without a page reload;
- failure and disposal behavior;
- responsive desktop and mobile shell behavior; and
- reduced-motion timing.

M1 deliberately excluded windows, applications, filesystems, processes, persistence, networking, accounts, and scenario functionality.

### M2 - Windows and Applications

M2 added:

- serializable DOM-independent window state;
- one authoritative window manager;
- deterministic initial placement and cascading;
- focus and z-order;
- constrained dragging and resizing;
- minimize, maximize, restore, and close;
- responsive work-area handling;
- desktop floating-window presentation;
- functional active-window small-screen presentation;
- a startup-only immutable application registry;
- application instance and view lifecycle;
- single-instance applications;
- stable application and window identities;
- scoped auxiliary windows;
- primary-window ownership and disposal semantics;
- the System Diagnostics proof application;
- keyboard-operable launcher, task strip, focus, and window controls; and
- deterministic reset and cleanup behavior.

M2 was intentionally limited to proving window and application contracts.

## M2 Boundary and Deferred Capabilities

The current product does not yet provide:

- a virtual filesystem;
- a file manager;
- a text viewer or editor;
- a terminal;
- simulated processes or task management;
- persistent saves;
- local storage or IndexedDB integration;
- import or export;
- user accounts or authentication;
- simulated networking;
- investigation or scenario systems;
- dynamic application installation;
- multi-instance applications;
- real filesystem or machine access; or
- native process execution.

These capabilities must not be inferred from architectural discussion alone.

## Milestone 3

Milestone 3 - Virtual Filesystem and Proof Applications is the next roadmap milestone and is not started.

Its documented intended scope is:

- normalized virtual paths;
- stable filesystem node identity;
- files, directories, and required metadata;
- typed lookup, listing, reading, writing, creating, moving, and deleting operations;
- specific typed filesystem errors;
- filesystem events emitted only after successful mutations;
- a storage-neutral, DOM-independent, in-memory implementation;
- deterministic seeded files and directories;
- a file manager using the public filesystem contract;
- a text viewer/editor using the public filesystem contract;
- supported file-open routing through application registration or file associations; and
- no direct private-state sharing between proof applications.

M3 must not imply host filesystem access or introduce unrelated later-milestone services.

Before M3 implementation begins, the filesystem decisions required by the milestone need explicit resolution.

## Later Milestones and Future Boundaries

Later roadmap work may include:

- simulated process and task visibility;
- typed in-memory settings;
- managed system notifications;
- stronger application-failure isolation;
- broader accessibility and responsive behavior;
- scenario foundations and scenario packages;
- optional persistence;
- simulated accounts, messages, logs, browser history, and network state;
- search across simulated resources;
- a safe virtual terminal; and
- controlled cross-application protocols.

A terminal remains deferred unless a stable, safe command boundary is proven. Scenario logic remains isolated from foundational OS implementation and must consume public service contracts.

Future ideas are not current commitments.

## Branch Workflow

The project uses these branch roles:

- `main` - stable production and the source of the live site;
- `develop` - active integration and development;
- `feature/*` - implementation branches created from `develop`; and
- `documentation` - separately maintained documentation and historical reference.

The normal implementation flow is:

1. Create a feature branch from `develop`.
2. Implement and validate the feature or milestone.
3. Review and merge it into `develop`.
4. Perform integration and acceptance testing.
5. Promote `develop` through a separate pull request into `main`.
6. Deploy `main` to production.

Implementation branches must not be created from `documentation`. Documentation is maintained separately from implementation branches.

## Development and Verification Workflow

The current development environment uses:

- Vite;
- TypeScript;
- vanilla TypeScript, DOM, and CSS;
- ESLint;
- Prettier;
- Vitest;
- Playwright;
- GitHub Actions; and
- GitHub Pages.

Quality gates include:

- formatting verification;
- strict TypeScript type checking;
- ESLint;
- unit tests;
- integration tests;
- production build;
- Playwright browser tests; and
- responsive, pointer, keyboard, and manual acceptance checks where required.

Unit coverage includes runtime, typed events, time formatting, the application registry and manager, and window geometry and lifecycle.

Integration coverage includes runtime boot behavior and application/window relationships.

End-to-end coverage includes host startup, staged boot, boot skipping, desktop readiness, restart, local clock output, application launch, window behavior, pointer interaction, keyboard controls, responsive presentation, and cleanup.

The build workflow runs project quality gates. The release workflow builds and deploys generated static output from `main` to GitHub Pages.

Playwright MCP and Chrome DevTools MCP are developer-machine tools. They are not AFTERBOOT runtime dependencies and must not be added to the project dependency graph because they are available in the development environment.

## Deployment Strategy

AFTERBOOT is deployed as static generated output.

- Vite produces the `dist/` artifact.
- GitHub Actions uploads generated output rather than committing build artifacts.
- GitHub Pages serves the production site.
- `main` is the production deployment branch.
- The runtime requires no backend, database, authentication service, cloud service, or secret.
- Relative or base-aware assets support repository-subpath hosting.

Development/test MCP artifacts and local reports must remain outside production output.

## Versioning and Releases

AFTERBOOT uses Semantic Versioning:

- `MAJOR` represents breaking established contracts or major compatibility changes.
- `MINOR` represents backward-compatible functionality or a meaningful feature milestone.
- `PATCH` represents fixes and small non-breaking corrections.
- `0.x.x` indicates that the product and public contracts are still evolving.

Notable changes remain under `[Unreleased]` in `CHANGELOG.md` until an explicit release is made.

The following are separate project events:

- a commit records source history;
- milestone completion records roadmap and verification status;
- a changelog entry records notable work;
- a Git tag identifies an explicitly versioned source point;
- a GitHub Release publishes release information around a tag; and
- production deployment publishes the selected `main` build.

None of these automatically implies the others. A completed milestone or deployed `main` branch does not itself create or require a release, version tag, or GitHub Release.

No release should be created or suggested unless explicitly requested.

## Architectural Principles

Future implementation must preserve these principles:

1. **Simulation is the product.**
2. **Domain state remains independent from DOM state.**
3. **Applications and scenarios consume explicit OS service contracts.**
4. **Each mutable capability has one clear authority.**
5. **Commands request changes; events describe completed facts.**
6. **Modules remain small and cohesive.**
7. **Deterministic IDs, time, seed data, and behavior are preferred.**
8. **Accessibility is required behavior, including focus, keyboard use, labels, contrast, reduced motion, and screen-size constraints.**
9. **The architecture remains static-first and requires no backend.**
10. **SHADOW OS does not access real machine resources.**
11. **Scenario logic remains isolated from foundational OS services.**
12. **Construction uses one composition root and explicit dependency injection without a DI framework.**
13. **New abstractions are introduced for proven boundaries or planned capabilities rather than speculation.**

## Current Next Step

The roadmap identifies Milestone 3 - Virtual Filesystem and Proof Applications as the next milestone.

M3 has not started, and no M3 implementation currently exists. The filesystem questions necessary for M3 must be decided before implementation.

Historical records that say M2 still needs to be integrated into `develop` describe the earlier M2 verification point. Current Git references show that M2 has since been integrated into `develop` and promoted to production through `main`.

## Open Questions

The following questions remain unresolved:

1. Which mobile and tablet interaction modes and layouts will be officially supported?
2. Should later milestones broaden small-screen behavior beyond M2's functional active-window presentation?
3. What visual and audio identity should distinguish SHADOW OS without imitating a real operating system?
4. Does the initial filesystem need permissions, ownership, timestamps, links, mounts, or only files, directories, and basic metadata?
5. Should initial file contents be strings and JSON only, or should binary blobs be supported in the first filesystem version?
6. When persistence becomes desirable, should it use local storage, IndexedDB, import/export files, or a combination?
7. Should scenario packages be JSON data, TypeScript modules bundled at build time, or a validated hybrid?
8. Is deterministic replay valuable enough to constrain event and time design early?
9. How should application crashes be isolated and represented inside SHADOW OS?
10. Which accessibility target and test matrix will be treated as release criteria?
11. Are audio cues essential to the initial boot experience, and how should browser autoplay restrictions be handled?
12. Should generated Playwright MCP artifacts be retained only when intentionally captured as test evidence, or ignored by default?

The in-memory storage-neutral filesystem and avoidance of URL-based in-OS navigation remain proposed decisions until implemented and validated.

## Context Review Verification

The context review concluded with:

- the implementation working tree clean;
- the implementation index clean;
- `main` still checked out;
- `HEAD` unchanged and aligned with `origin/main`;
- no files modified or created;
- no commits created;
- no branches, tags, releases, pull requests, or deployments created;
- no pushes or merges;
- no dependencies installed;
- no configuration changed; and
- no remote state changed.

Only the relevant remote-tracking references were refreshed. This context is the baseline for future AFTERBOOT development, while the current repository implementation and dedicated documentation branch remain the source of truth.
