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

  const year = value.getFullYear();
  const month = pad(value.getMonth() + 1);
  const day = pad(value.getDate());
  const hours = pad(value.getHours());
  const minutes = pad(value.getMinutes());
  const seconds = pad(value.getSeconds());

  return Object.freeze({
    iso: value.toISOString(),
    time: `${hours}:${minutes}:${seconds}`,
    date: `${year}.${month}.${day}`,
  });
}

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}
