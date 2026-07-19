export function safeReturnTo(value: string | null | undefined, fallback = '/dashboard'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return fallback;
  try {
    const parsed = new URL(value, 'https://mila.local');
    return parsed.origin === 'https://mila.local' ? `${parsed.pathname}${parsed.search}${parsed.hash}` : fallback;
  } catch {
    return fallback;
  }
}
