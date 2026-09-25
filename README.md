# AFTERBOOT Documentation

This is the `documentation` branch for AFTERBOOT. It provides a clean, documentation-only reference surface so project documentation can be reviewed independently from application implementation.

## Branch Purpose

- Project specifications, architecture, milestones, decisions, and other Markdown references live in [`docs/`](docs/).
- Notable project changes are maintained in [`CHANGELOG.md`](CHANGELOG.md).
- Documentation may be updated here as AFTERBOOT evolves.
- Application source code, tests, build configuration, development tooling, and workflow files intentionally do not belong on this branch.

## Branch Roles

- `main` remains the stable production branch and the source of the live AFTERBOOT site.
- `develop` remains the active development and integration branch.
- `documentation` exists primarily for documentation review and reference.

This branch is not an application development branch and is not a deployment branch.

## Current Project Status

Milestone 2 — Windows and Applications is complete. The implementation and full feature-branch diff passed local formatting, strict TypeScript, ESLint, Vitest, production build, Playwright, scope, and artifact verification. Desktop behavior was manually accepted; mobile presentation is functional but is not a primary UX target.

The verified implementation is available at `origin/feature/m2-windows-applications` with feature head `b042dc55f0f1417c049019b3bac2c97a3767b1d8` and implementation commit `116f01f6e495639f55372588b3981e68a99badcf`. It has not yet been merged into `develop`.

Milestone 3 — Virtual Filesystem and Proof Applications is next. No M2 release, version tag, or GitHub Release has been created.
