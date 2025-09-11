'use client';
import { useEffect, useMemo, useState } from 'react';
import { m2ToPy, pyToM2, formatPhoneKR } from '@/lib/utils';

type Listing = {
  id: string;
  title: string;
  address?: string;
  area_m2?: number;
  area_py?: number;
  deposit?: number;
  rent?: number;
  contact_phone?: string;
  image_url?: string | null; // ← 추가
  created_at: string;
};


export default function Home() {
  const [q, setQ] = useState('');
  const [minPy, setMinPy] = useState('');
  const [maxPy, setMaxPy] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [items, setItems] = useState<Listing[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(count / perPage)),
    [count, perPage]
  );

  async function fetchList(p = page) {
  setLoading(true);
  try {
    const params = new URLSearchParams({ page: String(p), perPage: String(perPage) });
    if (q) params.set('q', q);
    if (minPy) params.set('minPy', minPy);
    if (maxPy) params.set('maxPy', maxPy);

    const res = await fetch(`/api/listings?${params.toString()}`, { cache: 'no-store' });
    const ct = res.headers.get('content-type') || '';
    const json = ct.includes('application/json') ? await res.json() : await res.text();

    if (!res.ok) {
      alert((json as any)?.error || (typeof json === 'string' ? json : '목록 조회 실패'));
      return;
    }

    // 필요하면 여기서 디버그
    // console.log('first', (json as any).data?.[0]);

    setItems((json as any).data || []);
    setCount((json as any).count || 0);
  } catch (e) {
    console.error(e);
    alert('네트워크 오류');
  } finally {
    setLoading(false);
  }
}



  useEffect(() => { setPage(1); fetchList(1); }, [q, minPy, maxPy, perPage]);
  useEffect(() => { fetchList(page); }, [page]);

  // 면적 변환 데모
  const [inputM2, setInputM2] = useState('');
  const [inputPy, setInputPy] = useState('');

  useEffect(() => {
    if ((document.activeElement as HTMLElement)?.id === 'inputPy') return;
    const v = parseFloat(inputM2);
    setInputPy(!isNaN(v) ? String(m2ToPy(v) ?? '') : '');
  }, [inputM2]);

  useEffect(() => {
    if ((document.activeElement as HTMLElement)?.id === 'inputM2') return;
    const v = parseFloat(inputPy);
    setInputM2(!isNaN(v) ? String(pyToM2(v) ?? '') : '');
  }, [inputPy]);

  return (
    <main style={{ padding: 16, maxWidth: 980, margin: '0 auto', fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>매물 목록</h1>

      <section style={{ display: 'grid', gap: 8, gridTemplateColumns: '2fr 1fr 1fr 1fr' }}>
        <input placeholder="검색어(제목/주소)" value={q} onChange={(e) => setQ(e.target.value)} />
        <input placeholder="최소 평" value={minPy} onChange={(e) => setMinPy(e.target.value.replace(/[^\d.]/g, ''))} />
        <input placeholder="최대 평" value={maxPy} onChange={(e) => setMaxPy(e.target.value.replace(/[^\d.]/g, ''))} />
        <select value={perPage} onChange={(e) => setPerPage(parseInt(e.target.value))}>
          <option value={5}>5개</option>
          <option value={10}>10개</option>
          <option value={20}>20개</option>
          <option value={50}>50개</option>
        </select>
      </section>

      <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={() => { setPage(1); fetchList(1); }}>검색</button>
        {loading && <span>불러오는 중…</span>}
      </div>

      <hr style={{ margin: '16px 0' }} />

      <section>
       <table width="100%" cellPadding={8} style={{ borderCollapse: 'collapse', marginTop: 16 }}>
  <thead>
    <tr style={{ background: '#fafafa' }}>
      <th align="left">제목</th>
      <th align="left">주소</th>
      <th align="right">면적(㎡/평)</th>
      <th align="right">보증금</th>
      <th align="right">월세</th>
      <th align="left">연락처</th>
      <th align="left">등록일</th>
      <th align="left">사진</th>
    </tr>
  </thead>

  <tbody>
    {items.map((it) => (
      <tr key={it.id} style={{ borderTop: '1px solid #eee' }}>
        <td>{it.title}</td>
        <td>{it.address || '-'}</td>
        <td align="right">{it.area_m2 ?? '-'} / {it.area_py ?? '-'}</td>
        <td align="right">{it.deposit?.toLocaleString?.() ?? '-'}</td>
        <td align="right">{it.rent?.toLocaleString?.() ?? '-'}</td>
        <td>{formatPhoneKR(it.contact_phone || '')}</td>
        <td>{new Date(it.created_at).toLocaleDateString()}</td>
        <td>{it.image_url ? <img src={it.image_url} style={{ height: 36, display: 'block' }} /> : '-'}</td>
      </tr>
    ))}
    {!items.length && !loading && (
      <tr>
        <td colSpan={8} align="center" style={{ color: '#777', padding: 24 }}>검색 결과 없음</td>
      </tr>
    )}
  </tbody>
</table>


        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
          <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>이전</button>
          <span>{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>다음</button>
        </div>
      </section>

      <hr style={{ margin: '24px 0' }} />

      <section>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>면적 자동 변환 (입력 데모)</h2>
        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}>
          <label>
            <div>제곱미터(㎡)</div>
            <input id="inputM2" value={inputM2} onChange={(e) => setInputM2(e.target.value.replace(/[^\d.]/g, ''))} />
          </label>
          <label>
            <div>평(py)</div>
            <input id="inputPy" value={inputPy} onChange={(e) => setInputPy(e.target.value.replace(/[^\d.]/g, ''))} />
          </label>
        </div>
        <p style={{ color: '#666', marginTop: 6 }}>둘 중 하나만 입력해도 자동으로 변환됩니다.</p>
      </section>
    </main>
  );
}
