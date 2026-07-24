export const MILA_HOST = 'mila.purangpt.com';
export const GIA_HOST = 'gia.purangpt.com';
export const MIA_HOST = 'mia.purangpt.com';
export const LEGACY_MIACHAT_HOST = 'miachat.purangpt.com';
export const MILA_ORIGIN = `https://${MILA_HOST}`;
export const GIA_ORIGIN = `https://${GIA_HOST}`;
export const MIA_ORIGIN = `https://${MIA_HOST}`;

export type ProductId = 'mila' | 'gia' | 'mia';

export function normalizeHostname(value: string | null | undefined): string {
  return (value || '')
    .trim()
    .toLowerCase()
    .replace(/\.$/, '')
    .replace(/:\d+$/, '');
}

export function isGiaHostname(value: string | null | undefined): boolean {
  return normalizeHostname(value) === GIA_HOST;
}

export function isMilaHostname(value: string | null | undefined): boolean {
  return normalizeHostname(value) === MILA_HOST;
}

export function isMiaHostname(value: string | null | undefined): boolean {
  return normalizeHostname(value) === MIA_HOST;
}

export function productForHostname(value: string | null | undefined): ProductId {
  if (isGiaHostname(value)) return 'gia';
  if (isMiaHostname(value)) return 'mia';
  return 'mila';
}

/**
 * Host rewrites keep the public URL at `/`, so client routing still reports
 * the apex even when Next is rendering a product's internal page. Normalize
 * that visible pathname before selecting route-scoped chrome and CSS.
 */
export function effectiveProductPath(product: ProductId, pathname: string): string {
  if (pathname !== '/') return pathname;
  if (product === 'gia') return '/darshan';
  if (product === 'mia') return '/mia';
  return '/';
}
