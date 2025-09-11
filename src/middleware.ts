import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith('/admin')) return NextResponse.next();

  const auth = req.headers.get('authorization') || '';
  const [scheme, encoded] = auth.split(' ');
  if (scheme !== 'Basic' || !encoded) {
    return new Response('Auth required', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Admin Area"' },
    });
  }

  // Basic auth decode (Edge 런타임: atob 사용)
  let user = '', pass = '';
  try {
    const decoded = atob(encoded);     // "user:pass"
    const i = decoded.indexOf(':');    // 첫 콜론 기준 분리
    user = decoded.slice(0, i);
    pass = decoded.slice(i + 1);
  } catch {
    return new Response('Bad auth header', { status: 400 });
  }

  // 환경변수 읽기 + 공백 제거
  const ENV_USER = (process.env.ADMIN_USER ?? '').trim();
  const ENV_PASS = (process.env.ADMIN_PASS ?? '').trim();

  // (선택) 길이 로그로만 확인 — 비밀값은 찍지 않음
  console.log('[mw] check', { path: pathname, uLen: user.length, eULen: ENV_USER.length, pLen: pass.length, ePLen: ENV_PASS.length });

  const ok = user === ENV_USER && pass === ENV_PASS;
  if (!ok) return new Response('Unauthorized', { status: 401 });

  return NextResponse.next();
}

export const config = { matcher: ['/admin/:path*'] };
