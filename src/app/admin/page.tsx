'use client';

import { useEffect, useState } from 'react';
import { formatPhoneKR, m2ToPy, pyToM2 } from '@/lib/utils';

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────
type Listing = {
  id?: string;
  title: string;
  address?: string | null;
  area_m2?: number | null;
  area_py?: number | null;
  deposit?: number | null;
  rent?: number | null;
  contact_phone?: string | null;
  image_url?: string | null;
  created_at?: string;
};

// ──────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────
export default function Admin() {
  const [list, setList] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Listing | null>(null);

  // 초기 로드
  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch('/api/listings?perPage=100', { cache: 'no-store' });
      const json = await res.json();
      setList(json.data || []);
    } catch (e) {
      console.error(e);
      alert('목록 불러오기 실패');
    } finally {
      setLoading(false);
    }
  }

  function newBlank(): Listing {
    return {
      title: '',
      address: '',
      area_m2: null,
      area_py: null,
      deposit: null,
      rent: null,
      contact_phone: '',
      image_url: null,
    };
  }

  // ──────────────────────────────────────────────────────────
  // Handlers: 면적 동기화 입력
  // ──────────────────────────────────────────────────────────
  function setAreaM2(v: string) {
    const val = parseFloat(v);
    setEditing(prev => {
      if (!prev) return prev;
      const area_m2 = isNaN(val) ? null : val;
      return {
        ...prev,
        area_m2,
        area_py: area_m2 != null ? m2ToPy(area_m2) ?? null : null,
      };
    });
  }
  function setAreaPy(v: string) {
    const val = parseFloat(v);
    setEditing(prev => {
      if (!prev) return prev;
      const area_py = isNaN(val) ? null : val;
      return {
        ...prev,
        area_py,
        area_m2: area_py != null ? pyToM2(area_py) ?? null : null,
      };
    });
  }

  // ──────────────────────────────────────────────────────────
  // 파일 업로드 → /api/uploads
  // ──────────────────────────────────────────────────────────
  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f || !editing) return;
    try {
      const form = new FormData();
      form.append('file', f);

      const res = await fetch('/api/uploads', { method: 'POST', body: form });
      const ct = res.headers.get('content-type') || '';
      const body = ct.includes('application/json') ? await res.json() : await res.text();

      if (!res.ok) {
        const msg =
          (typeof body === 'object' && body?.error) ||
          (typeof body === 'string' && body) ||
          `업로드 실패 (HTTP ${res.status})`;
        alert(msg);
        return;
      }

      const url = (body as any).url as string;
      setEditing(prev => (prev ? { ...prev, image_url: url } : prev));
    } catch (err: any) {
      console.error(err);
      alert('업로드 에러');
    }
  }

  // ──────────────────────────────────────────────────────────
  // 저장(등록/수정) & 삭제
  // ──────────────────────────────────────────────────────────
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;

    const payload: Listing = {
      ...editing,
      // 숫자 필드 정규화
      area_m2: editing.area_m2 ?? null,
      area_py: editing.area_py ?? null,
      deposit: editing.deposit ?? null,
      rent: editing.rent ?? null,
      contact_phone: editing.contact_phone ?? null,
      address: editing.address ?? null,
      image_url: editing.image_url ?? null,
    };

    const isUpdate = Boolean(editing.id);
    const url = isUpdate ? `/api/listings/${editing.id}` : `/api/listings`;
    const method = isUpdate ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const ct = res.headers.get('content-type') || '';
    let body: any = null;
    try {
      body = ct.includes('application/json') ? await res.json() : await res.text();
    } catch {
      body = null;
    }

    if (!res.ok) {
      const msg =
        (body && typeof body === 'object' && (body.error || body.message)) ||
        (typeof body === 'string' && body.trim()) ||
        `저장 실패 (HTTP ${res.status})`;
      alert(msg);
      return;
    }

    setEditing(null);
    await refresh();
  }

  async function remove(id: string) {
    if (!confirm('정말 삭제할까요?')) return;
    const res = await fetch(`/api/listings/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const t = await res.text();
      alert(t || '삭제 실패');
      return;
    }
    await refresh();
  }

  // ──────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────
  return (
    <main style={{ padding: 16, maxWidth: 980, margin: '0 auto', fontFamily: 'system-ui' }}>
      <h1>관리자: 매물 등록/수정/삭제</h1>

      <div style={{ margin: '8px 0' }}>
        <button onClick={() => setEditing(newBlank())}>+ 새 매물 등록</button>
        {loading && <span style={{ marginLeft: 8 }}>로딩…</span>}
      </div>

      {/* 목록 */}
      <table width="100%" cellPadding={8} style={{ borderCollapse: 'collapse', marginTop: 8 }}>
        <thead>
          <tr style={{ background: '#fafafa' }}>
            <th align="left">제목</th>
            <th align="left">주소</th>
            <th align="right">면적(㎡/평)</th>
            <th align="right">보증금</th>
            <th align="right">월세</th>
            <th align="left">연락처</th>
            <th>사진</th>
            <th>액션</th>
          </tr>
        </thead>
        <tbody>
          {list.map(it => (
            <tr key={it.id} style={{ borderTop: '1px solid #eee' }}>
              <td>{it.title}</td>
              <td>{it.address || '-'}</td>
              <td align="right">{it.area_m2 ?? '-'} / {it.area_py ?? '-'}</td>
              <td align="right">{it.deposit?.toLocaleString?.() ?? '-'}</td>
              <td align="right">{it.rent?.toLocaleString?.() ?? '-'}</td>
              <td>{formatPhoneKR(it.contact_phone || '')}</td>
              <td>{(it as any).image_url ? <img src={(it as any).image_url} style={{ height: 36 }} /> : '-'}</td>
              <td>
                <button onClick={() => setEditing(it)}>수정</button>{' '}
                <button onClick={() => remove(it.id!)}>삭제</button>
              </td>
            </tr>
          ))}
          {!list.length && !loading && (
            <tr><td colSpan={8} align="center" style={{ color: '#777', padding: 24 }}>데이터 없음</td></tr>
          )}
        </tbody>
      </table>

      {/* 편집/등록 폼 */}
      {editing && (
        <form onSubmit={onSubmit} style={{ marginTop: 16, padding: 12, border: '1px solid #ddd', borderRadius: 8 }}>
          <h3>{editing.id ? '매물 수정' : '새 매물 등록'}</h3>
          <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}>
            <label>제목
              <input
                value={editing.title}
                onChange={e => setEditing(prev => (prev ? { ...prev, title: e.target.value } : prev))}
                required
              />
            </label>
            <label>주소
              <input
                value={editing.address ?? ''}
                onChange={e => setEditing(prev => (prev ? { ...prev, address: e.target.value } : prev))}
              />
            </label>

            <label>면적 ㎡
              <input
                value={editing.area_m2 ?? ''}
                onChange={e => setAreaM2(e.target.value.replace(/[^\d.]/g, ''))}
              />
            </label>
            <label>면적 평
              <input
                value={editing.area_py ?? ''}
                onChange={e => setAreaPy(e.target.value.replace(/[^\d.]/g, ''))}
              />
            </label>

            <label>보증금
              <input
                value={editing.deposit ?? ''}
                onChange={e =>
                  setEditing(prev => (prev
                    ? { ...prev, deposit: e.target.value ? Number(e.target.value.replace(/\D/g, '')) : null }
                    : prev))
                }
              />
            </label>
            <label>월세
              <input
                value={editing.rent ?? ''}
                onChange={e =>
                  setEditing(prev => (prev
                    ? { ...prev, rent: e.target.value ? Number(e.target.value.replace(/\D/g, '')) : null }
                    : prev))
                }
              />
            </label>

            <label>연락처
              <input
                value={editing.contact_phone ?? ''}
                onChange={e => setEditing(prev => (prev ? { ...prev, contact_phone: e.target.value } : prev))}
                placeholder="01012345678"
              />
            </label>

            {/* 이미지 업로드 + 미리보기 */}
            <label>대표 이미지
              <input type="file" accept="image/*" onChange={onFileChange} />
            </label>
            <label>미리보기
              <div style={{ height: 80 }}>
                {editing.image_url ? (
                  <img src={editing.image_url} style={{ height: 80 }} />
                ) : (
                  <span style={{ color: '#888' }}>없음</span>
                )}
              </div>
            </label>
          </div>

          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button type="submit">{editing.id ? '수정 저장' : '등록'}</button>
            <button type="button" onClick={() => setEditing(null)}>취소</button>
          </div>
        </form>
      )}
    </main>
  );
}
