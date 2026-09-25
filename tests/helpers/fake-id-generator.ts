import type { IdGenerator, IdScope } from "../../src/core/identity/identifiers";

export class FakeIdGenerator implements IdGenerator {
  readonly #counts = new Map<IdScope, number>();

  next(scope: IdScope): string {
    const nextCount = (this.#counts.get(scope) ?? 0) + 1;
    this.#counts.set(scope, nextCount);
    return `${scope}-${nextCount}`;
  }
}
