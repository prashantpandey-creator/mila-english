export function toSpokenText(value: string): string {
  const cleaned = value
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/[\p{Extended_Pictographic}\uFE0F]/gu, '')
    .replace(/[*_`#>~|]/g, '')
    .replace(/\s*\n+\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  const firstQuestion = cleaned.indexOf('?');
  return firstQuestion >= 0 ? cleaned.slice(0, firstQuestion + 1) : cleaned;
}
