export const MILA_HOST = 'mila.purangpt.com';
export const MIACHAT_HOST = 'miachat.purangpt.com';
export const MILA_ORIGIN = `https://${MILA_HOST}`;
export const MIACHAT_ORIGIN = `https://${MIACHAT_HOST}`;

export function normalizeHostname(value: string | null | undefined): string {
  return (value || '')
    .trim()
    .toLowerCase()
    .replace(/\.$/, '')
    .replace(/:\d+$/, '');
}

export function isMiaChatHostname(value: string | null | undefined): boolean {
  return normalizeHostname(value) === MIACHAT_HOST;
}
