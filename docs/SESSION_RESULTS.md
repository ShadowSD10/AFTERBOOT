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
