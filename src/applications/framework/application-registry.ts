import type { ApplicationId } from "../../core/identity/identifiers";
import type { ApplicationDefinition, ApplicationManifest } from "./application";

export class DuplicateApplicationError extends Error {
  constructor(applicationId: ApplicationId) {
    super(`Application is already registered: ${applicationId}`);
    this.name = "DuplicateApplicationError";
  }
}

export class UnknownApplicationError extends Error {
  constructor(applicationId: ApplicationId) {
    super(`Application is not registered: ${applicationId}`);
    this.name = "UnknownApplicationError";
  }
}

export class ApplicationRegistry {
  readonly #definitions = new Map<ApplicationId, ApplicationDefinition>();

  constructor(definitions: readonly ApplicationDefinition[]) {
    for (const definition of definitions) {
      const applicationId = definition.manifest.id;

      if (this.#definitions.has(applicationId)) {
        throw new DuplicateApplicationError(applicationId);
      }

      this.#definitions.set(applicationId, freezeDefinition(definition));
    }
  }

  list(): readonly ApplicationManifest[] {
    return Object.freeze([...this.#definitions.values()].map((definition) => definition.manifest));
  }

  get(applicationId: ApplicationId): ApplicationDefinition {
    const definition = this.#definitions.get(applicationId);

    if (!definition) {
      throw new UnknownApplicationError(applicationId);
    }

    return definition;
  }
}

function freezeDefinition(definition: ApplicationDefinition): ApplicationDefinition {
  const constraints = definition.manifest.window.constraints
    ? Object.freeze({ ...definition.manifest.window.constraints })
    : undefined;
  const window = Object.freeze({
    ...definition.manifest.window,
    ...(constraints ? { constraints } : {}),
  });
  const manifest = Object.freeze({ ...definition.manifest, window });

  return Object.freeze({
    manifest,
    create: (context: Parameters<ApplicationDefinition["create"]>[0]) => definition.create(context),
  });
}
