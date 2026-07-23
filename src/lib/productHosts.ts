export const MILA_HOST = 'mila.purangpt.com';
export const GIA_HOST = 'gia.purangpt.com';
export const LEGACY_MIACHAT_HOST = 'miachat.purangpt.com';
export const MILA_ORIGIN = `https://${MILA_HOST}`;
export const GIA_ORIGIN = `https://${GIA_HOST}`;

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
