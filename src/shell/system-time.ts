export interface SystemTime {
  readonly iso: string;
  readonly time: string;
  readonly date: string;
}

export function formatSystemTime(timestamp: number): SystemTime {
  const value = new Date(timestamp);

  if (Number.isNaN(value.getTime())) {
    throw new RangeError("System time requires a valid timestamp.");
  }

  const year = value.getUTCFullYear();
  const month = pad(value.getUTCMonth() + 1);
  const day = pad(value.getUTCDate());
  const hours = pad(value.getUTCHours());
  const minutes = pad(value.getUTCMinutes());
  const seconds = pad(value.getUTCSeconds());

  return Object.freeze({
    iso: value.toISOString(),
    time: `${hours}:${minutes}:${seconds}`,
    date: `${year}.${month}.${day}`,
  });
}

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}
