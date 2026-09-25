# AFTERBOOT

AFTERBOOT is a browser-based interactive experience where the player operates a fictional computer. It is designed as a completely static web application that runs in the browser without a backend, account, database, or cloud runtime service.

The product relationship is:

```text
AFTERBOOT → SHADOW OS → applications and scenarios
```

AFTERBOOT is the host experience. SHADOW OS is the fictional operating system it simulates. The current implementation includes the first reusable application and window framework; filesystem, broader sandbox, and scenario systems remain roadmap work.

## Current Status

Milestone 2 — Windows and Applications has been implemented and locally verified. Formal milestone review and CI verification remain pending. AFTERBOOT is in active development and remains pre-v1.0. No `v0.1.0` release has been created yet.

The current implementation provides:

- A Vite and strict TypeScript foundation
- Vanilla TypeScript using standard DOM APIs and CSS
- ESLint, Prettier, Vitest, and Playwright infrastructure
- Continuous integration and GitHub Pages deployment workflows
- A deterministic boot/reset runtime and responsive SHADOW OS desktop shell
- A DOM-independent window manager with focus, movement, resize, minimize, maximize, restore, and close transitions
- A startup-only application registry and single-instance application lifecycle
- Pointer-driven floating windows on desktop and active-window presentation on small screens
- Keyboard-accessible launch, focus, task restore, and window controls
- A minimal System Diagnostics application that proves application and multi-window lifecycle behavior

The virtual filesystem, proof file applications, broader sandbox services, and scenarios do not exist yet.

## Project Direction

Development is intended to progress from the current host foundation toward a SHADOW OS runtime, desktop shell, reusable applications, and a virtual filesystem. Those systems will first support a coherent OS sandbox and later investigation and scenario experiences in which the operating system itself is the game environment.

This progression is a direction, not a claim of current functionality or a release schedule.

## Architecture

AFTERBOOT is being designed as a layered, service-oriented client application. Simulation state will remain independent of the DOM, applications will use explicit OS service contracts, and future scenarios will interact with the same reusable systems rather than manipulating UI directly.

The detailed architecture, constraints, decisions, and roadmap live in [docs/AFTERBOOT_PROJECT.md](docs/AFTERBOOT_PROJECT.md).

## Development

### Requirements

- Node.js 22.12 or newer
- npm 10 or newer

Install dependencies and start the development server:

```shell
npm ci
npm run dev
```

Create and preview a production build:

```shell
npm run build
npm run preview
```

### Commands

| Command                | Purpose                                          |
| ---------------------- | ------------------------------------------------ |
| `npm run dev`          | Start the Vite development server.               |
| `npm run build`        | Typecheck and build the static production site.  |
| `npm run preview`      | Preview the production build locally.            |
| `npm run typecheck`    | Run strict TypeScript checking.                  |
| `npm run lint`         | Run ESLint.                                      |
| `npm run format`       | Format supported files with Prettier.            |
| `npm run format:check` | Verify formatting without changing files.        |
| `npm test`             | Run Vitest unit tests once.                      |
| `npm run test:watch`   | Run Vitest in watch mode.                        |
| `npm run test:e2e`     | Build, serve, and run the Playwright smoke test. |

Install the Chromium test browser once with `npx playwright install chromium` before running the browser test locally.

## Testing

The current quality gates include strict TypeScript checking, ESLint, Prettier verification, Vitest unit tests, and a Playwright browser smoke test. Run the individual commands above or use the same checks executed by CI.

The browser baseline is current evergreen browsers with ES2022, standard DOM APIs, CSS Grid, and CSS custom-property support. CI currently exercises the production experience in Chromium.

## Deployment

AFTERBOOT builds to static files in `dist/` and is intended to be deployed through GitHub Pages. Vite emits relative asset paths so the site can run below a repository subpath without hardcoding a repository name.

The deployment workflow is configured, but remote GitHub Pages deployment has not yet been verified. The deployed application requires no backend, secrets, authentication, or server-side code.

## Versioning

AFTERBOOT follows Semantic Versioning. Notable work is recorded under `[Unreleased]` in [CHANGELOG.md](CHANGELOG.md) until a release is created. No release or Git tag is implied by ordinary development commits.
