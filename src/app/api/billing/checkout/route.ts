import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { beginCheckout } from '@/lib/billingStore';
import { BillingError } from '@/lib/billing';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const session = await authenticate(request);
  const userId = Number(session?.sub);
  if (!session || !Number.isSafeInteger(userId) || userId <= 0) {
    return NextResponse.json({ error: 'Sign in to continue.', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  try {
    const purchase = await beginCheckout({
      userId,
      productCode: body?.productCode,
      requestOrigin: request.nextUrl.origin,
    });
    return NextResponse.json({ purchaseId: purchase.id, checkoutUrl: purchase.checkoutUrl });
  } catch (error) {
    if (error instanceof BillingError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    console.error('Could not create Mila checkout', error);
    return NextResponse.json({ error: 'The payment page could not open. Try again.', code: 'CHECKOUT_FAILED' }, { status: 502 });
  }
}
