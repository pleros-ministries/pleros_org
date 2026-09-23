export function lagosToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(new Date());
}

export function shiftDate(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function clampDate(value: string, min: string, max: string): string {
  return value < min ? min : value > max ? max : value;
}
