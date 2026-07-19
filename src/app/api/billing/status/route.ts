import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { billingStatus, publicBillingCatalog } from '@/lib/billingStore';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await authenticate(request);
  const userId = Number(session?.sub);
  if (!session || !Number.isSafeInteger(userId) || userId <= 0) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const status = await billingStatus(userId, request.nextUrl.searchParams.get('purchase'));
  return NextResponse.json({ ...status, catalog: publicBillingCatalog() }, { headers: { 'Cache-Control': 'no-store' } });
}
