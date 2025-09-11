import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Next + Supabase 라이트판',
  description: '검색/페이지네이션/면적변환/연락처 포맷 포함 라이트 샘플',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
