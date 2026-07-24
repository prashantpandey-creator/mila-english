import type { Metadata } from 'next';
import { AppHeader, AppMain, AppShell } from '@/components/ui/AppShell';

export const metadata: Metadata = { title: 'Terms of Service — Mila, Gia, and Mia', description: 'Terms for using the Mila, Gia, and Mia services.' };

export default function TermsPage() {
  return <AppShell className="legal-page"><AppHeader backHref="/" title="Terms of service" eyebrow="Mila · Gia · Mia" /><AppMain width="work" className="legal-page__main"><article className="legal-page__article"><p className="legal-page__kicker">TERMS OF SERVICE</p><h1>Simple terms for language and conversation.</h1><p className="legal-page__meta">Effective 24 July 2026</p>
    <section><h2>The Services</h2><p>These terms cover Mila at mila.purangpt.com for structured language learning, Gia at gia.purangpt.com for text-and-voice AI conversation, and Mia at mia.purangpt.com for public travel-language scene creation and cultural context. Each has its own product experience; they share related infrastructure and are called the Services here. AI-generated scenes, conversation, and feedback can be wrong and are not professional advice, certification, or a guaranteed learning outcome.</p></section>
    <section><h2>Accounts</h2><p>Mila and Gia may begin with an isolated guest profile. A registered account lets learning progress or conversation history follow you across devices. Mia’s public Scene Studio does not require an account. Keep your password private and give accurate account information.</p></section>
    <section><h2>Mila Free and Mila Pro</h2><p>Mila Free includes the core learning journey. Mila Pro is currently a one-time 30-day access pass. It does not renew automatically, and no recurring charge is created. The exact price and included features are shown before checkout.</p></section>
    <section><h2>Payments</h2><p>YooKassa hosts checkout and processes available payment methods. Mila does not receive or store full card details. Pro activates only after Mila verifies the payment directly with the processor. Taxes, receipts, and payment-method availability depend on the merchant agreement and applicable law.</p></section>
    <section><h2>Fair use</h2><p>Do not abuse the Services, automate excessive requests, interfere with other users, attempt unauthorized access, or use the Services to create unlawful content. Access may be limited or suspended to protect the Services and their users.</p></section>
    <section><h2>Availability and changes</h2><p>Internet, microphone, model, and regional availability can affect individual features. The Services may improve or replace features, but will not silently shorten an already activated 30-day Pro period.</p></section>
    <section><h2>Contact</h2><p>Questions: <a href="mailto:fcpuru95@gmail.com">fcpuru95@gmail.com</a>. Privacy is covered by the <a href="/privacy">Privacy Policy</a>. Mila payment issues are covered by the <a href="https://mila.purangpt.com/refunds">Refund and payment policy</a>.</p></section>
    <section className="legal-page__note"><h2>Коротко по-русски</h2><p>Условия распространяются на Mila, Gia и Mia. Основные функции доступны бесплатно. Mila Pro — разовый доступ на 30 дней без автопродления. Оплата активирует Pro только после подтверждения ЮKassa. Аккаунт и учебные данные можно удалить в разделе «Аккаунт».</p></section>
  </article></AppMain></AppShell>;
}
