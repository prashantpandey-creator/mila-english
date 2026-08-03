import type { Metadata } from 'next';
import { AppHeader, AppMain, AppShell } from '@/components/ui/AppShell';

export const metadata: Metadata = { title: 'Payments and Refunds — Mila', description: 'How Mila Pro payments, access, and refund requests work.' };

export default function RefundsPage() {
  return <AppShell className="legal-page"><AppHeader backHref="/pricing" title="Payments and refunds" eyebrow="Mila · billing" /><AppMain width="work" className="legal-page__main"><article className="legal-page__article"><p className="legal-page__kicker">PAYMENT POLICY</p><h1>No hidden renewal.</h1><p className="legal-page__meta">Effective 19 July 2026</p>
    <section><h2>What you buy</h2><p>Mila Pro is a one-time 30-day access pass at the price displayed on the Pricing page. The period starts only after the payment processor confirms a successful payment. It does not renew automatically, so there is nothing to cancel.</p></section>
    <section><h2>If payment is pending or fails</h2><p>A browser return is never treated as proof of payment. If a bank is still processing the charge, Account may show verification in progress. Failed or canceled payments do not activate Pro.</p></section>
    <section><h2>Refund requests</h2><p>Contact <a href="mailto:fcpuru95@gmail.com?subject=Mila%20payment%20help">Mila payment support</a> with the account email and payment date if you were charged twice, paid access did not activate, or a technical failure prevents us from delivering it. We will verify the processor record and either restore the purchased access or arrange the appropriate refund. Any mandatory consumer rights in your country continue to apply.</p></section>
    <section><h2>After a full refund</h2><p>A confirmed full refund ends the access created by that payment. Your account and free learning progress remain available unless you choose to delete them.</p></section>
    <section><h2>Card data and receipts</h2><p>YooKassa handles payment credentials. Mila stores only a payment identifier, amount, currency, status, and access period for reconciliation. Receipts and available payment methods are controlled by the connected merchant account.</p></section>
    <section className="legal-page__note"><h2>Коротко по-русски</h2><p>Pro покупается один раз на 30 дней и не продлевается автоматически. Если деньги списались дважды, Pro не активировался или услуга недоступна из-за технической ошибки, напишите в поддержку — мы проверим платёж и восстановим доступ или оформим подходящий возврат.</p></section>
  </article></AppMain></AppShell>;
}
