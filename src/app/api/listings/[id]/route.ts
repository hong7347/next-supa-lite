// src/app/api/listings/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
type Listing = {
  id: string;
  title: string;
  address: string;
  area_m2: number;
  area_py: number;
  deposit: number;
  rent: number;
  contact_phone: string;
  image_url?: string | null;
  created_at: string;
};
type PartialListing = Partial<Listing>;

// (선택) 단건 조회
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }   // 👈 Promise 로 받기
) {
  try {
    const { id } = await context.params;         // 👈 await 해서 값 꺼내기
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// 수정
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = (await req.json()) as PartialListing;

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('listings').update(body).eq('id', id);

    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// 삭제
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = getSupabaseAdmin();

    const { error } = await supabase.from('listings').delete().eq('id', id);
    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
