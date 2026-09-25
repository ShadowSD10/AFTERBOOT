export type ApplicationId = string & { readonly __brand: "ApplicationId" };
export type ApplicationInstanceId = string & { readonly __brand: "ApplicationInstanceId" };
export type WindowId = string & { readonly __brand: "WindowId" };

export type IdScope = "application-instance" | "window";

export interface IdGenerator {
  next(scope: IdScope): string;
}

export class SequentialIdGenerator implements IdGenerator {
  readonly #counts = new Map<IdScope, number>();

  next(scope: IdScope): string {
    const nextCount = (this.#counts.get(scope) ?? 0) + 1;
    this.#counts.set(scope, nextCount);
    return `${scope}-${nextCount}`;
  }
}

export function toApplicationId(value: string): ApplicationId {
  return requireIdentifier(value, "ApplicationId") as ApplicationId;
}

export function toApplicationInstanceId(value: string): ApplicationInstanceId {
  return requireIdentifier(value, "ApplicationInstanceId") as ApplicationInstanceId;
}

export function toWindowId(value: string): WindowId {
  return requireIdentifier(value, "WindowId") as WindowId;
}

function requireIdentifier(value: string, kind: string): string {
  if (value.trim().length === 0) {
    throw new TypeError(`${kind} must not be empty.`);
  }

  return value;
}
