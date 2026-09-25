import { describe, expect, it } from "vitest";

import { formatSystemTime } from "../../src/shell/system-time";

describe("formatSystemTime", () => {
  it("formats an injected timestamp in the machine's local timezone", () => {
    const timestamp = new Date(2042, 6, 9, 4, 5, 6).getTime();

    expect(formatSystemTime(timestamp)).toEqual({
      iso: new Date(timestamp).toISOString(),
      time: "04:05:06",
      date: "2042.07.09",
    });
  });

  it("uses the local date when an injected timestamp crosses local midnight", () => {
    const beforeMidnight = new Date(2042, 11, 31, 23, 59, 59).getTime();
    const afterMidnight = beforeMidnight + 1_000;

    expect(formatSystemTime(beforeMidnight)).toMatchObject({
      time: "23:59:59",
      date: "2042.12.31",
    });
    expect(formatSystemTime(afterMidnight)).toMatchObject({
      time: "00:00:00",
      date: "2043.01.01",
    });
  });

  it("rejects invalid timestamps", () => {
    expect(() => formatSystemTime(Number.NaN)).toThrow("System time requires a valid timestamp.");
  });
});
