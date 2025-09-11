import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(req.url);

    const q = searchParams.get('q')?.trim() || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const perPage = Math.min(Math.max(1, parseInt(searchParams.get('perPage') || '10', 10)), 50);
    const minPy = Number(searchParams.get('minPy') || '') || undefined;
    const maxPy = Number(searchParams.get('maxPy') || '') || undefined;

    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    if (q) {
      const [byTitle, byAddr] = await Promise.all([
        getSupabaseAdmin().from('listings').select('*', { count: 'exact' })
          .ilike('title', `%${q}%`).order('created_at', { ascending: false }).range(from, to),
        getSupabaseAdmin().from('listings').select('*', { count: 'exact' })
          .ilike('address', `%${q}%`).order('created_at', { ascending: false }).range(from, to),
      ]);
      if (byTitle.error) throw byTitle.error;
      if (byAddr.error) throw byAddr.error;

      const merged = [...(byTitle.data || []), ...(byAddr.data || [])];
      const uniq = Array.from(new Map(merged.map((x: any) => [x.id, x])).values());

      let rows = uniq;
      if (minPy != null) rows = rows.filter((r: any) => r.area_py == null || r.area_py >= minPy);
      if (maxPy != null) rows = rows.filter((r: any) => r.area_py == null || r.area_py <= maxPy);

      return NextResponse.json({
        data: rows,
        count: Math.max(byTitle.count || 0, byAddr.count || 0),
        page, perPage
      });
    }

    let query = supabase.from('listings').select('*', { count: 'exact' })
      .order('created_at', { ascending: false }).range(from, to);
    if (minPy != null) query = query.gte('area_py', minPy);
    if (maxPy != null) query = query.lte('area_py', maxPy);

    const { data, error, count } = await query;
    if (error) throw error;
    return NextResponse.json({ data, count, page, perPage });
  } catch (err: any) {
    console.error('[GET /api/listings]', err?.message || err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

// CREATE
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();

    let body: any = undefined;
    try {
      body = await req.json();
    } catch {
      // body 없음
      return NextResponse.json({ error: 'Request body is required (JSON)' }, { status: 400 });
    }

    const payload = {
      title: String(body?.title ?? '').trim(),
      address: body?.address ? String(body.address) : null,
      area_m2: body?.area_m2 ?? null,
      area_py: body?.area_py ?? null,
      deposit: body?.deposit ?? null,
      rent: body?.rent ?? null,
      contact_phone: body?.contact_phone ? String(body.contact_phone) : null,
    };

    if (!payload.title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('listings')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      console.error('[POST /api/listings] supabase error:', error);
      return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err: any) {
    console.error('[POST /api/listings] unhandled:', err?.message || err);
    // ✅ 반드시 JSON으로 반환
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
