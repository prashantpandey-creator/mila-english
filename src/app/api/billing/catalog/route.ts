import { NextResponse } from 'next/server';
import { publicBillingCatalog } from '@/lib/billingStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(publicBillingCatalog(), {
    headers: { 'Cache-Control': 'no-store' },
  });
}
