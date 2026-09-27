# AFTERBOOT Milestones

> **Document type:** Living implementation gate  
> **Last reviewed:** 2026-09-27
> **Current milestone:** Milestone 3 — Applications + OS Experience (not started)
> **Production branch:** `main`  
> **Development branch:** `develop`  
> **Release status:** Pre-v1.0; `v0.1.0` has not been created

This document turns the roadmap in `docs/AFTERBOOT_PROJECT.md` into verifiable implementation gates. The project specification remains the architectural source of truth; this checklist records delivery status and evidence.

## Gate Policy

> We do not begin the next milestone until the current milestone's Definition of Done is completely satisfied.

A milestone may be marked `✅ Complete` only when:

- every required checklist item is checked;
- all required automated tests pass;
- relevant browser and end-to-end verification passes;
- the production build passes;
- the feature works as intended;
- no known blocking issue remains; and
- the milestone has been reviewed before proceeding.

Code existing is not sufficient evidence of completion.

### Status legend

- ⬜ Not started
- 🟡 In progress
- 🔵 Ready for verification
- ✅ Complete

### Delivery workflow

```text
feature branch → pull request → develop → testing → pull request → main → production
```

`main` is the stable production branch and the only branch deployed to the live GitHub Pages site. `develop` is validated locally and by the `AFTERBOOT Build` workflow. Releases and version tags are separate decisions and are never created automatically when a milestone is completed.

### Updating this document

When work progresses:

1. Change the milestone status only when the corresponding status definition is true.
2. Check an item only after evidence exists in code, tests, or verification results.
3. Record completion date, verification performed, relevant test results, and any associated release/version.
4. Leave the release/version as `None` when milestone completion does not correspond to a release.
5. Preserve open questions as questions until an explicit decision is made.

---

## Milestone 0 — Foundation

**Status:** ✅ Complete  
**Purpose:** Establish a clean, testable, deployable static foundation for AFTERBOOT without implementing the SHADOW OS simulation.  
**Dependencies/prerequisites:** None.

### Scope and implementation requirements

- [x] Set up Vite for development and static production builds.
- [x] Configure strict TypeScript for browser code, configuration, and tests.
- [x] Use vanilla TypeScript, standard DOM APIs, HTML, and CSS without a frontend framework.
- [x] Configure repository-subpath-safe output using relative asset paths.
- [x] Add a minimal composition root and application-wide startup failure fallback.
- [x] Render an intentional, responsive AFTERBOOT / SHADOW OS preparation surface.
- [x] Define initial visual tokens and browser support expectations.
- [x] Add ESLint and Prettier quality tooling.
- [x] Add Vitest unit-test infrastructure.
- [x] Add Playwright browser-test infrastructure.
- [x] Add the `AFTERBOOT Build` workflow for formatting, typecheck, lint, unit tests, build, and browser smoke testing.
- [x] Add the `AFTERBOOT Release` workflow for static GitHub Pages deployment from `main`.
- [x] Exclude dependencies, builds, coverage, browser-test output, and MCP artifacts from Git.
- [x] Document local development, architecture, deployment, and versioning conventions.

### Required tests and verification

- [x] Strict TypeScript typecheck passes.
- [x] ESLint passes.
- [x] Prettier verification passes.
- [x] Vitest verifies the immutable initial host model.
- [x] The production build succeeds.
- [x] Playwright verifies page loading, AFTERBOOT branding, SHADOW OS branding, preparation status, and absence of page-load errors.
- [x] Desktop and mobile layouts have been inspected for clipping and horizontal overflow.
- [x] `AFTERBOOT Build` succeeds on `main` and `develop`.
- [x] `AFTERBOOT Release` succeeds on `main`.
- [x] The production site is available at `https://shadowsd10.github.io/AFTERBOOT/`.

### Definition of Done

- [x] A clean checkout can install dependencies, pass all quality gates, and produce the static site.
- [x] The host is intentional, responsive, accessible at a basic semantic level, and free of obvious load failures.
- [x] Generated assets use paths compatible with a GitHub Pages repository subpath.
- [x] CI validates the committed foundation.
- [x] The production workflow deploys `main` successfully.
- [x] No Milestone 1 or later subsystem is represented as implemented.
- [x] No known blocking Milestone 0 issue remains.
- [x] Milestone 0 evidence has been reviewed.

### Completion record

- **Completion date:** 2026-09-26
- **Commit:** `2a70c0c7e36041a388453c4046be2ba8e9663be5`
- **Verification performed:** Local typecheck, lint, formatting check, unit test, production build, Playwright smoke test, responsive browser inspection, successful Build workflows, and successful production Pages deployment.
- **Test results:** 1 Vitest test passed; 1 Playwright smoke test passed; typecheck, lint, formatting, and production build passed.
- **Release/version:** None. `v0.1.0` has not been created.

---

## Milestone 1 — Runtime and Boot Shell

**Status:** ✅ Complete
**Purpose:** Introduce the first SHADOW OS runtime lifecycle, an accessible boot experience, and a basic responsive desktop shell without implementing windows, applications, filesystems, processes, or scenarios.  
**Dependencies/prerequisites:** Milestone 0 must remain complete and all foundation quality gates must pass.

### Scope and implementation requirements

- [x] Define typed SHADOW OS runtime lifecycle states covering startup, readiness, reset, and failure behavior.
- [x] Keep runtime lifecycle state independent from rendered DOM state.
- [x] Construct the runtime and its dependencies through the composition root.
- [x] Implement a deliberate boot sequence that leads to the desktop shell.
- [x] Provide an accessible way to skip the boot sequence.
- [x] Respect the user's reduced-motion preference without blocking progress to the desktop.
- [x] Render a basic SHADOW OS desktop shell after boot.
- [x] Make the boot and desktop surfaces responsive at supported viewport sizes.
- [x] Provide a system clock through an injectable clock contract.
- [x] Make clock-dependent behavior deterministic in tests.
- [x] Add only the typed runtime events required for boot, readiness, reset, or failure coordination.
- [x] Ensure every event subscription introduced by this milestone has an explicit disposal path.
- [x] Allow SHADOW OS to reset and boot again without reloading the browser page.
- [x] Preserve the application-wide failure fallback.
- [x] Keep windows, applications, virtual filesystems, processes, notifications, and scenarios out of this milestone.

### Required tests and verification

- [x] Unit tests cover valid runtime lifecycle transitions and invalid transition handling.
- [x] Unit tests cover reset behavior.
- [x] Unit tests use an injected deterministic clock for time-dependent behavior.
- [x] Typed event tests cover delivery and listener disposal if an event abstraction is introduced.
- [x] Integration tests cover boot → ready and reset → boot → ready workflows.
- [x] Playwright verifies that SHADOW OS reaches the desktop.
- [x] Playwright verifies that boot can be skipped using an accessible control.
- [x] Playwright verifies reduced-motion behavior.
- [x] Playwright verifies reset without a page reload.
- [x] Browser verification covers keyboard operation, supported desktop/mobile sizes, and unexpected console errors.
- [x] Typecheck, lint, formatting, unit/integration tests, production build, and browser tests pass locally and in `AFTERBOOT Build`.

### Definition of Done

- [x] SHADOW OS reliably transitions from initialization through boot to a ready desktop.
- [x] The boot experience is accessible, skippable, and reduced-motion-aware.
- [x] The basic desktop shell remains coherent at supported viewport sizes.
- [x] Clock behavior is injectable and deterministic under test.
- [x] Reset returns the runtime to a valid boot flow without reloading the page.
- [x] Runtime state and required events have focused, typed contracts with no DOM coupling.
- [x] All Milestone 1 checks and required automated/browser verification pass.
- [x] The production build passes and no known blocking issue remains.
- [x] Scope review confirms that no Milestone 2 or later functionality was introduced.
- [x] Milestone 1 has been reviewed and approved before Milestone 2 begins.

### Completion record

- **Completion date:** 2026-09-26
- **Implementation commit:** `76e7935`
- **Verification performed:** Local formatting, typecheck, ESLint, production build, Vitest, and Playwright passed. [`AFTERBOOT Build` run 36186067968](https://github.com/ShadowSD10/AFTERBOOT/actions/runs/36186067968) completed successfully for the implementation commit. Project-owner browser verification passed for the normal boot, sequential stages, skip, reset, local clock/date accuracy, responsive desktop/mobile behavior, keyboard operation, and visual layout. Manual reduced-motion verification was not performed; automated reduced-motion Playwright coverage passed.
- **Test results:** 14 Vitest tests and 7 Playwright tests passed. Browser tests reported no console errors or failed requests.
- **Final review:** Completed and approved on 2026-09-26. Automated reduced-motion verification was accepted as the milestone evidence; manual reduced-motion verification was not performed.
- **Release/version:** None assigned

---

## Milestone 2 — Windows and Applications

**Status:** ✅ Complete
**Purpose:** Establish DOM-independent window behavior and the application framework needed to run application windows coherently.
**Dependencies/prerequisites:** Milestone 1 must be `✅ Complete`; runtime lifecycle and desktop shell contracts must be stable enough to host windows.

### Scope and implementation requirements

- [x] Define serializable window state with stable identity, owner, title, bounds, mode, focus order, and constraints.
- [x] Implement open, focus, move, resize, minimize, maximize, restore, and close state transitions.
- [x] Keep window state and geometry rules independent from DOM elements.
- [x] Add pointer and keyboard adapters for window interaction.
- [x] Define immutable application manifests and an application registry.
- [x] Define application instance identity and lifecycle/disposal behavior.
- [x] Provide applications only the approved runtime/application context.
- [x] Support multiple application windows according to the initial single-instance launch policy.
- [x] Build one diagnostic/sample application that exercises application and window lifecycle behavior.
- [x] Preserve responsive and accessible shell behavior.

### Required tests and verification

- [x] Unit tests cover every window state transition and invalid transition.
- [x] Unit tests cover geometry constraints and focus ordering.
- [x] Unit tests cover application registration, duplicate handling, launch policy, lifecycle, and disposal.
- [x] Integration tests cover launch → application instance → window → close workflows without private cross-module coupling.
- [x] Playwright verifies multiple windows, focus, movement, resize, minimize, maximize, restore, and close.
- [x] Playwright verifies critical keyboard-only paths and supported responsive layouts.
- [x] Typecheck, lint, formatting, tests, production build, and browser verification pass.

### Definition of Done

- [x] Multiple application windows can be operated predictably through pointer input and keyboard-accessible controls.
- [x] Window and application lifecycle state remains independent from rendered DOM state.
- [x] The sample application proves the public application context without introducing application-specific core behavior.
- [x] All Milestone 2 checks and required automated/browser verification pass.
- [x] The production build passes and no known blocking issue remains.
- [x] Scope review confirms that filesystem and scenario behavior were not introduced prematurely.
- [x] Milestone 2 has been reviewed and approved before Milestone 3 begins.

### Completion record

- **Completion date:** 2026-09-26
- **Implementation commit:** `116f01f6e495639f55372588b3981e68a99badcf`
- **Verified feature head:** `b042dc55f0f1417c049019b3bac2c97a3767b1d8` on `feature/m2-windows-applications`
- **Verification performed:** The complete feature branch was reviewed against `origin/develop`. Local formatting, strict TypeScript, ESLint, Vitest, production build, and Playwright passed. Desktop behavior with simultaneous windows was manually accepted. The 360 × 740 mobile presentation was verified as functional, while mobile remains a supported fallback rather than a primary UX target. Scope review found no premature filesystem, process, persistence, scenario, or other later-milestone behavior.
- **Test results:** 34 Vitest tests and 13 Chromium Playwright tests passed. Browser workflows reported no console errors or failed requests.
- **Integration status:** The verified feature branch was pushed to `origin/feature/m2-windows-applications`; M2 has not yet been merged into `develop`.
- **Release/version:** None assigned

---

## Milestone 3 — Applications + OS Experience

**Status:** ⬜ Not started  
**Purpose:** Make SHADOW OS feel like a usable simulated operating system through focused applications, application discovery, and native-feeling desktop actions without introducing storage or persistence.
**Dependencies/prerequisites:** Milestone 2 must be `✅ Complete`; application registration, lifecycle, and window behavior must be stable.

### Scope and implementation requirements

- [ ] Add Notepad through the existing application registry and manager with basic text entry, selection, and editing.
- [ ] Keep Notepad content temporary and in memory; closing it may discard its contents.
- [ ] Do not add Notepad save/open behavior, persistent application data, or any temporary or application-specific filesystem.
- [ ] Add a basic Calculator for standard arithmetic without calculation history or scientific-mode requirements.
- [ ] Add a small digital Clock with basic date/time presentation using the established clock abstraction.
- [ ] Keep the existing System Diagnostics application available as the diagnostic/proof application.
- [ ] Add a keyboard-accessible application drawer that derives installed applications from `ApplicationRegistry` and launches them through `ApplicationManager`.
- [ ] Keep the task strip focused on running windows rather than displaying every installed application permanently.
- [ ] Intercept browser `contextmenu` behavior within appropriate simulated OS surfaces and render a SHADOW OS context menu instead.
- [ ] Make context-menu definitions and invocation extensible for future context-specific menus without coupling domain state to DOM elements.
- [ ] Provide a small initial desktop menu with meaningful commands such as Refresh Desktop and Open App Drawer.
- [ ] Make Refresh Desktop operate on simulated desktop/OS state without reloading the browser page.
- [ ] Keep application and shell behavior behind existing OS contracts with one owner per capability and deterministic behavior where testing requires it.
- [ ] Keep virtual filesystems, File Manager, file saving/loading, persistent application data, browser, email, Image Viewer, Settings application, themes, calendar, tasks, terminal, scenarios, networking, accounts, and backend/cloud behavior out of M3.

### Required tests and verification

- [ ] Unit tests cover deterministic Notepad state, Calculator operations and invalid input handling, and Clock formatting where logic exists outside views.
- [ ] Integration tests cover registry-backed application discovery and launching each M3 application through the existing application manager.
- [ ] Integration tests cover simulated desktop refresh and context-menu commands without page reload or browser-native state ownership.
- [ ] Playwright verifies opening and using Notepad, Calculator, Clock, and the existing System Diagnostics application.
- [ ] Playwright verifies keyboard access to the application drawer, application launch, context-menu actions, and focus recovery.
- [ ] Browser verification confirms the native context menu is suppressed only within intended SHADOW OS surfaces and no unexpected page reload occurs.
- [ ] Accessibility and responsive verification cover the application drawer, context menu, and critical application workflows.
- [ ] Typecheck, lint, formatting, tests, production build, and browser verification pass.

### Definition of Done

- [ ] A user can discover and launch installed applications through a coherent application drawer rather than a permanent taskbar catalog.
- [ ] Notepad, Calculator, and Clock provide their intentionally small functional workflows through the established application/window architecture.
- [ ] SHADOW OS context menus replace the browser-native menu in intended OS surfaces and dispatch extensible simulated OS commands.
- [ ] Application, launcher, and context-menu state remains independent from DOM state where it represents simulation behavior.
- [ ] No application-specific persistence or filesystem substitute bypasses the planned shared M4 virtual filesystem.
- [ ] All Milestone 3 checks and required automated/browser verification pass.
- [ ] The production build passes and no known blocking issue remains.
- [ ] Scope review confirms all explicitly deferred applications, services, persistence, and scenario behavior remain out of M3.
- [ ] Milestone 3 has been reviewed and approved before Milestone 4 begins.

### Completion record

- **Completion date:** Pending
- **Verification performed:** Pending
- **Test results:** Pending
- **Release/version:** None assigned

---

## Milestone 4 — Virtual Filesystem + Coherent Sandbox

**Status:** ⬜ Not started  
**Purpose:** Introduce one shared virtual filesystem as an OS capability and use it to make applications participate in a coherent simulated computer.
**Dependencies/prerequisites:** Milestone 3 must be `✅ Complete`; focused applications, application discovery, context menus, and existing window/application contracts must be stable.

### Scope and implementation requirements

- [ ] Define a shared, storage-neutral virtual filesystem contract with normalized paths, stable node identity, files, directories, required metadata, typed errors, and mutation events.
- [ ] Keep filesystem state independent from DOM state, browser storage, and application-private storage.
- [ ] Construct and seed the filesystem through runtime composition with deterministic IDs, time, and initial data where testing requires them.
- [ ] Expose only approved filesystem capabilities to applications through public OS service contracts.
- [ ] Select a narrow set of filesystem-backed workflows that prove shared resources without committing to every possible application; candidates include File Manager and Notepad open/save.
- [ ] Ensure filesystem changes made through one application are coherently observable through other authorized applications.
- [ ] Improve responsive behavior, accessibility, stability, and application-failure recovery where required by the filesystem-backed workflows.
- [ ] Keep browser persistence optional and separate from the initial shared in-memory filesystem unless explicitly decided during M4 planning.
- [ ] Keep scenario infrastructure and scenario-specific behavior out of this milestone.

### Required tests and verification

- [ ] Unit tests cover path normalization, traversal rules, filesystem operations, metadata changes, typed errors, and events.
- [ ] Unit tests use deterministic IDs and time where relevant.
- [ ] Integration tests cover the selected applications sharing filesystem state only through public contracts.
- [ ] Playwright verifies the selected filesystem-backed workflows and observes updated shared file state across application boundaries where relevant.
- [ ] Playwright verifies critical keyboard paths and filesystem error presentation.
- [ ] Accessibility and responsive verification cover the selected filesystem-backed workflows.
- [ ] Typecheck, lint, formatting, tests, production build, and browser verification pass.

### Definition of Done

- [ ] Applications consume one shared virtual filesystem through public OS contracts without private data stores or coupling.
- [ ] A user can complete the selected shared file workflows through normal SHADOW OS interactions.
- [ ] The filesystem remains a simulated OS capability and does not imply access to the host filesystem.
- [ ] The resulting sandbox feels coherent rather than like disconnected application mockups.
- [ ] All Milestone 4 checks and required automated/browser verification pass.
- [ ] The production build passes and no known blocking issue remains.
- [ ] Open filesystem questions needed by the implementation have explicit decisions; unrelated future capabilities remain deferred.
- [ ] Scope review confirms that scenario infrastructure was not introduced prematurely.
- [ ] Milestone 4 has been reviewed and approved before Milestone 5 begins.

### Completion record

- **Completion date:** Pending
- **Verification performed:** Pending
- **Test results:** Pending
- **Release/version:** None assigned

---

## Milestone 5 — Scenario Foundation

**Status:** ⬜ Not started  
**Purpose:** Prove that investigation gameplay can configure and observe SHADOW OS through public system contracts without replacing the OS with scenario-specific screens.  
**Dependencies/prerequisites:** Milestone 4 must be `✅ Complete`; the coherent filesystem-backed OS sandbox and its public contracts must be stable, and scenario requirements must be documented from that completed sandbox.

### Scope and implementation requirements

- [ ] Document scenario requirements learned from the completed sandbox.
- [ ] Define versioned scenario metadata and package boundaries.
- [ ] Define scenario setup and reset behavior through public OS service APIs.
- [ ] Keep scenario progression state distinct from general OS state.
- [ ] Define objectives and completion evaluation in terms of simulation state.
- [ ] Observe typed domain events without depending on DOM structure.
- [ ] Allow controlled scenario changes to virtual resources only through public services.
- [ ] Build one narrow proof scenario that uses ordinary SHADOW OS interactions.
- [ ] Prevent scenario-specific logic from leaking into unrelated core services or applications.
- [ ] Prefer declarative scenario data where custom executable behavior is unnecessary.

### Required tests and verification

- [ ] Unit tests cover objective evaluation, progression state, reset, and scenario validation.
- [ ] Integration tests cover scenario setup, OS-state mutation through public services, event observation, completion, and reset.
- [ ] Architecture tests or review confirm there are no scenario DOM selectors or application-private imports.
- [ ] Playwright verifies the proof scenario can be started, investigated through SHADOW OS, completed, and reset.
- [ ] Existing sandbox workflows remain operational outside the scenario.
- [ ] Typecheck, lint, formatting, tests, production build, and browser verification pass.

### Definition of Done

- [ ] The proof scenario configures the simulated world and detects completion using only public OS interfaces.
- [ ] The player completes the proof through normal SHADOW OS applications and systems.
- [ ] Scenario state is isolated from general OS state and resets predictably.
- [ ] No scenario-specific core hacks, DOM coupling, or application-private dependencies remain.
- [ ] All Milestone 5 checks and required automated/browser verification pass.
- [ ] The production build passes and no known blocking issue remains.
- [ ] Milestone 5 has been reviewed before further scenario content begins.

### Completion record

- **Completion date:** Pending
- **Verification performed:** Pending
- **Test results:** Pending
- **Release/version:** None assigned

---

## Open Questions and Ambiguities

These items come from unresolved or deliberately flexible areas in the project specification. They are not mandatory features until explicitly decided for the milestone that needs them.

### Milestone 1 and shell

- Is audio part of the initial boot experience, and how should autoplay restrictions be handled?
- What formal accessibility target and browser/assistive-technology matrix will gate completion?
- Which mobile/tablet interaction mode should the shell support?
- What visual identity should distinguish SHADOW OS without imitating a real operating system?

### Milestone 3 applications + OS experience

- Which exact basic Calculator operations and error states are required?
- What simulated state should Refresh Desktop reset or recompute without reloading the page?
- Does the first context-menu model need only desktop commands, or a generic command-provider boundary ready for later context-specific menus?

### Milestone 4 filesystem + coherent sandbox

- Which metadata fields are required initially beyond files, directories, stable IDs, and content revisions?
- Are permissions, ownership, links, mounts, binary blobs, or recoverable deletion required later?
- If browser persistence is eventually added, should it use local storage, IndexedDB, import/export, or a combination?
- Which filesystem-backed workflows should prove the coherent sandbox: File Manager, Notepad open/save, Image Viewer, shared application data, or another narrow combination?
- What measurable accessibility, performance, and application-failure recovery criteria gate sandbox completion?

### Milestone 5 and scenarios

- Are scenario packages JSON data, bundled TypeScript modules, or a validated hybrid?
- Is deterministic replay valuable enough to constrain event and time design?

### Planning and release mapping

- No milestone is currently assigned to `v0.1.0`, `v1.0.0`, or any other release automatically.
- The exact milestone that will qualify as the first stable `v1.0.0` product release remains intentionally undecided.
- Terminal support, persistence, search, community scenario packages, PWA support, and other future ideas remain optional unless promoted by a later explicit decision.
