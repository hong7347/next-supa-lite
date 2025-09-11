import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    cwd: process.cwd(),
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasAnon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasSRK: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    srkLen: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
  });
}
