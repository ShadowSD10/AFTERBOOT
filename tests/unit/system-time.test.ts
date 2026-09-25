import { describe, expect, it } from "vitest";

import { formatSystemTime } from "../../src/shell/system-time";

describe("formatSystemTime", () => {
  it("formats an injected timestamp deterministically in SHADOW standard time", () => {
    const timestamp = Date.UTC(2042, 6, 9, 4, 5, 6);

    expect(formatSystemTime(timestamp)).toEqual({
      iso: "2042-07-09T04:05:06.000Z",
      time: "04:05:06",
      date: "2042.07.09",
    });
  });

  it("rejects invalid timestamps", () => {
    expect(() => formatSystemTime(Number.NaN)).toThrow("System time requires a valid timestamp.");
  });
});
