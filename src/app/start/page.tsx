import { redirect } from 'next/navigation';

const FORWARDED_QUERY_KEYS = [
  'nativeLanguage',
  'chooseLanguage',
  'returnTo',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
] as const;

export default async function StartPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const incoming = await searchParams;
  const forwarded = new URLSearchParams();

  for (const key of FORWARDED_QUERY_KEYS) {
    const value = incoming[key];
    const firstValue = Array.isArray(value) ? value[0] : value;
    if (firstValue) forwarded.set(key, firstValue.slice(0, 200));
  }

  redirect(forwarded.size ? `/?${forwarded.toString()}` : '/');
}
