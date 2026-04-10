function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function buildUpcomingDateKeys(days: number, startDate = new Date()): string[] {
  const safeDays = Math.max(1, Math.floor(days));
  const keys: string[] = [];
  const cursor = new Date(startDate);
  cursor.setHours(0, 0, 0, 0);

  for (let offset = 0; offset < safeDays; offset += 1) {
    const next = new Date(cursor);
    next.setDate(cursor.getDate() + offset);
    keys.push(formatDateKey(next));
  }

  return keys;
}
