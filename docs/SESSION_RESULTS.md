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

---

# Milestone 2 Architecture Review

- **Date:** 2026-09-26
- **Branch:** `feature/m2-windows-applications`
- **Starting commit:** `92e4db8409a131eb7e8b5edb1e3085a452031b06`
- **Purpose:** Define the implementation boundary and architecture for Milestone 2 before changing application code.
- **Implementation status:** Not implemented — architecture review only

## Review Inputs

### Documentation Inspected

- `README.md`
- `CHANGELOG.md`
- `docs/AFTERBOOT_PROJECT.md`
- `docs/SESSION_RESULTS.md`
- `docs/AFTERBOOT_MILESTONES.md` from `origin/documentation`, read without switching branches because that file is not present on this feature branch

The current feature branch contains stale M0-era status text in `README.md`, `docs/AFTERBOOT_PROJECT.md`, and the earlier session entry. The canonical milestone document on `origin/documentation` records M1 complete and M2 not started. This review uses the current implementation as the source of truth for implemented behavior and the canonical milestone checklist as the source of truth for M2 scope. No stale documentation was edited during this review.

### Implementation Inspected

- `src/bootstrap/`
- `src/core/`, including runtime, events, time, and disposal contracts
- `src/platform/`
- `src/shell/`, including the boot/desktop projection and system time
- `src/styles/main.css`
- all unit, integration, helper, and Playwright tests
- `package.json`, `tsconfig.json`, `vite.config.ts`, `eslint.config.js`, and `playwright.config.ts`

There is currently no `src/applications/` directory, application registry, application instance model, window model, or window manager.

## Implemented Baseline

M1 provides a DOM-independent `ShadowRuntime`, immutable runtime snapshots, synchronous typed fact events, an injectable `Clock`, deterministic fake time, explicit `Disposable` cleanup, browser clock/motion adapters, and a disposable `ShellView`. The composition root owns construction and dependency wiring. The shell translates runtime snapshots into semantic DOM and delegates lifecycle commands back to the runtime.

The existing patterns are suitable for M2:

- mutable domain state has one owner;
- commands request changes and typed events report completed facts;
- subscriptions and scheduled work have explicit disposal;
- browser APIs stay outside core domain services;
- tests can drive time and state without rendering DOM;
- the composition root is the place for cross-service wiring.

The main pressure point is `ShellView`: it currently renders the entire ready desktop and replaces its root whenever the runtime phase changes. Adding window state, pointer geometry, application instances, and focus logic directly to this class would mix lifecycle projection, domain ownership, and browser interaction. M2 should extract the ready-state desktop into a dedicated disposable view while leaving boot/failure behavior and `ShadowRuntime` ownership intact.

## A. M2 Scope

M2 will implement exactly the window and application capabilities required by the milestone gate:

1. A serializable window model with stable identity, application-instance ownership, title, bounds, constraints, mode, restoration state, focus order, and active-window state.
2. A DOM-independent window manager with validated commands for open, focus, move, resize, minimize, maximize, restore, and close.
3. Pointer and keyboard adapters that translate browser input into window-manager commands without owning window state.
4. Immutable application manifests and a registry with duplicate detection and declared launch policies.
5. Stable application-instance identity plus explicit creation, launch, close, reset, and disposal behavior.
6. A narrow application context containing only approved M2 capabilities.
7. Coordination from application launch to instance creation to primary-window creation, and from close to window cleanup and instance disposal.
8. Multiple application instances/windows according to launch policy.
9. One diagnostic application that proves registration, context injection, launch, rendering, multiple-instance behavior, window lifecycle, and disposal without requiring later services.
10. Desktop-shell integration with a minimal application launcher, window layer, window chrome, and focus behavior.
11. Accessible pointer and keyboard operation and supported responsive desktop/mobile layouts.
12. Deterministic unit/integration tests and Playwright coverage for the complete M2 lifecycle.

The first M2 application instance should own one primary window. The architecture may permit future additional windows, but M2 does not need multi-window-per-instance behavior to prove the required multiple-instance workflow.

## B. Explicit Non-Scope

M2 must not implement:

- a virtual filesystem, paths, files, directories, metadata, storage adapters, or file associations;
- file manager or text editor/viewer proof applications, which belong to M3;
- simulated process/task state, process inspection, task-manager behavior, or controlled process termination, which belong to M4;
- settings, notifications, search, terminal commands, persistence, recovery bins, or broad shell polish, which belong to M4 or later;
- scenarios, objectives, world setup, narrative state, packages, or replay, which belong to M5/Phase 2;
- backend services, accounts, authentication, networking dependencies, host OS access, or real filesystem/process access;
- URL-based in-OS navigation unless separately decided later;
- audio or unrelated M1 boot redesign;
- a universal state store, dependency-injection framework, asynchronous event bus, event replay, or speculative plugin system;
- empty future directories or interfaces created only to resemble the target project tree.

The diagnostic application must use only M2 capabilities. It should not imitate future process monitoring, files, notifications, or settings merely to look more substantial.

## C. Proposed Module/File Changes

The paths below are a plan, not files created by this review.

### New Domain and Service Files

- `src/core/identifiers/id-generator.ts`
  - Defines an injectable ID-generation contract and a deterministic sequential implementation.
  - Belongs in core because both application and window services need IDs without depending on browser APIs or each other.

- `src/shell/windows/window-state.ts`
  - Defines branded `WindowId`, bounds, constraints, modes, restoration data, individual window state, and immutable manager snapshots.
  - Belongs under shell/windows because window geometry and focus are shell-owned domain state, not application or runtime lifecycle state.

- `src/shell/windows/window-manager.ts`
  - Owns window state, work-area constraints, focus ordering, transitions, validation errors, snapshots, events, reset, and disposal.
  - Belongs under shell/windows because it is the single authority for the window domain and contains no DOM nodes.

- `src/applications/framework/application.ts`
  - Defines branded application/application-instance IDs, immutable manifests, launch policy, application definition/instance contracts, public context, and serializable instance snapshots.
  - Belongs in the application framework because these contracts describe applications independently from registry and rendering details.

- `src/applications/framework/application-registry.ts`
  - Registers immutable definitions, rejects duplicate IDs, and resolves/list manifests without owning running instances.
  - Belongs in the framework because registration data and running lifecycle have separate authorities.

- `src/applications/framework/application-manager.ts`
  - Owns running application instances, enforces launch policies, creates the primary window through `WindowManager`, coordinates close/disposal, exposes snapshots/queries, and emits lifecycle facts.
  - Belongs in the framework because application-instance lifecycle must not be owned by the shell DOM or `ShadowRuntime`.

### New UI Adapter and Proof-Application Files

- `src/shell/desktop/desktop-view.ts`
  - Owns the ready-state desktop projection, launcher surface, system clock, window-layer mount, reset command, subscriptions, and view cleanup.
  - Belongs under shell/desktop because it composes shell surfaces but does not own application/window domain state.

- `src/shell/windows/window-layer-view.ts`
  - Projects window snapshots, mounts application content, renders accessible window chrome, manages pointer capture, and translates pointer/keyboard input into commands.
  - Belongs under shell/windows as the browser adapter for the DOM-independent manager.

- `src/applications/built-in/system-diagnostics.ts`
  - Defines the single M2 diagnostic manifest/definition and a minimal view that exposes safe instance/context facts useful for lifecycle verification.
  - Belongs under built-in applications because it is product-visible proof code, not framework behavior. It must not present filesystem, process, settings, or notification features.

- `src/styles/windows.css`
  - Contains stable work-area, window chrome, controls, focus, geometry, interaction, reduced-motion, and responsive rules.
  - Belongs in styles as a focused extension of the existing visual system rather than further growing one monolithic stylesheet.

### Existing Files to Modify During Implementation

- `src/bootstrap/start-afterboot.ts`
  - Construct the ID generator, window manager, registry, application manager, diagnostic definition, and desktop projection; coordinate runtime reset/failure/disposal with M2 cleanup.
  - This is the established composition root and should remain the only wiring location.

- `src/shell/shell-view.ts`
  - Retain startup/boot/failure projection but delegate ready-state rendering to `DesktopView`; dispose the active desktop projection before leaving ready state.
  - This prevents the current shell class from becoming the window/application state owner.

- `src/styles/main.css`
  - Import the focused window stylesheet and adjust the current static ready workspace into a stable desktop work area while preserving M1 boot/failure styles.

- `tests/e2e/host.smoke.spec.ts`
  - Preserve existing M1 regression coverage. Add shared failure-monitor helpers only if reuse with a separate M2 specification materially reduces duplication.

### New Test Files

- `tests/helpers/fake-id-generator.ts`: deterministic identifiers and assertions for instance/window creation order.
- `tests/unit/window-manager.test.ts`: every transition, invalid transition, geometry constraint, focus-order, and work-area behavior.
- `tests/unit/application-registry.test.ts`: immutable registration, lookup/listing, duplicate and unknown-ID handling.
- `tests/unit/application-manager.test.ts`: launch policy, instance identity, rollback, close, reset, and exactly-once disposal.
- `tests/integration/application-window-lifecycle.test.ts`: registry -> launch -> instance -> window -> focus/transition -> close/dispose without DOM coupling.
- `tests/e2e/windows-applications.spec.ts`: complete pointer, keyboard, multiple-window, responsive, console, and request-failure workflows.

No package, TypeScript, Vite, ESLint, or Playwright configuration change is expected. The existing test globs and browser project already cover the proposed test locations.

## D. Data/State Model

### Window State

`WindowManager` is the sole mutable owner. Its public snapshot should be deeply read-only and contain serializable values only.

Suggested concepts:

- `WindowId`: branded stable identifier.
- `ApplicationInstanceId`: branded owner identifier; not interchangeable with `WindowId` or application definition ID.
- `WindowBounds`: finite `x`, `y`, `width`, and `height` values.
- `WindowConstraints`: minimum dimensions and optional maximum dimensions.
- `WindowMode`: `normal`, `minimized`, or `maximized`.
- `restoreBounds`: the normal bounds retained while maximized.
- `restoreMode`: whether restoring a minimized window returns it to normal or maximized.
- `focusOrder`: deterministic monotonic ordering used to derive stacking.
- `WindowState`: ID, owner, title, current bounds, mode, restoration data, focus order, and constraints.
- `WindowManagerSnapshot`: ordered read-only windows plus `activeWindowId` and current work area.

The manager should enforce finite geometry, positive dimensions, constraints, work-area clamping, one active non-minimized window, and deterministic selection of the next active window after minimize/close. DOM elements, event handlers, pointer coordinates, application controllers, and render callbacks must never appear in snapshots.

### Application State

`ApplicationRegistry` owns immutable definitions and metadata. `ApplicationManager` separately owns running instance lifecycle.

Suggested concepts:

- `ApplicationId`: stable branded manifest identifier.
- `ApplicationInstanceId`: stable branded running-instance identifier.
- `ApplicationLaunchPolicy`: initially the smallest policies needed by the milestone, recommended as `single-instance` and `multiple-instance`.
- `ApplicationManifest`: frozen ID, display name, optional icon token, launch policy, and default primary-window metadata/constraints. Do not add file types/actions before M3 requires them.
- `ApplicationDefinition`: manifest plus a factory that receives the approved context.
- `ApplicationInstance`: private controller/view handle with stable IDs and idempotent `dispose()`.
- `ApplicationInstanceState`: serializable ID, application ID, primary window ID, and lifecycle status exposed in snapshots.
- `ApplicationManagerSnapshot`: read-only running instances.

Factories/view handles may contain behavior privately, but registry/manager snapshots must not contain DOM nodes. Launch should be atomic: if instance creation or primary-window opening fails, dispose partial work and leave both managers unchanged.

### Ownership Summary

- `ShadowRuntime`: OS boot/reset/failure phase only.
- `ApplicationRegistry`: immutable available-application definitions.
- `ApplicationManager`: running application instances and launch/close orchestration.
- `WindowManager`: window state, geometry, modes, focus, and stacking.
- `DesktopView`: ready-shell DOM and subscriptions.
- `WindowLayerView`: rendered windows and browser input adaptation.
- diagnostic application: only its own private presentation/controller state.
- composition root: dependency wiring and cross-service cleanup policy.

## E. Public APIs

Exact names may be refined during implementation, but the capability boundaries should remain:

### `IdGenerator`

- `next(scope): string` or a typed factory wrapper used by the owning service.
- Must be injectable so unit tests can predict every generated ID.

### `WindowManager`

- read-only `snapshot`.
- `open(request): WindowId`.
- `focus(windowId): boolean`.
- `move(windowId, position): boolean`.
- `resize(windowId, boundsOrSize): boolean`.
- `minimize(windowId): boolean`.
- `maximize(windowId): boolean`.
- `restore(windowId): boolean`.
- `close(windowId): boolean`.
- `setWorkArea(bounds): void` for responsive constraint changes.
- `onStateChanged(listener): Disposable`.
- `reset()` and `dispose()`.

Invalid IDs, impossible geometry, and forbidden mode transitions should have explicit typed errors or consistently documented no-op results. The implementation should choose one rule per command category and test it; it must not silently produce invalid state.

### `ApplicationRegistry`

- `register(definition): Disposable` only if dynamic unregistration is genuinely needed by composition/tests; otherwise registration can remain startup-only.
- `get(applicationId)` and `list()` as read-only queries.
- Duplicate registration must fail explicitly.
- No event is needed while registration is static at startup; adding one without a consumer would be speculative.

### `ApplicationManager`

- read-only `snapshot`.
- `launch(applicationId): ApplicationInstanceId`.
- `closeInstance(instanceId): boolean`.
- `closeWindow(windowId): boolean`, coordinating primary-window close with instance disposal.
- `getInstance(instanceId)` or a narrower view-resolution query for the shell adapter.
- `onStateChanged(listener): Disposable`.
- `reset()` and `dispose()`.

For a `single-instance` manifest, `launch` should focus and return the existing instance instead of creating a duplicate. For `multiple-instance`, each request receives a new instance and primary window.

### `ApplicationContext`

The context must be narrower than internal system services. For M2 it should contain only what the diagnostic app needs, such as:

- its own `applicationId` and `instanceId`;
- the injected read-only `Clock` if the diagnostic app uses time;
- scoped lifecycle/window requests that cannot mutate another application's windows.

Do not expose filesystem, process, settings, notifications, registry mutation, unrestricted `WindowManager`, `Document`, or global `Window` through the public application context.

### UI Adapter Contracts

Application content should use a small mount contract such as `mount(host, document): Disposable`. This permits DOM UI without placing DOM state in application/window snapshots. The window layer owns the host element and lifecycle; application content owns only listeners/resources inside its host.

## F. Event Model

Commands remain synchronous requests. Events remain synchronous typed facts emitted only after successful changes, following the existing `TypedEvent` pattern.

### Window Facts

A focused union or a state-changed event with a strict reason union should cover:

- `window-opened`;
- `window-focused`;
- `window-moved`;
- `window-resized`;
- `window-minimized`;
- `window-maximized`;
- `window-restored`;
- `window-closed`;
- `window-work-area-changed` when responsive geometry changes state.

Each event should include the resulting immutable manager snapshot and the affected window ID/state where applicable. `WindowManager` owns and emits these events. `WindowLayerView` consumes them to render; `ApplicationManager` should not infer domain facts from DOM events.

### Application Facts

`ApplicationManager` should emit only facts with consumers:

- `application-launched` after instance and window creation succeed;
- `application-focused-existing` if useful for observing single-instance launch policy;
- `application-closed` after windows close and disposal completes;
- `applications-reset` after all instances are disposed during reset.

The desktop launcher/window layer consumes application snapshots for presentation and view mounting. Registry events are unnecessary while manifests are fixed at startup.

### Command Flow

- launcher intent -> `ApplicationManager.launch`;
- pointer/focus intent -> `WindowManager.focus`;
- drag/resize intent -> `WindowManager.move`/`resize`;
- chrome minimize/maximize/restore intent -> corresponding window-manager command;
- chrome close intent -> `ApplicationManager.closeWindow`, which coordinates window close and instance disposal;
- runtime reset/failure/disposal fact -> composition-level cleanup of application/window services and their views.

The runtime must not absorb window or application snapshots. Cross-service cleanup belongs in bootstrap composition, keeping `ShadowRuntime` focused on OS lifecycle.

## G. UI Behavior

### Opening an Application

- The ready desktop exposes a minimal launcher containing the registered diagnostic app.
- Launcher controls use native buttons with accessible names and visible focus.
- Activating the launcher asks `ApplicationManager` to launch; the registry resolves the definition, the manager creates an instance, and the window manager opens/focuses its primary window.
- A single-instance policy focuses an existing window. A multiple-instance policy creates a distinct instance/window. The diagnostic app should exercise the policy selected for M2 tests without implying future process behavior.

### Focusing and Multiple Windows

- Pointer down or `focusin` within a window requests focus through `WindowManager`.
- The active window has the highest focus order, clear visual treatment, and an accessible active-state cue that does not rely on color alone.
- Opening/focusing never reorders DOM state as the source of truth; DOM order/style derives from the manager snapshot.
- Closing or minimizing the active window activates the highest eligible remaining window deterministically.

### Moving and Resizing

- Pointer drag begins only from the title bar, uses pointer capture, and sends clamped position commands.
- Pointer resize uses explicit handles with stable hit areas and sends constrained size/bounds commands.
- Browser pointer state remains ephemeral in `WindowLayerView`; committed geometry belongs to `WindowManager`.
- M2 needs a keyboard equivalent. Recommended behavior is a keyboard-accessible window action menu: choosing Move or Resize enters a mode where arrow keys adjust geometry, Enter commits, and Escape restores the starting bounds. This decision should be confirmed before implementation.

### Minimize, Maximize, Restore, and Close

- Window chrome provides semantic buttons with accessible names/tooltips and fixed dimensions.
- Minimize removes the window from the visible work area without destroying its application instance.
- Maximize stores normal bounds and fills the current work area.
- Restore returns to the correct previous normal/maximized state, including minimize-from-maximized behavior.
- Close routes through application lifecycle coordination. Closing the primary/only M2 window disposes its application instance exactly once.

### Keyboard Interaction

- Tab/Shift+Tab reaches launcher and window controls in a predictable order.
- Enter/Space activates launcher and native window-control buttons.
- A documented shell command such as Alt+Tab cycles focus through non-minimized windows; the exact shortcut must avoid browser conflicts and be confirmed before implementation.
- Moving and resizing must have the explicit keyboard mode described above or another reviewed equivalent.
- Focus returns to a sensible launcher or next-window target after close/minimize; no focus is left on removed DOM.
- Escape exits temporary move/resize interaction without mutating committed state.

### Responsive Layouts

- Desktop layouts use bounded floating windows inside a measured work area.
- Domain geometry remains viewport-independent data constrained through `setWorkArea`; the DOM does not become the authority.
- The existing 360 x 740 support requires an explicit small-screen policy before implementation. Recommended: render only the active window as full-work-area presentation on small screens while retaining all domain windows and providing a minimal accessible window switcher. Do not add M4 process/task visibility.
- Viewport changes update work-area constraints deterministically and must not leave controls unreachable or create horizontal page overflow.
- Touch/pointer behavior may reuse Pointer Events, but gesture-heavy shell features are not required.

## H. Testing Plan

### Unit Tests

`window-manager.test.ts` should cover:

- open with deterministic IDs/default geometry;
- focus order and active-window selection;
- valid and invalid move/resize bounds;
- minimum/maximum/work-area constraints;
- minimize, maximize, restore, including minimize-from-maximized;
- close active/inactive windows and select the next active window;
- work-area changes and responsive re-clamping;
- every invalid transition and unknown identifier;
- immutable snapshots, emitted reasons, reset, listener disposal, and service disposal.

`application-registry.test.ts` should cover:

- immutable manifests/definitions;
- deterministic registration/listing/lookup;
- duplicate IDs and unknown IDs;
- optional unregistration only if that API is retained.

`application-manager.test.ts` should cover:

- stable deterministic instance/window identity;
- single-instance and multiple-instance launch policy;
- narrow context creation;
- atomic rollback after factory/window failure;
- focus-existing behavior;
- close by instance/window;
- exactly-once disposal;
- reset/dispose clearing instances and windows without stale events.

### Integration Tests

Use real registry, application manager, window manager, typed events, fake IDs, fake clock, and diagnostic definition without DOM. Cover:

- register -> launch -> instance -> primary window;
- launch multiple instances -> distinct windows -> deterministic focus order;
- move/resize/mode transitions -> close -> instance disposal;
- single-instance relaunch -> existing instance/window focus;
- runtime reset/failure coordination -> all M2 state/disposables cleared -> fresh post-reset launch;
- public application context works without private imports or cross-module state access.

### Playwright Tests

- boot/skip to ready while retaining all M1 smoke coverage;
- launch one and then multiple diagnostic instances;
- focus windows using pointer and keyboard;
- drag and resize with pointer, asserting resulting visible geometry;
- exercise keyboard move/resize mode;
- minimize, restore, maximize, restore, and close;
- verify focus transfer after minimize/close;
- verify launcher and chrome with keyboard only;
- verify desktop and mobile policies without clipping/horizontal overflow;
- reset while applications are open, then verify fresh empty desktop and relaunch;
- reduced-motion behavior for window transitions;
- no console errors, page errors, failed requests, navigation reloads, or external dependencies.

Tests should prefer roles, accessible names, runtime/window state markers, and manager results over arbitrary timeouts or CSS-animation timing.

### Quality Gates

Run formatting, strict typecheck, ESLint, all Vitest unit/integration tests, production build, all Playwright tests, and manual desktop/mobile/keyboard interaction review. Broaden tests based on risk rather than adding M3/M4 behavior as test fixtures.

## I. Risks / Open Questions

Decisions needed before UI implementation:

1. **Small-screen policy:** Confirm the recommended single-active-window presentation or choose another constrained/snap policy. This is already an explicit project question and directly affects geometry/view design.
2. **Keyboard move/resize contract:** Confirm action-menu mode, shortcuts, step sizes, cancel/commit behavior, and announcements.
3. **Launch policies:** Confirm the initial policy names and whether the diagnostic app is multi-instance. Do not add policies without a milestone use case.
4. **Default geometry:** Choose deterministic cascade offsets, minimum dimensions, initial work-area padding, and behavior when the viewport is smaller than minimum constraints.
5. **Close semantics:** Confirm one primary window per M2 instance and that closing it terminates/disposes the instance.
6. **Application view contract:** Confirm the small mount/dispose interface and whether app UI receives `Document` explicitly rather than importing browser globals.
7. **Focus shortcut:** Confirm a keyboard focus-cycle shortcut that does not conflict unacceptably with browser/assistive-technology behavior.
8. **Registration mutability:** Decide whether startup-only registration is sufficient. Prefer it unless dynamic registration has a current M2 consumer.

Architectural risks:

- Re-rendering the whole desktop on every window event would destroy focus and application-local DOM state. The window layer should reconcile stable window IDs and update existing elements.
- Storing bounds or active state only in CSS/DOM would violate M2's primary boundary and make deterministic tests impossible.
- Giving applications unrestricted manager/runtime access would let one app mutate another and make M3/M4 contracts harder to secure.
- Conflating application instances with processes would prematurely implement M4 and make later process visibility semantics unclear.
- Treating minimized windows as disposed instances would break lifecycle and restoration behavior.
- Reset/failure without an explicit disposal order could leave event listeners, pointer capture, or app view resources alive.
- A viewport-observer browser adapter is needed for responsive work-area updates; it must translate measurements into commands rather than own geometry state.
- The current branch documentation is not synchronized with the canonical documentation branch. Implementation should use the canonical M2 gate and avoid opportunistic documentation rewrites on this feature branch.

## J. Recommended Implementation Order

1. Freeze the four decisions that shape contracts: small-screen policy, keyboard move/resize interaction, launch policy names, and one-primary-window close semantics.
2. Add branded IDs, deterministic ID generation, immutable window state, and exhaustive state-transition tests.
3. Implement `WindowManager` commands/events, geometry constraints, focus ordering, work-area updates, reset, and disposal; complete unit coverage before DOM work.
4. Define application contracts/context and implement `ApplicationRegistry` with duplicate/lookup tests.
5. Implement `ApplicationManager` launch policies, atomic instance/window creation, close/reset/disposal, and unit tests.
6. Add the diagnostic application and headless integration tests proving registry -> launch -> window -> close without DOM coupling.
7. Extract `DesktopView` from `ShellView`; preserve all M1 boot/failure behavior and tests.
8. Implement `WindowLayerView`, stable-ID reconciliation, application content mounting, pointer adapters, and accessible chrome.
9. Add keyboard focus cycling and reviewed keyboard move/resize behavior.
10. Implement the chosen responsive work-area/small-screen projection and reduced-motion window transitions.
11. Wire services and runtime reset/failure cleanup in `start-afterboot.ts`, with deterministic disposal order.
12. Add Playwright workflows incrementally: launch/close, focus/multiple windows, geometry/modes, keyboard, responsive, reset/disposal, and error/network checks.
13. Run all quality gates and manual browser verification, then perform a strict scope review excluding M3/M4/M5 capabilities.

Each domain slice should be committed only after its focused tests pass. Do not start with draggable DOM elements before the window transition model and invariants are executable.

## K. Final Architectural Sanity Check

### 1. What M2 Should Look Like When Complete

SHADOW OS boots into the existing desktop, exposes a minimal launcher, and can open multiple diagnostic application instances in real windows. Users can focus, move, resize, minimize, maximize, restore, and close those windows with pointer and keyboard input. Window and application lifecycle snapshots remain independent of DOM elements; reset/disposal leaves no stale windows, instances, listeners, or pointer state. Desktop/mobile layouts remain coherent, and all required quality gates pass.

### 2. What M2 Deliberately Leaves for M3

M3 receives a stable application/window foundation but no filesystem implementation. It will add the in-memory virtual filesystem, file manager, text viewer/editor, metadata/errors/events, file associations, and file-open/edit/revisit workflows. M2 must not fake these capabilities in the diagnostic application.

M4 remains responsible for process/task visibility, settings, notifications, broader sandbox polish/failure recovery, and any justified terminal. M5 remains responsible for scenarios and objectives.

### 3. Decisions Required Before Implementation

Confirm the small-screen window policy, keyboard move/resize interaction, initial launch policy vocabulary, one-primary-window close semantics, deterministic default geometry, and the app view mount/dispose contract. These decisions affect public contracts or accessibility and should not emerge accidentally from DOM code.

### 4. Sufficiency of the M1 Architecture

The M1 architecture is sufficient for M2: typed synchronous events, explicit disposables, injected clock, composition-root wiring, immutable snapshots, and DOM-independent runtime state are the right foundations. One specific adjustment is necessary: split the ready-state desktop projection out of `ShellView` and add dedicated application/window services plus a window DOM adapter. `ShadowRuntime` should not own M2 state, and no broad framework rewrite, global store, or new external dependency is justified.

---

# Milestone 2 Implementation Session

- **Date:** 2026-09-26
- **Branch:** `feature/m2-windows-applications`
- **Starting commit:** `51d43d68b6b75644fd85abdc322ad3048a9c6d43`
- **Implementation commit:** `116f01f6e495639f55372588b3981e68a99badcf`
- **Purpose:** Implement the M2 window and application framework from the approved architecture review and locked interaction decisions.
- **Completion status:** Implemented and locally verified — formal milestone review and CI verification pending

## Documentation Reviewed

- `README.md`
- `CHANGELOG.md`
- `docs/AFTERBOOT_PROJECT.md`
- `docs/SESSION_RESULTS.md`
- canonical `docs/AFTERBOOT_MILESTONES.md` from `origin/documentation`, read without switching branches because the file is not present on this feature branch

## Implementation Summary

- Added branded application, application-instance, and window identities with injectable deterministic generation.
- Added serializable immutable window snapshots and a DOM-independent `WindowManager`.
- Implemented centered first-window placement and centralized deterministic cascade offsets.
- Implemented focus/z-order, constrained move/resize, minimize, maximize, restore, close, work-area updates, reset, disposal, and typed window facts.
- Added immutable startup-only application registration with explicit duplicate and unknown-application errors.
- Added a single-instance `ApplicationManager` that owns running instances, primary/auxiliary window relationships, view resolution, close semantics, reset, and exactly-once disposal.
- Added a narrow application contract using `mount(host, document): Disposable` plus a scoped auxiliary-window request.
- Added the minimal System Diagnostics proof application. Relaunch focuses/restores its existing primary window; the app can open auxiliary lifecycle-detail windows to prove simultaneous-window behavior without multi-instance support.
- Extracted the ready desktop from `ShellView` into a disposable `DesktopView`.
- Added a stable-ID `WindowLayerView` that reconciles existing DOM nodes, mounts each application view once, projects domain state, and translates pointer/focus/chrome interaction into commands.
- Added desktop pointer dragging/resizing, accessible minimize/maximize/restore/close controls, launcher and task-strip keyboard navigation, and deterministic focus recovery after minimize/close.
- Added responsive active-window presentation for small screens while preserving independent domain geometry and all window state.
- Wired runtime reset/failure and application/window disposal through the existing composition root without adding M2 state to `ShadowRuntime`.

## Important Architectural Decisions

- `ShadowRuntime` remains the authority only for boot/reset/failure lifecycle.
- `WindowManager` is the only owner of window geometry, mode, focus order, active identity, and work-area constraints.
- `ApplicationRegistry` is immutable after startup; no installation/uninstallation API was added.
- Every M2 application is single-instance. Relaunching restores or focuses the existing primary window.
- One application instance may own auxiliary windows. This reconciles the locked single-instance policy with the milestone requirement to prove simultaneous windows.
- Closing an auxiliary window leaves the instance running; closing the primary window closes all owned windows and disposes the instance exactly once.
- Move and resize are pointer interactions only. Keyboard users can launch, focus, restore, minimize, maximize, and close through native buttons and the task strip.
- No global Alt+Tab-style shortcut or keyboard move/resize mode was added.
- Small screens render only the active window as the full available work area; inactive windows remain in domain state and can be selected through the task strip.
- Application view objects remain private lifecycle handles. DOM nodes, callbacks, and pointer state never enter application/window snapshots.

## Tests Added

- `tests/unit/window-manager.test.ts`: 10 tests for placement, focus/z-order, geometry, all modes, close, responsive work areas, events, reset, immutability, and invalid inputs.
- `tests/unit/application-registry.test.ts`: 3 tests for immutable startup lookup and duplicate/unknown handling.
- `tests/unit/application-manager.test.ts`: 6 tests for launch, single-instance enforcement, auxiliary windows, primary close/disposal, reset, and unknown ownership.
- `tests/integration/application-window-lifecycle.test.ts`: service-level registration -> launch -> multiple windows -> relaunch -> close/dispose workflow.
- `tests/e2e/windows-applications.spec.ts`: 6 Chromium workflows for launch, simultaneous windows/focus, pointer drag/resize, minimize/maximize/restore/close, keyboard controls, mobile presentation, reset, console errors, and failed requests.

Existing M1 unit, integration, and Playwright tests remain unchanged and pass as regression coverage.

## Verification

- Prettier formatting check: passed.
- Strict TypeScript typecheck: passed.
- ESLint: passed.
- Vitest: 34 tests passed across 8 files.
- Production Vite build: passed.
- Playwright Chromium: 13 tests passed.
- Desktop visual inspection with two simultaneous windows: passed.
- Mobile 360 x 740 visual inspection with active-window fill and task switching: passed.
- Keyboard launch, focus, task restore, and window controls: passed.
- Console errors, page errors, and failed requests in M2 workflows: none.
- Reset with open primary/auxiliary windows returns to a clean second boot cycle without page reload: passed.

## Deviations From the Architecture Review

- The review left launch policy extensibility open; the locked implementation decision requires all M2 applications to be single-instance, so no policy enum or multi-instance path was added.
- The review recommended deciding keyboard move/resize and global focus cycling; the locked implementation explicitly excludes both from M2.
- The review proposed a broader application context as a possibility. The implementation uses only application/instance identity and a scoped auxiliary-window request because no other M2 capability is required.
- The planned separate viewport adapter was unnecessary. `WindowLayerView` translates browser resize measurements into `WindowManager.setWorkArea` commands while the manager remains the state authority.

## Known Limitations

- M2 provides one built-in diagnostic application only.
- Application registration is fixed at startup.
- Applications are single-instance and have one lifecycle-owning primary window.
- Window dragging and resizing use pointer input on floating desktop layouts only.
- Small-screen mode intentionally suppresses floating geometry and presents only the active window.
- Firefox, WebKit, and a formal assistive-technology matrix were not run locally; Chromium is the configured automated browser baseline.
- The canonical milestone checklist exists on `origin/documentation`, not this branch, so its formal completion record was not changed here.
- Remote CI and formal project-owner milestone approval remain pending; M2 is not yet declared complete.

## Scope Review

No virtual filesystem, file manager, text editor, terminal, process/task simulation, notifications, settings, persistence, accounts, networking, scenarios, backend, real machine access, dynamic application installation, multi-instance policy, global window-cycling shortcut, or keyboard move/resize behavior was introduced.

No release, version tag, GitHub Release, PR, merge, or branch change was created.

---

# Milestone 3 Architecture Planning Session

- **Date:** 2026-09-27
- **Branch:** `feature/m3-applications-os-experience`
- **Starting `develop` commit:** `0135404d61219ac1e3071123179d45911c04e44a`
- **Authoritative roadmap ref:** `origin/documentation` at `a719f3fe598ea523cdb783059677a026173f6c84`
- **Task type:** Architecture review and implementation planning only
- **Implementation status:** Not started

## Planning Context and Scope

The post-M2 roadmap was intentionally revised before this planning session. The authoritative documentation now defines M3 as **Applications + OS Experience**, moves the shared Virtual Filesystem to M4, and leaves M5 as Scenario Foundation. Earlier entries in this file preserve the former filesystem-first M3 plan as historical context; this entry supersedes that prospective plan without rewriting it.

M3 is limited to:

- a temporary in-memory Notepad;
- a basic Calculator;
- a small digital Clock;
- the existing System Diagnostics application;
- a registry-backed, keyboard-accessible Application Drawer;
- the existing task strip as a projection of open windows only;
- a SHADOW OS desktop context menu; and
- a projection-only Refresh Desktop command that does not reload or reboot the application.

M3 explicitly excludes the Virtual Filesystem, File Manager, file saving/loading, persistent application data, Browser, Email, Image Viewer, Settings application, themes, Calendar, Tasks, Terminal, networking, accounts, backend/cloud persistence, and scenario runtime/gameplay. M4 owns the shared Virtual Filesystem and coherent filesystem-backed sandbox.

## Documentation and Implementation Reviewed

Documentation reviewed:

- `README.md`
- `CHANGELOG.md`
- `docs/AFTERBOOT_PROJECT.md`
- `docs/SESSION_RESULTS.md`
- canonical `docs/AFTERBOOT_MILESTONES.md` from `origin/documentation`
- the post-M2 roadmap revisions on `origin/documentation`

Implementation and tests reviewed:

- composition in `src/bootstrap/start-afterboot.ts`;
- runtime/reset behavior in `src/core/runtime/shadow-runtime.ts`;
- typed events, disposables, identifiers, and the clock boundary;
- application contracts, registry, and manager;
- `WindowManager` and `WindowLayerView`;
- `ShellView`, `DesktopView`, launcher, task strip, system clock, and responsive styles;
- the existing System Diagnostics application; and
- M0-M2 unit, integration, and Playwright coverage.

## Existing Architecture Assessment

The M2 architecture is sufficient for M3 without a framework rewrite or a second catalog:

- `ApplicationRegistry` already owns the immutable startup catalog and exposes ordered manifests through `list()`.
- `ApplicationManager` already owns single-instance launch, focus/restore-on-relaunch, application instances, primary and auxiliary windows, reset, and disposal.
- `WindowManager` remains the only authority for window geometry, modes, z-order, focus, and work-area constraints.
- `WindowLayerView` already mounts application views by stable window identity and translates DOM interaction into manager commands.
- `DesktopView` is the correct owner for shell composition, task-strip projection, transient launcher/context-menu presentation, and focus handoff.
- `ShadowRuntime` should remain limited to boot/reset/failure lifecycle and should not absorb M3 overlay or application state.
- The existing `Clock` and `formatSystemTime` boundaries are deterministic and reusable by the Clock application.
- Reset and failure already dispose applications and windows through the composition root; M3 additions must join those existing disposal paths.

The current `ApplicationContext` is intentionally narrow and remains sufficient. M3 does not justify exposing the runtime, registry, managers, clock, or broad system services to every application. The Clock definition can receive the existing `Clock` explicitly from the composition root through its factory.

Application definitions must remain construction-only: `create()` returns an instance and must not call `context.openWindow()` synchronously before the manager has registered that instance. M3 applications require only a primary window, so no manager contract change is needed for this ordering constraint.

## A. Application Architecture

- Register Notepad, Calculator, Clock, and the existing System Diagnostics definition together at startup in the composition root.
- Continue using registry manifests as the sole installed-application metadata source. The current ID, name, description, and window metadata are enough for M3; icon, grouping, search, sort-key, and launch-policy fields are not required.
- Preserve registration order as deterministic drawer order unless later usability evidence requires explicit sorting metadata.
- Continue routing all launches through `ApplicationManager.launch()`. Relaunching an existing M3 application restores or focuses its primary window and does not create another instance.
- Keep each application's mutable state inside its application instance/model, not in the DOM, shell, registry, or application manager.
- Keep application views on the existing `mount(host, document): Disposable` contract.
- Closing a primary window, runtime reset/failure, and application disposal release application-local resources exactly once. Reopening after close creates a fresh instance.
- Do not add multi-instance launch policies during M3; no planned M3 application requires one.

## B. Application Drawer

`ApplicationRegistry` owns discovery, and `ApplicationManager` owns launch. A new domain-level `AppLauncher` service would duplicate those authorities and is not justified.

The drawer should be a disposable shell view/controller owned by `DesktopView`:

1. Read immutable manifests from `ApplicationRegistry.list()`.
2. Render one entry per registered application, including System Diagnostics.
3. Dispatch the selected application ID to `ApplicationManager.launch()`.
4. Close after a successful launch and allow the existing window layer to focus the launched or restored window.

The bottom bar should expose one clearly labeled drawer trigger rather than one permanent button per installed application. The trigger uses `aria-expanded`, `aria-controls`, and an appropriate popup relationship. Opening by pointer or keyboard moves focus to the first available application. Arrow keys move among entries; Home and End move to the bounds; Enter or Space launches; Escape closes and restores focus to the trigger. Pointer interaction outside the drawer dismisses it and restores focus when appropriate.

The drawer remains viewport-contained and scrollable. It may appear as an anchored panel on desktop and a constrained sheet/panel on small screens, but both layouts use the same catalog and launch commands. Reduced-motion mode must not depend on an animated transition to make the drawer usable.

## C. Task Strip and Bottom Bar

M3 should refine, not replace, the current footer composition:

- the application area becomes one App Drawer trigger;
- the task strip continues to show open windows only and continues to focus or restore them;
- the status area retains the existing clock and restart control; and
- responsive layouts may rearrange these zones without changing their ownership or data sources.

The task strip must not become an installed-application catalog and must not duplicate drawer entries. Existing focus recovery after window minimize/close remains part of the contract, with the drawer trigger replacing the first permanent application button as the shell fallback target.

## D. Context Menu

The initial context menu is transient shell presentation state owned by `DesktopView`, not a new OS domain service. Its model should use typed surface and action identifiers plus immutable item data; DOM elements and executable callbacks do not belong in the menu model.

The first registered surface is the desktop workspace/background. The browser's native `contextmenu` is suppressed only when a SHADOW OS surface has explicitly claimed that interaction. Window/application content and editable controls, especially the Notepad editing surface, are not suppressed by the desktop provider. Future window, application, and file providers can supply their own typed item definitions without changing the initial action-dispatch path.

The initial desktop menu contains only:

- **Refresh Desktop**; and
- **Open App Drawer**.

No Settings placeholder is needed because M3 has no settings capability.

Menu behavior requirements:

- pointer invocation anchors at the pointer location;
- keyboard invocation through the Context Menu key or Shift+F10 anchors to the focused desktop surface;
- placement clamps to the visible workspace/viewport and handles all edges;
- focus moves to the first enabled item;
- Arrow Up/Down and Home/End navigate enabled items;
- Enter or Space invokes the focused item;
- Escape, outside pointer interaction, a second invocation, or successful action dismisses the menu;
- dismissal restores focus to the invoker when it remains available; and
- disposal removes document-level listeners and any active menu DOM.

The initial implementation may use a focused context-menu view/controller plus typed desktop definitions. A global provider registry or context-menu service should be deferred until a second context-specific consumer proves that abstraction necessary.

## E. Refresh Desktop

Refresh Desktop is a shell command, not a runtime reset. It must:

- close transient drawer/context-menu overlays;
- re-read the immutable registry and current application/window snapshots;
- reconcile launcher, task-strip, window-layer, clock, and work-area presentation from those authoritative sources; and
- preserve running application instances, application-local state, open windows, window modes, geometry, z-order, and the current runtime boot cycle.

It must not call `location.reload()`, navigate, invoke `ShadowRuntime.reset()`, recreate the composition root, dispose applications, close windows, or mutate unrelated OS state. The smallest implementation is an explicit `DesktopView` refresh command that invokes existing projection/reconciliation methods. No new persistent desktop model or event is required because refresh does not change domain state.

## F. Notepad

- Create one instance-local text model whose value is independent from its rendered control.
- Use a native multiline text control for editing, selection, copy, paste, undo, and standard keyboard behavior rather than reimplementing browser text editing.
- Synchronize input into the instance model so a shell projection refresh or view remount does not lose text while the application instance remains alive.
- Start each new instance blank.
- Preserve text while the same single instance is minimized, restored, focused again, or retained through Refresh Desktop.
- Discard text when the primary window closes, the application is disposed, or SHADOW OS resets/fails.
- Do not expose save/open commands, filenames, fake paths, storage adapters, local storage, IndexedDB, import/export, or any placeholder filesystem API.

## G. Calculator

Use a small pure deterministic state machine rather than evaluating strings with `eval()` or introducing a parser/library.

The locked M3 operation set is addition, subtraction, multiplication, and division with integer and decimal input. The model tracks the current entry, accumulator, pending operator, entry-replacement state, and an error state. Operations evaluate in immediate pocket-calculator order; expression precedence, history, memory registers, percentages, scientific operations, and programmable expressions are out of scope.

Required controls are digits, decimal point, the four operators, equals, clear, and backspace. Keyboard input maps to the same commands; Enter invokes equals, Escape clears, and Backspace removes the current entry. Division by zero and non-finite results enter a visible `Error` state. Clear or the next numeric entry recovers deterministically. Display formatting and maximum practical input length should be finalized during implementation without changing this operation model.

## H. Clock

- Inject the existing `Clock` into the Clock application definition factory from the composition root; do not call `Date.now()` directly and do not add a second clock source.
- Reuse `formatSystemTime` for browser-local date/time presentation unless a separate pure formatter is proven necessary.
- Render a small digital time/date view and schedule one update at a time through `Clock.schedule()`.
- Cancel the pending scheduled update when the view unmounts or the application instance is disposed.
- Use the existing fake clock strategy for deterministic tests.
- Do not broaden `ApplicationContext` solely for Clock. Reconsider a read-only time capability only when another application needs application-context clock access.

The current clock abstraction requires no architectural change for M3.

## I. Accessibility, Focus, and Responsive Behavior

- Preserve semantic headings, labels, native buttons, visible focus, and logical source/tab order.
- The App Drawer and context menu must be completely operable without a pointer and must restore focus on dismissal.
- The context menu uses menu/menuitem semantics; the drawer uses a labeled panel/dialog or navigation region with ordinary application buttons rather than falsely presenting application launch as a command menu.
- The desktop surface must provide a discoverable focus target for keyboard context-menu invocation.
- Notepad retains native text-selection and clipboard shortcuts and must have an accessible label.
- Calculator controls need unambiguous accessible names, a readable result/status, and no color-only error state.
- Clock uses semantic time output and must not announce every one-second update through an intrusive live region.
- Existing window focus behavior and task-strip restore behavior remain intact when drawer entries replace permanent launcher buttons.
- Desktop and current small-screen active-window layouts must contain drawer, menus, and application content without horizontal overflow or inaccessible controls.
- New transitions must honor the existing reduced-motion setting; no essential state change may depend on animation.

## J. Testing Strategy

### Domain and Unit Tests

- Notepad model: initial blank value, text replacement/edit synchronization, retention while the instance lives, and fresh state after a new instance.
- Calculator model: each operation, decimals, chained immediate operations, operator replacement, equals, clear, backspace, division by zero, non-finite/error recovery, and immutable/read-only snapshots if snapshots are exposed.
- Clock: initial formatting, scheduled updates, one active scheduled callback, and cancellation on disposal using a fake clock.
- Any extracted drawer/context-menu reducer: deterministic open, navigation, selection, dismissal, and edge-position calculations independent from DOM nodes.

### Service Integration Tests

- Registry lists all four definitions exactly once in deterministic order.
- Application Manager launches each M3 application through the existing contract.
- Relaunch restores/focuses the existing primary window and does not create a second instance.
- Closing and reset dispose application models/timers and leave no windows or running instances.
- Refresh Desktop preserves application/window snapshots and application-local Notepad state.
- Context-menu actions dispatch only approved shell commands and do not invoke runtime reset or navigation.

### View and Browser Tests

The repository has no DOM component-test environment and M3 does not justify adding one solely for these views. Keep models and positioning logic unit-testable, service workflows in Vitest, and semantic DOM/focus interaction in Playwright.

Playwright should verify:

- pointer and keyboard drawer open, navigation, launch, dismissal, and focus restoration;
- deterministic catalog contents including System Diagnostics;
- task strip contains only running windows;
- Notepad typing, selection/clipboard-compatible behavior, relaunch retention, close/reopen discard, and reset cleanup;
- Calculator pointer and keyboard arithmetic, clear/backspace, decimal, and division-by-zero recovery;
- Clock date/time rendering and cleanup behavior without direct wall-clock flakiness;
- desktop pointer and keyboard context-menu invocation, edge clamping, menu navigation, outside/Escape dismissal, and focus restoration;
- native context-menu suppression on owned desktop surfaces but not on editable Notepad content;
- Refresh Desktop causes no navigation/reload, boot-cycle change, app disposal, window loss, or Notepad text loss;
- existing System Diagnostics, window interactions, restart, focus recovery, and M0-M2 workflows remain operational;
- desktop and current 360 x 740 small-screen behavior have no horizontal overflow or blocked critical controls; and
- no unexpected console errors, page errors, failed requests, or external runtime dependencies occur.

All checks should prefer roles, accessible names, stable domain markers, injected time, and observable manager results over arbitrary delays or implementation-specific selectors.

## Locked Architectural Decisions

1. **Use the M2 application framework unchanged for M3 application ownership.**

- **Reason:** Registry discovery, single-instance launch, primary-window ownership, reset, and disposal already satisfy M3.
- **Alternative considered:** A new application runtime or launcher service.
- **Consequence:** All M3 apps register at startup and launch only through `ApplicationManager`.

2. **Keep the registry as the only installed-application catalog.**

- **Reason:** A second drawer catalog would introduce conflicting truth.
- **Alternative considered:** Drawer-owned application configuration.
- **Consequence:** Drawer order and metadata come directly from immutable manifests.

3. **Keep drawer and context-menu state in disposable shell views.**

- **Reason:** Open/position/focus state is transient presentation state, not OS domain state.
- **Alternative considered:** New global services or runtime state.
- **Consequence:** `DesktopView` owns and disposes both overlays; domain managers remain unchanged.

4. **Keep the task strip limited to open windows.**

- **Reason:** Installed applications and running windows are different concepts with existing owners.
- **Alternative considered:** Keep permanent application launch buttons mixed with running-window controls.
- **Consequence:** One drawer trigger replaces permanent per-application launcher buttons.

5. **Define Refresh Desktop as projection reconciliation only.**

- **Reason:** A refresh should correct/rebuild presentation from authoritative state without becoming restart.
- **Alternatives considered:** Browser reload, runtime reset, or composition-root reconstruction.
- **Consequence:** Apps, windows, local app state, geometry, and boot cycle survive refresh.

6. **Keep Notepad text instance-local and ephemeral.**

- **Reason:** M3 needs useful editing but M4 owns shared storage.
- **Alternative considered:** Local storage or a temporary filesystem.
- **Consequence:** Text survives view reconciliation while the instance lives and is discarded on close/reset.

7. **Use an explicit calculator state machine with four arithmetic operations.**

- **Reason:** It is deterministic, testable, and avoids unsafe evaluation or unnecessary parsing.
- **Alternatives considered:** Evaluate expression strings or add a general expression parser.
- **Consequence:** History, precedence parsing, memory, percentage, and scientific behavior remain excluded.

8. **Inject the existing Clock into the Clock definition factory.**

- **Reason:** This reuses deterministic time without broadening every application's context.
- **Alternative considered:** Direct browser time or adding Clock to `ApplicationContext`.
- **Consequence:** The composition root wires Clock explicitly and disposal cancels scheduled ticks.

9. **Claim native context-menu behavior only for registered SHADOW OS surfaces.**

- **Reason:** Application/editable content may need native browser behavior until it has its own provider.
- **Alternatives considered:** Suppress the native menu across the entire shell or introduce a global provider service before a second provider exists.
- **Consequence:** M3 begins with the desktop background and leaves future typed providers incremental.

10. **Add no new external dependency or DOM test environment for M3.**

- **Reason:** Existing TypeScript, browser APIs, Vitest service tests, and Playwright cover the planned behavior.
- **Alternative considered:** Add a browser-like DOM unit-test dependency solely for M3 views.
- **Consequence:** Pure logic stays DOM-independent and browser semantics are verified end to end.

## Open Questions

- What exact visual composition gives the App Drawer a distinct SHADOW OS identity while preserving the behavioral contract above?
- What practical Calculator input-length and floating-point display policy avoids misleading output without expanding into arbitrary precision?
- Should a second context-specific consumer in M3 appear, or should the generalized provider registry wait until M4 file contexts exist?
- Which formal browser and assistive-technology matrix will gate M3 beyond the current Chromium baseline and manual keyboard review?

These questions may be resolved during implementation without changing subsystem ownership or the M3/M4 boundary.

## Deferred Decisions

- Virtual Filesystem contracts, paths, metadata, events, seed data, and storage adapters.
- File Manager and Notepad save/open workflows.
- Browser persistence, import/export, and shared application data.
- Image Viewer and file associations.
- Settings application, themes, Calendar, Tasks, Terminal, Browser, Email, networking, accounts, and backend services.
- Process/task-service semantics.
- Scenario packages, setup/reset, objectives, progression, and gameplay.
- Multi-instance launch policies and dynamic application installation.
- Global context-provider registration until more than one concrete provider exists.

## Future Ideas

- Drawer search, grouping, favorites, and optional manifest icon metadata after the base catalog proves a need.
- A command palette sharing typed action IDs with context menus.
- Application/window grouping in the task strip.
- Capability-filtered context providers for windows, applications, and M4 file surfaces.

None of these ideas is an M3 requirement.

## Proposed M3 Definition of Done

### Applications

- Notepad, Calculator, Clock, and System Diagnostics are registered once in the startup registry and launch through `ApplicationManager`.
- Repeated launch restores/focuses the existing single instance.
- Notepad provides labeled native multiline editing with temporary instance-local text, retains it while that instance lives, and discards it on close/reset without any save, load, path, storage, or persistence API.
- Calculator provides deterministic pointer and keyboard use for addition, subtraction, multiplication, division, decimals, equals, clear, and backspace, including recoverable division-by-zero/non-finite errors.
- Clock presents local digital date/time from the injected existing `Clock`, updates predictably, and cancels scheduled work on close/reset/disposal.
- System Diagnostics remains launchable and functionally unchanged except for normal drawer integration.

### Shell and Interaction

- One keyboard-accessible App Drawer trigger replaces permanent per-application bottom-bar entries.
- The drawer lists registry manifests in deterministic order and launches only through `ApplicationManager`.
- The task strip lists only open windows and preserves focus/restore behavior.
- Desktop pointer and keyboard invocation opens a viewport-clamped SHADOW OS context menu with Refresh Desktop and Open App Drawer.
- Native context-menu suppression is limited to the registered desktop surface; editable Notepad behavior remains native.
- Escape, outside interaction, launch/action completion, and disposal dismiss overlays with deterministic focus restoration.
- Refresh Desktop causes no browser navigation, runtime reset, boot-cycle change, application disposal, window loss, geometry reset, or Notepad text loss.

### Quality and Lifecycle

- Drawer, context menu, all applications, and critical shell paths are accessible by keyboard with semantic labels, visible focus, and reduced-motion-safe behavior.
- Desktop and the current supported small-screen presentation remain coherent without horizontal overflow or blocked critical controls.
- Closing applications, restart/reset, runtime failure, and top-level disposal leave no stale instances, windows, overlays, event listeners, or scheduled clock work.
- Focus recovery remains predictable after overlay dismissal, application launch, window minimize/close, and reset.
- Focused unit and integration tests cover application models, registry/manager workflows, refresh invariants, commands, and disposal.
- Playwright covers the critical pointer, keyboard, responsive, lifecycle, focus, context-menu, drawer, and application workflows with no console/page/network failures.
- Prettier, strict TypeScript, ESLint, all Vitest tests, production build, and all Playwright tests pass.
- Manual desktop, current small-screen, keyboard-only, focus, and reduced-motion review passes.
- A final scope audit confirms no Virtual Filesystem, file workflow, persistent data, deferred application/service, backend, or scenario behavior entered M3.

## Recommended Implementation Order

1. Add pure Notepad and Calculator models with focused unit tests.
2. Add the three application definitions/views and inject the existing Clock through composition.
3. Replace permanent application buttons with the registry-backed App Drawer while preserving task-strip behavior.
4. Add the typed desktop context-menu model/view and shell command dispatch.
5. Add projection-only Refresh Desktop and lock its state-preservation tests.
6. Complete responsive/accessibility styling and Playwright workflows incrementally.
7. Run all quality gates, manual verification, and strict M3/M4 scope review before declaring implementation ready.

## Planning Outcome

The existing M2 ownership model is sufficient for M3. No new global state store, application catalog, launcher service, context-menu domain service, clock source, persistence mechanism, filesystem substitute, or external dependency is justified. M3 implementation should extend the composition root with three definitions, add instance-local application models/views, and add disposable shell projections for the drawer and desktop context menu.

No M3 source code, tests, styles, package files, workflows, configuration, application implementations, release, tag, PR, merge, or deployment was created during this planning session.

---

# M3 Phase 1 — Shell Foundation Implementation + Visual Refinement

- **Date:** 2026-09-28
- **Branch:** `feature/m3-applications-os-experience`
- **Implementation commit:** `ad088e41dd6c99faf5ae764036b5167271e0e219`
- **Visual refinement commit:** `41113dd9a618c1eeddb025621c7ffb894b411ce9`
- **Checkpoint status:** M3 Phase 1 implemented and manually verified; Milestone 3 remains in progress

## Scope Implemented

- Added a registry-backed floating Application Drawer/Launcher.
- Kept the task strip limited to running windows.
- Added a scoped SHADOW OS desktop context menu.
- Added projection-only Refresh Desktop behavior.
- Preserved accessible keyboard interaction, focus recovery, and overlay dismissal.
- Added responsive launcher and context-menu behavior.
- Refined the launcher into a compact floating SHADOW OS surface.
- Refined the context menu into a minimal two-action command surface.

## Architecture

- `ApplicationRegistry` remains the sole installed-application catalog.
- `ApplicationManager` remains responsible for application launch and lifecycle.
- `WindowManager` remains responsible for windows, focus, geometry, and z-order.
- The drawer and context menu remain disposable shell views/overlays owned by `DesktopView`.
- The task strip represents running windows rather than installed applications.
- Context-menu interception remains scoped to registered desktop surfaces; application content retains native browser context-menu behavior.
- Refresh Desktop performs projection/reconciliation only. It does not reload the page, reset the runtime, or mutate application/window manager state.
- No new global service, dependency, persistence mechanism, filesystem behavior, or application architecture was introduced.

## Visual Refinement

Manual review of the initial Phase 1 presentation led to a focused visual pass:

- The App Drawer became a compact floating launcher above the task strip.
- Its single-application state was deliberately composed as a bounded application tile rather than an empty large panel.
- The context menu became a compact two-action SHADOW OS command surface containing Refresh Desktop and Applications.
- The refinement was CSS-led, with typed presentation symbols rendered separately from accessible action names.
- Existing behavior, ownership boundaries, and application/window architecture were preserved.

## Verification

- Prettier: PASS
- Strict TypeScript: PASS
- ESLint: PASS
- Vitest: 38 tests PASS across 9 files
- Production build: PASS
- Playwright Chromium: 16 tests PASS

Manual viewport inspection passed at 1440px, 1024px, 768px, and 360 × 740. The launcher and context menu remained contained without clipping or horizontal page overflow. Launcher opening and launching, context-menu edge clamping, keyboard/focus behavior, and the existing window interactions remained functional. Refresh Desktop did not reload the browser or disturb open application/window state. Right-click inside application content retained the native browser context menu, and restart returned SHADOW OS to a clean desktop.

Reduced-motion behavior passed the existing automated Playwright coverage. Manual reduced-motion verification was not performed for this checkpoint.

## Remaining M3 Work

Milestone 3 is not complete. Remaining work includes:

- Notepad.
- Calculator.
- Clock.
- Broader M3 integration.
- Final accessibility and manual acceptance.
- Final M3 quality-gate audit.
- M3 documentation and milestone closure.

## Commit References

- `ad088e41dd6c99faf5ae764036b5167271e0e219` — `feat: add M3 application launcher and context menu`
- `41113dd9a618c1eeddb025621c7ffb894b411ce9` — `style: refine M3 launcher and context menu`

## Scope Review

This checkpoint introduced no Notepad, Calculator, Clock, Settings, virtual filesystem, persistence, scenarios, networking, backend, account, release, or version changes. It records the timeline from M3 planning through Phase 1 implementation and visual refinement while leaving the remaining M3 application work explicit.

---

# M3 Phase 2A — Notepad Implementation

- **Date:** 2026-09-28
- **Branch:** `feature/m3-applications-os-experience`
- **Checkpoint status:** Notepad implemented and manually verified; Milestone 3 remains in progress

## Scope Implemented

- Added Notepad as a startup-registered application discovered through the existing App Drawer.
- Added a pure instance-local text model with blank initial state and explicit disposal cleanup.
- Added a native multiline textarea with browser-provided editing, selection, cursor movement, clipboard, and undo/redo behavior.
- Added a restrained SHADOW OS editor surface with visible focus and responsive sizing.
- Preserved text while the single running instance is focused, moved, resized, minimized, restored, maximized, or reconciled through Refresh Desktop.
- Discarded text when Notepad closes or SHADOW OS restarts; reopening creates a fresh blank instance.

## Architecture

- `ApplicationRegistry` remains the sole application catalog, and `ApplicationManager` remains the launch/lifecycle authority.
- Notepad uses the existing `ApplicationView.mount(host, document)` contract and the existing single-instance application policy.
- `WindowManager` remains the sole owner of Notepad window geometry, mode, focus, and z-order.
- Mutable text is owned only by the running Notepad instance and is synchronized from the native editor into its model.
- No framework contract, application context, global service, dependency, filesystem abstraction, or persistence mechanism was added.

## Tests Added

- Unit tests cover blank initial state, multiline edits, replacement, and disposal cleanup.
- Service integration covers registration, manager-backed launch, single-instance relaunch, close/reopen identity, and reset cleanup.
- Playwright covers drawer discovery, launch, initial focus, multiline editing and selection, Escape behavior, task-strip projection, single-instance relaunch, move/resize, minimize/restore, maximize/restore, Refresh Desktop retention, native editor context menus, close/fresh reopen, restart cleanup, and mobile containment.

## Verification

- Prettier: PASS
- Strict TypeScript: PASS
- ESLint: PASS
- Vitest: 41 tests PASS across 10 files
- Production build: PASS
- Playwright Chromium: 18 tests PASS

Manual verification passed at 1280px desktop and 360 × 740 mobile. The App Drawer listed both System Diagnostics and Notepad. Typing, multiline text, selection, native editing, keyboard focus, move/resize, minimize/restore, maximize/restore, Refresh Desktop, close/reopen, restart, task-strip behavior, and responsive active-window presentation worked without clipping or horizontal overflow. Right-click inside the editor retained the native browser context menu. Existing M3 Phase 1 and System Diagnostics workflows remained functional.

Reduced-motion behavior remained covered by the existing automated Playwright workflow; manual reduced-motion verification was not performed for this checkpoint.

## M3/M4 Leakage Audit

Notepad introduces no Save, Save As, Open, file picker, file path, file/folder model, virtual filesystem, local or browser storage, cookies, URL state, backend call, shared file state, or other persistence behavior. Text exists only for the running application instance.

## Remaining M3 Work

Milestone 3 is not complete. Calculator and Clock remain unimplemented. Broader M3 integration, final accessibility/manual acceptance, the final M3 quality-gate audit, and M3 documentation/milestone closure also remain outstanding.

---

# M3 Phase 2B — Calculator Implementation

- **Date:** 2026-09-28
- **Branch:** `feature/m3-applications-os-experience`
- **Checkpoint status:** Calculator implemented and manually verified; Milestone 3 remains in progress

## Scope Implemented

- Added Calculator as a startup-registered application discovered through the existing App Drawer.
- Added a compact four-operation SHADOW OS interface with semantic digit, decimal, operator, clear, backspace, and equals buttons.
- Added direct keyboard input for digits, decimal, `+`, `-`, `*`, `/`, `Enter`, `=`, `Escape`, `C`, `Backspace`, and `Delete` while preserving native Tab navigation.
- Added accessible button names, a live labeled display, visible keyboard focus, and a concise visible `ERROR` state.
- Preserved state while the single running instance is focused, moved, resized, minimized, restored, maximized, or reconciled through Refresh Desktop.
- Discarded calculations when Calculator closes or SHADOW OS restarts; reopening creates a fresh instance displaying zero.

## Architecture

- `ApplicationRegistry` remains the sole application catalog, and `ApplicationManager` remains the launch/lifecycle authority.
- Calculator uses the existing `ApplicationView.mount(host, document)` contract and single-instance application policy.
- `WindowManager` remains the sole owner of Calculator window geometry, mode, focus, and z-order.
- Arithmetic state is owned by a pure DOM-independent `CalculatorModel` created for each running application instance.
- The existing Clock abstraction, framework contracts, application context, global services, shell projections, and dependency graph remain unchanged.

## State-Machine Decisions

- Operations execute immediately from left to right, matching a conventional pocket calculator rather than expression precedence. For example, `12 + 5 × 2` produces `34`.
- Choosing another operator before entering the right operand replaces the pending operator.
- Repeated equals reapplies the last completed operator and right operand.
- Division by zero and non-finite arithmetic enter `ERROR`; Clear or a new numeric entry recovers deterministically.
- Direct entry is limited to 12 characters. Results are normalized to 12 significant digits and use compact scientific notation when needed to stay within a 16-character display budget.
- No evaluated expression string, parser, calculation history, memory, percentage, or scientific operation was introduced.

## Tests Added

- Sixteen pure-model tests cover initial state, digit and multi-digit entry, decimals, all four operations, immediate chained evaluation, equals, clear, backspace, negative results, division by zero, operator replacement, repeated equals, malformed decimal prevention, bounded large-number formatting, recovery, and disposal.
- Service integration covers Calculator registration, manager-backed launch, window title, single-instance relaunch, close/fresh reopen identity, and reset cleanup.
- Playwright covers drawer discovery, launch, initial focus, task-strip projection, pointer addition/subtraction/multiplication/division, decimal arithmetic, clear, backspace, visible error and recovery, keyboard input, Escape handling, single-instance restore, close/fresh reopen, restart cleanup, and mobile containment.

## Verification

- Prettier: PASS
- Strict TypeScript: PASS
- ESLint: PASS
- Vitest: 58 tests PASS across 11 files
- Production build: PASS
- Playwright Chromium: 20 tests PASS

Manual verification passed at 1280 × 800 desktop and 360 × 740 mobile. App Drawer launch, pointer and keyboard arithmetic, decimals, division by zero, clear, backspace, initial focus, task-strip behavior, move/resize, minimize/restore, maximize/restore, existing-instance focus, Refresh Desktop retention, close/fresh reopen, restart cleanup, and responsive containment worked without clipping or horizontal overflow. Existing Notes editing, System Diagnostics, the desktop context menu, and Refresh Desktop remained functional with no console errors, page errors, or failed requests.

Reduced-motion behavior remains covered by the existing automated Playwright workflow; manual reduced-motion verification was not performed for this checkpoint.

## M3/M4 Leakage Audit

Calculator introduces no filesystem or file model, persistence, `localStorage`, IndexedDB, cookies, backend or network call, shared file state, new global service, external dependency, advanced expression parser, history, memory, Settings, Browser, Clock implementation, or M4 process behavior. Calculator state exists only for the running application instance.

## Remaining M3 Work

Milestone 3 is not complete. Clock remains unimplemented. Broader M3 integration, final accessibility/manual acceptance, the final M3 quality-gate audit, and M3 documentation/milestone closure also remain outstanding.
