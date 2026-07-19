import type { Metadata } from 'next';
import { AppHeader, AppMain, AppShell } from '@/components/ui/AppShell';

export const metadata: Metadata = { title: 'Terms of Service — Mila', description: 'Terms for using Mila Free and Mila Pro.' };

export default function TermsPage() {
  return <AppShell className="legal-page"><AppHeader backHref="/" title="Terms of service" eyebrow="Mila · clear terms" /><AppMain width="work" className="legal-page__main"><article className="legal-page__article"><p className="legal-page__kicker">TERMS OF SERVICE</p><h1>Simple terms for a learning product.</h1><p className="legal-page__meta">Effective 19 July 2026</p>
    <section><h2>The service</h2><p>Mila provides English-learning lessons, assessment, speech tools, chat, and progress features. AI-generated feedback can be wrong and is educational guidance, not a professional certification or guaranteed learning outcome.</p></section>
    <section><h2>Accounts</h2><p>You may begin with an isolated guest profile. A registered account lets progress follow you across devices. Keep your password private and give accurate account information. You may delete the account and learning data from the Account page.</p></section>
    <section><h2>Mila Free and Mila Pro</h2><p>Mila Free includes the core learning journey. Mila Pro is currently a one-time 30-day access pass. It does not renew automatically, and no recurring charge is created. The exact price and included features are shown before checkout.</p></section>
    <section><h2>Payments</h2><p>YooKassa hosts checkout and processes available payment methods. Mila does not receive or store full card details. Pro activates only after Mila verifies the payment directly with the processor. Taxes, receipts, and payment-method availability depend on the merchant agreement and applicable law.</p></section>
    <section><h2>Fair use</h2><p>Do not abuse the service, automate excessive requests, interfere with other learners, attempt unauthorized access, or use Mila to create unlawful content. Mila may limit abusive traffic or suspend an account to protect the service.</p></section>
    <section><h2>Availability and changes</h2><p>Internet, microphone, model, and regional availability can affect individual features. Mila may improve or replace features, but will not silently shorten an already activated 30-day Pro period.</p></section>
    <section><h2>Contact</h2><p>Questions: <a href="mailto:fcpuru95@gmail.com">fcpuru95@gmail.com</a>. Privacy is covered by the <a href="/privacy">Privacy Policy</a>; payment issues are covered by the <a href="/refunds">Refund and payment policy</a>.</p></section>
    <section className="legal-page__note"><h2>Коротко по-русски</h2><p>Основные функции доступны бесплатно. Mila Pro — разовый доступ на 30 дней без автопродления. Оплата активирует Pro только после подтверждения ЮKassa. Аккаунт и учебные данные можно удалить в разделе «Аккаунт».</p></section>
  </article></AppMain></AppShell>;
}
