// src/app/api/uploads/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOW = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function GET() {
  return NextResponse.json({ ok: true, method: 'GET /api/uploads' });
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY on server' }, { status: 500 });
    }

    const form = await req.formData().catch(() => null);
    if (!form) return NextResponse.json({ error: 'form-data required' }, { status: 400 });

    const file = form.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'file field is required' }, { status: 400 });

    if (!ALLOW.has(file.type)) {
      return NextResponse.json({ error: 'Only JPG/PNG/WEBP allowed' }, { status: 415 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 413 });
    }

    const ext = file.type.split('/')[1] || 'jpg';
    const key = `public/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    const supabase = getSupabaseAdmin();
    // Supabase SDK가 File/Blob을 받으므로 그대로 넘겨도 됩니다.
    const { error: upErr } = await supabase.storage
      .from('listings')
      .upload(key, file, { contentType: file.type, upsert: false });

    if (upErr) {
      console.error('[upload] storage error', upErr);
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    const { data } = supabase.storage.from('listings').getPublicUrl(key);
    return NextResponse.json({ url: data.publicUrl, path: key });
  } catch (err: any) {
    console.error('[upload] unhandled', err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
