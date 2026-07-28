'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LangToggle from '@/components/LangToggle';
import { AppHeader, AppMain, AppShell } from '@/components/ui/AppShell';
import { useI18n } from '@/lib/i18n-provider';
import { useProduct } from '@/lib/product-context';
import './pricing.css';

type Catalog = { configured: boolean; product: { code: string; amountMinor: number; currency: string; durationDays: number }; renewsAutomatically: boolean };
type User = { isGuest: boolean; emailVerified?: boolean; subscription?: { isPaid: boolean; renewsAt: string | null } };

export default function PricingPage() {
  const { lang } = useI18n();
  const product = useProduct();
  const isGia = product === 'gia';
  const router = useRouter();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const T = (ru: string, en: string) => lang === 'ru' ? ru : en;

  useEffect(() => {
    Promise.all([
      fetch('/api/billing/catalog', { cache: 'no-store' }).then((response) => response.json()),
      fetch('/api/users/me', { cache: 'no-store' }).then((response) => response.ok ? response.json() : null),
    ]).then(([nextCatalog, nextUser]) => { setCatalog(nextCatalog); setUser(nextUser); }).catch(() => setError(T('Не удалось загрузить тариф.', 'Could not load the plan.')));
  }, [lang]);

  const checkout = async () => {
    if (!user || user.isGuest) {
      router.push('/register?returnTo=/pricing');
      return;
    }
    if (user.subscription?.isPaid) {
      router.push('/account');
      return;
    }
    if (!catalog?.configured) return;

    setBusy(true); setError('');
    const response = await fetch('/api/billing/checkout', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productCode: catalog.product.code }),
    });
    const body = await response.json().catch(() => null);
    if (response.ok && body?.checkoutUrl) {
      window.location.assign(body.checkoutUrl);
      return;
    }
    if (body?.code === 'ACCOUNT_REQUIRED' || response.status === 401) router.push('/register?returnTo=/pricing');
    else if (body?.code === 'EMAIL_VERIFICATION_REQUIRED') router.push('/account');
    else setError(body?.error || T('Не удалось открыть оплату.', 'Could not open checkout.'));
    setBusy(false);
  };

  const active = !!user?.subscription?.isPaid;
  const available = !!catalog?.configured;
  const backHref = isGia ? '/live' : '/';
  const freeHref = isGia
    ? (user ? '/chat' : '/register?returnTo=/chat')
    : (user ? '/dashboard' : '/register?returnTo=/dashboard');
  const price = catalog
    ? new Intl.NumberFormat(lang === 'ru' ? 'ru-RU' : 'en-GB', {
        style: 'currency',
        currency: catalog.product.currency,
        maximumFractionDigits: 0,
      }).format(catalog.product.amountMinor / 100)
    : '₽1,490';

  return (
    <AppShell className={`pricing-page${isGia ? ' pricing-page--gia' : ''}`}>
      <AppHeader backHref={backHref} title={isGia ? T('Доступ к Live', 'Live access') : T('Тарифы', 'Plans')} actions={<LangToggle />} />
      <AppMain width="wide" className="pricing-page__main">
        <div className="pricing-intro">
          <p className="pricing-intro__kicker">{isGia ? 'GIA · VOICE + TEXT' : 'FREE + PRO'}</p>
          <h1>{isGia
            ? T('Больше времени с Джиа. Только когда ты выбираешь.', 'More time with Gia. Only when you choose it.')
            : T('Сначала почувствуй пользу. Потом решай.', 'Feel the value first. Then decide.')}</h1>
          <p>{isGia
            ? T('Текстовый чат остаётся доступным. Пропуск на 30 дней открывает продолжающиеся Live-разговоры с Джиа — без подписки и автопродления.', 'Text chat stays available. A 30-day pass opens ongoing Live conversations with Gia—without a subscription or auto-renewal.')
            : T('Основной путь FluentMitra остаётся бесплатным. Pro — это один прозрачный 30-дневный доступ без скрытого автопродления.', 'FluentMitra’s core path stays free. Pro is one transparent 30-day pass with no hidden auto-renewal.')}</p>
        </div>
        <div className="pricing-grid">
          <article className="pricing-card">
            <span className="pricing-card__label">{isGia ? 'GIA TEXT' : 'FREE'}</span>
            <h2>{isGia ? T('Оставайся в чате', 'Stay in text') : T('Практика каждый день', 'Daily practice')}</h2>
            <div className="pricing-card__price">₽0 <small>{T('навсегда', 'always')}</small></div>
            {isGia ? (
              <ul>
                <li>{T('Личный текстовый чат с Джиа', 'Private text conversations with Gia')}</li>
                <li>{T('Одно бесплатное Live-демо, начатое только тобой', 'One free Live preview, started only by you')}</li>
                <li>{T('Выбранный образ Джиа сохраняется между режимами', 'Your chosen Gia presence follows between modes')}</li>
                <li>{T('Всегда ясно, что Джиа — вымышленный ИИ-компаньон', 'Always clear that Gia is a fictional AI companion')}</li>
              </ul>
            ) : (
              <ul>
                <li>{T('Проверка уровня и стартовый план', 'Level check and starter plan')}</li>
                <li>{T('Базовые уроки, слова и грамматика', 'Starter lessons, vocabulary, and grammar')}</li>
                <li>{T('Одно Live-демо голоса с главной страницы', 'One Live voice preview from the front door')}</li>
                <li>{T('Чат и отслеживание прогресса', 'Chat and learning progress')}</li>
              </ul>
            )}
            <a className="pricing-cta" href={freeHref}>{isGia ? T('Продолжить в чате', 'Continue in text chat') : T('Продолжить бесплатно', 'Continue free')}</a>
          </article>
          <article className="pricing-card pricing-card--pro">
            <span className="pricing-card__label">{isGia ? 'GIA LIVE · 30 DAYS' : 'FLUENTMITRA PRO'}</span>
            <h2>{isGia ? T('Верни голос Джиа', 'Return to Gia’s voice') : T('Быстрее и лично для тебя', 'Faster and made for you')}</h2>
            <div className="pricing-card__price">{price} <small>{T('за 30 дней', 'for 30 days')}</small></div>
            {isGia ? (
              <ul>
                <li>{T('Продолжающиеся Live-разговоры с Джиа', 'Ongoing Live conversations with Gia')}</li>
                <li>{T('Её отдельный медленный, интригующий голос', 'Her distinct slow, intriguing voice')}</li>
                <li>{T('Микрофон включается только после твоего согласия', 'Microphone starts only after your consent')}</li>
                <li>{T('Доступ следует за аккаунтом, без автопродления', 'Access follows your account, with no auto-renewal')}</li>
              </ul>
            ) : (
              <ul>
                <li>{T('Всё из бесплатного плана', 'Everything in Free')}</li>
                <li>{T('Быстрый живой голос — только с явного согласия', 'Fast live voice—only with explicit consent')}</li>
                <li>{T('Уроки по твоей цели и теме', 'Custom lessons for your goal and topic')}</li>
                <li>{T('Доступ привязан к аккаунту, а не устройству', 'Access follows your account, not one device')}</li>
              </ul>
            )}
            <button className="pricing-cta" type="button" disabled={busy || (!active && !available && !!catalog)} onClick={checkout}>
              {busy
                ? T('Открываем оплату…', 'Opening checkout…')
                : active
                  ? (isGia ? T('Gia Live уже активен', 'Gia Live is active') : T('Pro уже активен', 'Pro is active'))
                  : !catalog
                    ? T('Загружаем…', 'Loading…')
                    : available
                      ? (isGia ? T('Открыть Gia Live на 30 дней', 'Unlock 30 days of Gia Live') : T('Получить Pro на 30 дней', 'Get 30 days of Pro'))
                      : T('Оплата скоро откроется', 'Checkout opening soon')}
            </button>
            {error ? <p className="pricing-error" role="alert">{error}</p> : null}
          </article>
        </div>
        <p className="pricing-note">
          {isGia
            ? T('Оплата проходит на защищённой странице ЮKassa. Джиа не видит и не хранит данные карты. Доступ не продлевается автоматически.', 'Payment happens on YooKassa’s secure page. Gia never sees or stores card details. Access does not renew automatically.')
            : T('Оплата проходит на защищённой странице ЮKassa. FluentMitra не видит и не хранит данные карты. Доступ не продлевается автоматически.', 'Payment happens on YooKassa’s secure page. FluentMitra never sees or stores card details. Access does not renew automatically.')}
          {' '}<a href="/terms">{T('Условия', 'Terms')}</a>
          {!isGia ? <> · <a href="/refunds">{T('Возвраты', 'Refunds')}</a></> : null}
        </p>
      </AppMain>
    </AppShell>
  );
}
