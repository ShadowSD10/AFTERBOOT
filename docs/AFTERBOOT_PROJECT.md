# AFTERBOOT Project Specification

> **Status:** Living architectural reference  
> **Last updated:** 2026-09-26  
> **Current stage:** Milestone 0 and its hosted deployment are complete; Milestone 1 is implemented and ready for final review; Milestone 2 has not started

## Status vocabulary

This document uses the following labels to separate commitments from possibilities:

- **Decided** — a project requirement or an architectural choice currently adopted.
- **Proposed** — the recommended direction, subject to validation during implementation.
- **Open question** — a choice that should be deferred until more evidence is available.
- **Future idea** — intentionally outside the current implementation scope.

## 1. Project overview

**AFTERBOOT** is a browser-based interactive experience in which the player operates a fictional computer. The simulated computer boots into **SHADOW OS**, a cohesive operating-system environment implemented entirely with web technologies.

AFTERBOOT is the product and host application. SHADOW OS is the fictional operating system simulated by it. Future scenarios and games run inside SHADOW OS and use its systems rather than replacing them with scenario-specific screens.

The application is intended to be distributed as a static website, initially through GitHub Pages. It requires no backend, account, authentication, database, cloud service, or persistent user data.

## 2. Product vision

Opening AFTERBOOT should feel like entering another computer, not launching a conventional game or viewing a collection of desktop-themed widgets. Boot behavior, desktop interactions, applications, files, processes, and system feedback should reinforce a single understandable simulation.

The long-term product has two complementary experiences:

1. A SHADOW OS sandbox that is satisfying to boot, explore, and operate.
2. Investigation and puzzle scenarios that use the same OS services and applications as the sandbox.

The operating system itself is the game environment. Scenarios should provide goals and alter simulated state, while leaving players free to investigate through ordinary OS interactions.

## 3. Phase 1 goals — SHADOW OS sandbox

**Decided:** Phase 1 establishes reusable OS foundations before scenario gameplay.

Initial goals are:

- A deliberate boot-to-desktop experience.
- A coherent shell containing a desktop, application launcher or equivalent entry point, task area, clock, and system feedback.
- A window manager that supports multiple application windows and predictable focus, movement, resizing, minimization, maximization, restoration, and closing.
- An application model through which built-in applications are registered and launched.
- An in-memory virtual filesystem exposed through a typed service boundary.
- A small number of applications that prove the architecture, rather than a broad collection of shallow mockups.
- Keyboard, pointer, responsive-layout, and basic accessibility behavior designed as part of the shell rather than added after it.
- A deterministic demo state suitable for automated testing.

Suggested proof applications are a file manager and text viewer/editor because together they exercise application launch, windows, filesystem reads, shared resources, and file associations. A terminal should follow only after a stable command/service boundary exists.

### Phase 1 non-goals

- Simulating every feature of a real operating system.
- Real machine access, arbitrary host filesystem access, or native process execution.
- Networking that requires a backend.
- User accounts or authentication.
- Building all possible applications at once.
- Scenario-specific puzzle logic.
- Pixel-perfect imitation of an existing commercial operating system.

## 4. Phase 2 goals — scenarios and games

**Decided:** Scenarios will be consumers of SHADOW OS capabilities, not alternate user interfaces layered over it.

Phase 2 should allow a scenario to:

- Define initial virtual files, metadata, messages, logs, settings, processes, and other simulated resources.
- Observe meaningful domain events without depending on DOM structure.
- Express objectives and completion conditions in terms of simulation state.
- Apply controlled changes to OS state through public service interfaces.
- Save or reset scenario progress if and when persistence is introduced.
- Remain isolated from unrelated applications and scenario implementations.

Scenario infrastructure should not be implemented until the core services it needs have stable, tested contracts.

## 5. Core design principles

1. **The simulation is the product.** Interactions should contribute to the illusion of operating a coherent computer.
2. **Domain state is independent of the DOM.** Files, processes, windows, and scenario facts are modeled data; UI elements render and manipulate that data through APIs.
3. **Applications use OS services.** Applications do not reach into one another's UI or private state.
4. **One capability, one authority.** Each mutable domain has a clear owning service to avoid conflicting sources of truth.
5. **Events communicate facts, commands request changes.** Events describe completed state transitions; mutations occur through explicit service methods.
6. **Small, cohesive modules.** Files and modules should have narrow responsibilities, explicit dependencies, and names that an engineer or coding agent can discover easily.
7. **Determinism by default.** Seed data, clocks, identifiers, and scenario setup should be injectable where tests require repeatable behavior.
8. **Accessibility is behavior.** Focus, keyboard navigation, labels, contrast, reduced motion, and screen-size constraints are functional requirements.
9. **Static-first delivery.** Runtime features must work from static assets without secret values or server assumptions.
10. **Grow from proven needs.** Introduce abstractions only when they protect a real boundary or support a planned capability.

## 6. Technical constraints

### Decided

- The production artifact is a static site compatible with GitHub Pages.
- Runtime code has no required backend, database, authentication, account, or cloud dependency.
- No secrets may be required in the browser bundle.
- Core implementation uses TypeScript and modern browser APIs.
- Development and test tooling may use Node.js, but Node.js is not a runtime requirement for users.
- Playwright MCP and Chrome DevTools MCP are development tools only and must not be bundled as application dependencies.
- The site must work when hosted beneath a GitHub Pages repository subpath; asset URLs and routing must not assume `/`.
- Persistent user data is not required. The initial simulation may reset on reload.

### Implemented engineering baseline

- Vite for local development and static production builds.
- Strict TypeScript configuration.
- Vanilla TypeScript and standards-based DOM/CSS for the initial host.
- Vitest for unit and service-level integration tests.
- Playwright for end-to-end browser tests, with MCP tools used interactively during development.
- ESLint and Prettier, kept minimal and automated.
- Current evergreen browsers with ES2022, standard DOM APIs, CSS Grid, and CSS custom properties form the initial browser baseline. CI initially verifies Chromium; broader browser and assistive-technology coverage grows with the interactive shell.

Vanilla TypeScript was selected because the early complexity is primarily domain modeling, interaction, focus, layering, and window geometry—not page routing or form-heavy component composition. A UI framework should be adopted later only if measured implementation pain justifies its runtime and architectural cost.

## 7. Proposed architecture

The recommended architecture is a layered, service-oriented client application with explicit dependency direction:

```text
Bootstrap / Composition Root
          |
          v
  SHADOW OS Runtime
          |
          +------ Core services and domain models
          |       (filesystem, processes, settings, events, clock)
          |
          +------ Shell services
          |       (windows, app registry, launcher, notifications)
          |
          +------ Built-in applications
          |       (depend on public OS contracts)
          |
          +------ Scenario runtime [Phase 2]
                  (depends on public OS contracts)

UI adapters render service state and translate user intent into service commands.
Core services never depend on application UI or browser DOM nodes.
```

### Runtime composition

A single composition root should construct services, register applications, seed initial state, and start the shell. Dependencies should be passed explicitly rather than imported from mutable global singletons. A small `OSContext`/`SystemServices` interface can expose approved capabilities to applications.

Milestone 1 implements this pattern for the lifecycle slice: the composition root injects a clock into the DOM-independent runtime, isolates browser time and motion queries behind platform adapters, and mounts the shell as a disposable projection of runtime snapshots. Boot progression is an explicit ordered stage model owned by the runtime, with one cancellable scheduled transition at a time; the shell only projects the current stage. Skip, reset, failure, and disposal cancel pending boot work before changing lifecycle state.

### State model

Each service owns its domain state and offers:

- Typed command methods for mutations.
- Read-only snapshots or queries for inspection.
- Typed change events for subscribers.

This is intentionally simpler than a universal state store. Cross-service workflows belong in the runtime/orchestration layer, not in UI components. If transactionality or event replay becomes necessary, the model can evolve without changing application-facing contracts wholesale.

### UI model

The UI layer should consist of focused view/controllers or lightweight components that:

- Subscribe to relevant service state.
- Render semantic DOM.
- Translate input into domain commands.
- Own only ephemeral presentation state when practical.
- Dispose listeners and browser resources explicitly.

No UI technology is permanently mandated at this stage.

## 8. Major subsystems

| Subsystem                  | Status                  | Purpose                                                                                                           |
| -------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Bootstrap/composition root | Implemented (M1 base)   | Builds the runtime, injects adapters, seeds initial data, registers applications, and starts SHADOW OS.           |
| OS runtime                 | Implemented (M1 base)   | Coordinates lifecycle and cross-service workflows without becoming a general-purpose god object.                  |
| Event system               | Implemented (M1 base)   | Provides typed, synchronous domain notifications with explicit subscription disposal.                             |
| Window manager             | Proposed                | Owns windows, focus order, geometry, modes, and lifecycle transitions.                                            |
| Application framework      | Proposed                | Defines app manifests, registration, launch requests, instances, and access to approved OS services.              |
| Virtual filesystem         | Proposed                | Owns paths, nodes, file contents, metadata, directory operations, and filesystem events.                          |
| Process/task service       | Proposed, later Phase 1 | Tracks running application instances and simulated system tasks; it does not represent real browser/OS processes. |
| Shell                      | Partial (M1 boot shell) | Renders desktop surfaces, task area, launcher, notifications, context menus, and global keyboard/focus behavior.  |
| Settings/configuration     | Proposed                | Stores typed runtime preferences and system configuration, initially in memory.                                   |
| Notifications              | Proposed                | Accepts structured notifications and manages their visible lifecycle.                                             |
| Search                     | Future idea             | Queries indexed resources through provider interfaces rather than knowing every subsystem.                        |
| Scenario engine            | Deferred to Phase 2     | Loads scenario definitions, applies setup, evaluates objectives, and records scenario state.                      |
| Platform adapters          | Partial (M1)            | Isolate browser-specific APIs such as storage, time, animation, and viewport behavior where testability benefits. |

## 9. Subsystem responsibilities and boundaries

### OS runtime

- Own startup, shutdown/reset, and high-level lifecycle state such as booting, ready, or failed.
- Expose a deliberately small capability surface to the shell and applications.
- Coordinate operations spanning multiple services.
- Avoid owning data that clearly belongs to another service.

### Window manager

- Assign stable window identifiers.
- Track application/process ownership, title, bounds, focus order, and window mode.
- Enforce geometry constraints and valid state transitions.
- Keep domain window state separate from rendered elements.
- Provide commands such as open, focus, move, resize, minimize, maximize, restore, and close.
- Leave pointer capture and visual rendering to UI adapters.

### Application framework

- Register immutable application manifests.
- Resolve an application identifier into a launchable application definition.
- Create one or more instances according to an application's declared policy.
- Provide each instance only the services allowed by the public application context.
- Separate application identity from a particular window or process instance.

### Virtual filesystem

- Normalize and validate virtual paths consistently.
- Model files and directories using stable identifiers plus paths.
- Provide typed operations and specific errors.
- Own file metadata and content revisions.
- Emit domain events after successful changes.
- Remain storage-agnostic so an in-memory adapter can later be replaced or supplemented by browser persistence.
- Never imply access to the user's real filesystem.

### Process/task service

- Represent simulated processes and application instances.
- Track lifecycle and relationships to windows.
- Support inspection and controlled termination through simulation APIs.
- Avoid exposing or claiming control over actual browser or operating-system processes.

### Shell

- Render global OS surfaces and coordinate focus behavior.
- Consume services rather than duplicating their state.
- Own visual themes and layout tokens.
- Provide robust fallback layouts on small screens.
- Respect reduced-motion preferences during boot and transitions.

### Scenario engine

- Load declarative scenario metadata and setup data.
- Use normal service APIs to construct and mutate the simulated world.
- Observe domain events and query state to evaluate objectives.
- Keep narrative/progression state distinct from general OS state.
- Avoid direct DOM selectors and application-private imports.

## 10. Important interfaces and concepts

Names below communicate intended boundaries, not final signatures.

### `SystemServices`

A capability object supplied to trusted shell code and narrowed for applications. Likely capabilities include filesystem access, window launch requests, notifications, process queries, settings, and a clock. Separate read-only and mutable interfaces where it improves safety or scenario validation.

### `ApplicationManifest`

Describes stable application metadata such as identifier, display name, icon reference, supported file types/actions, launch policy, and factory. Registration data should be independent of current running instances.

### `ApplicationInstance`

Represents one running app instance with a stable ID and explicit lifecycle/disposal contract. It may own one or more windows eventually, though the first version can enforce one primary window.

### `WindowState`

A serializable domain value containing stable identity, owner, bounds, mode, title, focus ordering, and constraints. DOM elements and callbacks do not belong in this state.

### `VirtualFileSystem`

A service contract for path lookup, listing, reading, writing, creating, moving, and deleting virtual nodes. Operations should return typed results or well-defined errors and should not leak storage implementation details.

### `DomainEvent`

A typed record of something that has happened, including event type and domain payload. Subscription must return an unsubscribe/dispose function. Initial dispatch can be synchronous; queueing and replay are deferred until required.

### `ScenarioDefinition` (Phase 2)

A versioned scenario description containing metadata, initial-world setup references, and objective definitions. Executable extensions may be needed later, but declarative data should be preferred for content that does not require custom behavior.

### Identifiers and time

Window, process, application-instance, file-node, and scenario IDs should be branded or otherwise strongly typed to prevent accidental interchange. ID generation and clock access should be injectable for deterministic tests.

## 11. Proposed project structure

This is a target structure to introduce incrementally; empty directories should not be created merely to match it.

```text
AFTERBOOT/
├─ .github/
│  └─ workflows/
│     ├─ afterboot-build.yml
│     └─ afterboot-release.yml
├─ docs/
│  ├─ AFTERBOOT_PROJECT.md
│  └─ decisions/                 # Add ADRs only when decisions need deeper records
├─ public/
│  └─ assets/                    # Static icons, fonts, audio, and seed content
├─ src/
│  ├─ bootstrap/                 # Composition root and startup
│  ├─ core/
│  │  ├─ events/
│  │  ├─ filesystem/
│  │  ├─ processes/
│  │  ├─ settings/
│  │  └─ time/
│  ├─ shell/
│  │  ├─ desktop/
│  │  ├─ windows/
│  │  ├─ launcher/
│  │  └─ notifications/
│  ├─ applications/
│  │  ├─ framework/
│  │  └─ built-in/
│  ├─ scenarios/                 # Introduce in Phase 2
│  ├─ platform/                  # Browser/storage adapters
│  ├─ styles/
│  └─ main.ts
├─ tests/
│  ├─ unit/
│  ├─ integration/
│  └─ e2e/
├─ index.html
├─ package.json
├─ tsconfig.json
└─ vite.config.ts
```

Keep tests near modules if that proves easier to maintain; the exact test layout remains open. Prefer public entry points for each subsystem and avoid catch-all `utils` or `common` directories.

## 12. Development roadmap

### Milestone 0 — foundation

**Status:** Complete. Local quality gates, GitHub Actions validation, and the production Pages deployment have passed.

- Adopt Vite, strict TypeScript, formatting/linting, and test tooling.
- Establish static build and GitHub Pages base-path behavior.
- Add a minimal composition root and an application-wide error boundary/fallback.
- Define visual tokens and browser support expectations.
- Add CI for type checking, unit tests, production build, and a minimal browser smoke test.

**Exit criterion:** A blank but intentional SHADOW OS host page builds, tests, and deploys from a clean checkout.

### Milestone 1 — runtime and boot shell

**Status:** Implemented and verified on `feature/m1-runtime-boot-shell`; final milestone review pending.

- Define runtime lifecycle states.
- Implement a skippable, reduced-motion-aware boot sequence.
- Render the desktop shell with deterministic clock injection and basic responsive behavior.
- Add typed event infrastructure only as needed by the runtime.

**Exit criterion:** SHADOW OS reliably boots to an accessible desktop and can reset without a reload during tests.

### Milestone 2 — windows and applications

- Implement window state transitions independently of the DOM.
- Add focus, movement, resize, minimize, maximize, restore, and close behavior.
- Define the application registry and application context.
- Build one diagnostic/sample app to exercise lifecycle behavior.

**Exit criterion:** Multiple app instances can be operated through pointer and keyboard input with tested state transitions.

### Milestone 3 — virtual filesystem and proof applications

- Implement an in-memory virtual filesystem with seed data and typed errors.
- Build a file manager and text viewer/editor against the filesystem contract.
- Add file-open routing through application registration.

**Exit criterion:** A user can navigate, open, edit, and revisit a virtual text file without applications sharing private state.

### Milestone 4 — coherent sandbox

- Add task/process visibility, settings, notifications, and selected shell polish.
- Consider a terminal only after defining safe virtual commands over OS services.
- Improve small-screen behavior, accessibility, performance, and recovery from app failures.

**Exit criterion:** The sandbox feels coherent, remains stable with several open apps, and passes the agreed quality gates.

### Milestone 5 — scenario foundation

- Document scenario requirements learned from the finished sandbox.
- Define versioned scenario packages, setup/reset, objectives, and event observation.
- Build one narrow proof scenario using only public OS interfaces.

**Exit criterion:** The proof scenario can configure the world and detect completion without DOM coupling or scenario-specific changes in core services.

## 13. Testing strategy

### Unit tests

Focus on deterministic domain behavior:

- Path normalization and filesystem operations.
- Window state transitions and geometry constraints.
- Application registration and lifecycle rules.
- Process lifecycle.
- Objective evaluation when Phase 2 begins.

Tests should use fake clocks and deterministic ID generators where relevant.

### Integration tests

Construct real groups of services without rendering the full UI. Verify workflows such as launching an app, opening a file, updating process state, closing windows, and resetting seeded state.

### Browser end-to-end tests

Use Playwright for a small, high-value suite:

- Static app loads correctly under a repository-style base path.
- Boot reaches the desktop and can be skipped where supported.
- An application launches and its window can be focused, moved, resized, minimized, restored, and closed.
- A seeded file can be opened and edited through public UI.
- Keyboard-only critical paths work.
- No unexpected console errors occur.

Prefer roles, accessible names, and stable user-facing semantics over CSS selectors tied to implementation details.

### Manual and exploratory testing

Use Playwright MCP for interactive flows and Chrome DevTools MCP for console, network, accessibility, layout, and performance investigation. Validate current Chromium, Firefox, and WebKit behavior through automated CI where practical; manually inspect touch/small-screen and reduced-motion behavior.

### Quality gates

Every merge to the main branch should eventually require:

- Type checking.
- Linting/format verification.
- Unit and integration tests.
- Production build.
- Essential browser smoke tests.
- No accidental external network or secret dependency in the production experience.

## 14. Deployment strategy

**Implemented:** Vite builds the application into static assets, and the Pages workflow uploads only the generated `dist/` output for deployment through GitHub Actions.

Requirements:

- Configure the build base path from the repository deployment context.
- Use relative or base-aware asset references.
- Prefer a single entry route initially, avoiding client-side route refresh problems on GitHub Pages.
- Run quality gates before deployment.
- Deploy only generated output; do not commit build artifacts unless a later constraint requires it.
- Pin the supported Node.js version for repeatable CI builds.
- Keep development/test MCP artifacts and local reports out of production output.

A custom domain can be added later without changing the runtime architecture.

## 15. Versioning and releases

AFTERBOOT uses Semantic Versioning (`MAJOR.MINOR.PATCH`): `MAJOR` denotes breaking changes to established public contracts or major product compatibility changes, `MINOR` denotes backward-compatible functionality or a meaningful feature milestone, and `PATCH` denotes fixes, corrections, and small non-breaking changes.

During development, `0.x.x` versions indicate that the product and its public contracts are still evolving. The first release will be `v0.1.0`, but it must not be created until Milestone 0 is implemented and its exit criterion is verified. The eventual `v1.0.0` will identify the first complete, stable release intentionally designated as the proper AFTERBOOT product release; no date or specific roadmap milestone is assigned to it yet.

Root-level `CHANGELOG.md` records notable changes under `[Unreleased]` until a release is made, then groups those changes under the released version. Ordinary commits contribute work but do not constitute releases. Each release should correspond to a `vMAJOR.MINOR.PATCH` Git tag, such as `v0.1.0`, `v0.2.0`, or `v1.0.0`; a GitHub Release may use that tag for public release notes.

## 16. Architectural decisions

| ID    | Status   | Decision                                                                                | Rationale                                                                                                              |
| ----- | -------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| A-001 | Decided  | AFTERBOOT ships as a static browser application with no required backend.               | Core product constraint and simplest distribution model.                                                               |
| A-002 | Decided  | SHADOW OS state is simulated and cannot access the user's real OS resources by default. | Maintains security, portability, and a clear fictional boundary.                                                       |
| A-003 | Decided  | Simulation/domain state is independent from DOM state.                                  | Enables testing, scenarios, alternate views, and maintainable behavior.                                                |
| A-004 | Decided  | Applications and future scenarios use explicit OS service interfaces.                   | Prevents hidden coupling and scenario-specific core hacks.                                                             |
| A-005 | Decided  | TypeScript is the primary implementation language.                                      | Supports explicit contracts and safe evolution of interconnected systems.                                              |
| A-006 | Decided  | Begin with vanilla TypeScript rather than a UI framework.                               | Avoids committing to framework abstractions before UI needs are understood. Reassess after the first substantial apps. |
| A-007 | Decided  | Use Vite as the development/build tool.                                                 | Produces static assets, supports TypeScript well, and allows GitHub Pages base configuration.                          |
| A-008 | Decided  | Use service-owned state plus typed events rather than a universal global store.         | Matches subsystem authority while keeping the first implementation small.                                              |
| A-009 | Proposed | Start with an in-memory filesystem behind a storage-neutral interface.                  | Meets the no-persistence requirement while preserving a future persistence path.                                       |
| A-010 | Decided  | Use one composition root and explicit dependency injection without a DI framework.      | Keeps construction understandable and tests easy to isolate.                                                           |
| A-011 | Proposed | Avoid URL-based in-OS navigation initially.                                             | The desktop is a stateful single experience and GitHub Pages has route fallback constraints.                           |
| A-012 | Decided  | Scenario infrastructure is deferred until foundational OS contracts are proven.         | Prevents scenario needs from being guessed and baked into unstable systems.                                            |

When a proposed decision is implemented and validated, change its status to **Decided**. Significant reversals or trade-offs should be captured in a short ADR under `docs/decisions/`.

## 17. Open questions

These questions should be answered near the milestone where they matter:

1. Which mobile/tablet interaction modes and layouts will be officially supported by the interactive shell?
2. Should small screens show freely resizable windows, constrained/snap layouts, or a single-window mode?
3. What visual and audio identity should distinguish SHADOW OS without imitating a real OS?
4. Does the initial filesystem need permissions, ownership, timestamps, links, mounts, or only files/directories and basic metadata?
5. Should file contents be strings/JSON initially, or should binary blobs be supported from the first filesystem version?
6. When persistence becomes desirable, should it be opt-in local storage, IndexedDB, import/export files, or a combination?
7. Are scenario packages authored as JSON data, TypeScript modules bundled at build time, or a validated hybrid?
8. Is deterministic replay valuable enough to constrain event and time design early?
9. How should application crashes be isolated and represented inside the fictional OS?
10. Which accessibility target and test matrix will be treated as release criteria?
11. Are audio cues essential to the initial boot experience, and how will autoplay restrictions be handled?
12. Should the repository retain generated `.playwright-mcp` artifacts, or should they be ignored unless intentionally captured as test evidence?

## 18. Future possibilities

The following are ideas, not commitments:

- Optional local saves with explicit reset and export/import.
- A versioned scenario package format and community-authored scenarios.
- Simulated email, browser history, logs, network state, accounts, and recoverable deleted files.
- Search providers spanning files, settings, apps, and scenario-owned content.
- A safe virtual terminal whose commands call OS services rather than executing host commands.
- Theme packs, accessibility presets, and localization.
- Seeded procedural machine states for replayable investigations.
- A developer inspector for viewing simulation state and events outside normal gameplay builds.
- Progressive Web App installation and offline caching, if it improves the experience without complicating updates.
- Controlled cross-application protocols such as open-file, reveal-item, or inspect-process actions.

Future features must preserve the static-runtime constraint unless the project's core requirements are explicitly changed.

---

## Immediate next step

Complete the final **Milestone 1** review using `docs/AFTERBOOT_MILESTONES.md` as the gate and decide whether approval requires a separate manual reduced-motion check. Do not begin Milestone 2 until the Milestone 1 Definition of Done is fully satisfied and approved.
