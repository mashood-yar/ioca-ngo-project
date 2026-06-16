export function formatDate(date: string | Date, format: 'short' | 'long' = 'long'): string {
  const d = new Date(date);
  if (format === 'short') return d.toLocaleDateString('en-PK', { day: 'numeric', month: 'short' });
  return d.toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function memberSince(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-PK', { month: 'short', year: 'numeric' });
}

export function daysUntil(date: string | Date): number {
  return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}
