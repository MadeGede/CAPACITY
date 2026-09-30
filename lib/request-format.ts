const businessDate = (value: string): Date | null => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day, 12);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
  }
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
};

/** Date-only values are business calendar dates, never UTC instants. */
export function requestDate(value: string, withTime = false) {
  const date = businessDate(value);
  if (!date) return "Not specified";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    ...(value.length !== 10 ? { timeZone: "Asia/Jakarta" } : {}),
    ...(withTime && value.length !== 10 ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

export function requestDateLong(value: string) {
  const date = businessDate(value);
  return date ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", ...(value.length !== 10 ? { timeZone: "Asia/Jakarta" } : {}) }).format(date) : "Not specified";
}

export function requestTime(value: string) {
  const date = businessDate(value);
  return date && value.length !== 10 ? new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Jakarta" }).format(date) : "Not specified";
}
