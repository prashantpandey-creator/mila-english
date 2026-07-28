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
    if (isGia) {
      fetch('/api/users/me', { cache: 'no-store' })
        .then((response) => response.ok ? response.json() : null)
        .then(setUser)
        .catch(() => setUser(null));
      return;
    }
    Promise.all([
      fetch('/api/billing/catalog', { cache: 'no-store' }).then((response) => response.json()),
      fetch('/api/users/me', { cache: 'no-store' }).then((response) => response.ok ? response.json() : null),
    ]).then(([nextCatalog, nextUser]) => { setCatalog(nextCatalog); setUser(nextUser); }).catch(() => setError(T('Не удалось загрузить тариф.', 'Could not load the plan.')));
  }, [isGia, lang]);

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
    ? (user ? '/live' : '/login?returnTo=/live')
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
          <p className="pricing-intro__kicker">{isGia ? 'GIA · FREE EARLY ACCESS' : 'FREE + PRO'}</p>
          <h1>{isGia
            ? T('Начни бесплатно. Pro может подождать.', 'Start free. Pro can wait.')
            : T('Сначала почувствуй пользу. Потом решай.', 'Feel the value first. Then decide.')}</h1>
          <p>{isGia
            ? T('Gia Live и текстовый чат открыты бесплатно во время раннего доступа. Никакой оплаты сейчас — сначала почувствуй разговор.', 'Gia Live and text chat are free during early access. No payment now—experience the conversation first.')
            : T('Основной путь FluentMitra остаётся бесплатным. Pro — это один прозрачный 30-дневный доступ без скрытого автопродления.', 'FluentMitra’s core path stays free. Pro is one transparent 30-day pass with no hidden auto-renewal.')}</p>
        </div>
        <div className="pricing-grid">
          <article className={`pricing-card${isGia ? ' pricing-card--gia-free' : ''}`}>
            <span className="pricing-card__label">{isGia ? 'GIA LIVE · FREE' : 'FREE'}</span>
            <h2>{isGia ? T('Начни с Джиа', 'Start with Gia') : T('Практика каждый день', 'Daily practice')}</h2>
            <div className="pricing-card__price">₽0 <small>{isGia ? T('ранний доступ', 'early access') : T('навсегда', 'always')}</small></div>
            {isGia ? (
              <ul>
                <li>{T('Продолжающиеся Live-разговоры — не одно демо', 'Ongoing Live conversations—not a one-time preview')}</li>
                <li>{T('Отдельный медленный, интригующий голос Джиа', 'Gia’s distinct slow, intriguing voice')}</li>
                <li>{T('Микрофон включается только после твоего согласия', 'Microphone starts only after your consent')}</li>
                <li>{T('Текстовый чат и все четыре образа Джиа', 'Text chat and all four Gia appearances')}</li>
              </ul>
            ) : (
              <ul>
                <li>{T('Проверка уровня и стартовый план', 'Level check and starter plan')}</li>
                <li>{T('Базовые уроки, слова и грамматика', 'Starter lessons, vocabulary, and grammar')}</li>
                <li>{T('Одно Live-демо голоса с главной страницы', 'One Live voice preview from the front door')}</li>
                <li>{T('Чат и отслеживание прогресса', 'Chat and learning progress')}</li>
              </ul>
            )}
            <a className="pricing-cta" href={freeHref}>{isGia ? T('Начать Gia Live бесплатно', 'Start Gia Live free') : T('Продолжить бесплатно', 'Continue free')}</a>
          </article>
          <article className="pricing-card pricing-card--pro">
            <span className="pricing-card__label">{isGia ? 'PRO · LATER' : 'FLUENTMITRA PRO'}</span>
            <h2>{isGia ? T('Pro может подождать', 'Pro can wait') : T('Быстрее и лично для тебя', 'Faster and made for you')}</h2>
            <div className="pricing-card__price">{isGia ? T('Позже', 'Later') : price} <small>{isGia ? T('когда будет готов', 'when it is ready') : T('за 30 дней', 'for 30 days')}</small></div>
            {isGia ? (
              <ul>
                <li>{T('Бесплатный Gia Live остаётся стартовой точкой', 'Free Gia Live remains the starting point')}</li>
                <li>{T('Функции и цена будут показаны до запуска Pro', 'Features and price will be shown before Pro launches')}</li>
                <li>{T('Никакой скрытой подписки или автопродления', 'No hidden subscription or auto-renewal')}</li>
                <li>{T('Сегодня не нужны карта или платёж', 'No card or payment is needed today')}</li>
              </ul>
            ) : (
              <ul>
                <li>{T('Всё из бесплатного плана', 'Everything in Free')}</li>
                <li>{T('Быстрый живой голос — только с явного согласия', 'Fast live voice—only with explicit consent')}</li>
                <li>{T('Уроки по твоей цели и теме', 'Custom lessons for your goal and topic')}</li>
                <li>{T('Доступ привязан к аккаунту, а не устройству', 'Access follows your account, not one device')}</li>
              </ul>
            )}
            {isGia ? (
              <button className="pricing-cta" type="button" disabled>{T('Сейчас не требуется', 'Not required now')}</button>
            ) : (
              <button className="pricing-cta" type="button" disabled={busy || (!active && !available && !!catalog)} onClick={checkout}>
                {busy
                  ? T('Открываем оплату…', 'Opening checkout…')
                  : active
                    ? T('Pro уже активен', 'Pro is active')
                    : !catalog
                      ? T('Загружаем…', 'Loading…')
                      : available
                        ? T('Получить Pro на 30 дней', 'Get 30 days of Pro')
                        : T('Оплата скоро откроется', 'Checkout opening soon')}
              </button>
            )}
            {error ? <p className="pricing-error" role="alert">{error}</p> : null}
          </article>
        </div>
        <p className="pricing-note">
          {isGia
            ? T('Во время раннего доступа оплата не нужна. Live включается только после твоего согласия на передачу аудио и расшифровки в OpenAI.', 'No payment is needed during early access. Live starts only after you consent to sending microphone audio and transcripts to OpenAI.')
            : T('Оплата проходит на защищённой странице ЮKassa. FluentMitra не видит и не хранит данные карты. Доступ не продлевается автоматически.', 'Payment happens on YooKassa’s secure page. FluentMitra never sees or stores card details. Access does not renew automatically.')}
          {' '}<a href="/terms">{T('Условия', 'Terms')}</a>
          {!isGia ? <> · <a href="/refunds">{T('Возвраты', 'Refunds')}</a></> : null}
        </p>
      </AppMain>
    </AppShell>
  );
}
