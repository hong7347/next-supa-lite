// src/app/api/listings/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// 단건 조회
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from('listings')
      .select('*')
      .eq('id', params.id)
      .single();
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 404 });
  }
}

// 수정
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { data, error } = await getSupabaseAdmin()
      .from('listings')
      .update(body)
      .eq('id', params.id)
      .select('*')
      .single();
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

// 삭제
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await getSupabaseAdmin()
      .from('listings')
      .delete()
      .eq('id', params.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
