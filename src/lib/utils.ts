// src/lib/utils.ts
export const M2_PER_PY = 3.305785; // 1평 = 3.305785㎡

export function m2ToPy(m2?: number | null) {
  if (m2 == null) return undefined;
  return Math.round((m2 / M2_PER_PY) * 100) / 100;
}

export function pyToM2(py?: number | null) {
  if (py == null) return undefined;
  return Math.round((py * M2_PER_PY) * 100) / 100;
}

// 한국 전화번호 하이픈 포맷 (10~11자리 + 02 특례)
export function formatPhoneKR(input?: string | null) {
  if (!input) return '';
  const digits = (input + '').replace(/\D/g, '');
  if (digits.length === 11) return digits.replace(/^(\d{3})(\d{4})(\d{4})$/, '$1-$2-$3');
  if (digits.length === 10) {
    if (digits.startsWith('02')) return digits.replace(/^(02)(\d{4})(\d{4})$/, '$1-$2-$3');
    return digits.replace(/^(\d{3})(\d{3,4})(\d{4})$/, '$1-$2-$3');
  }
  if (digits.length === 9 && digits.startsWith('02')) return digits.replace(/^(02)(\d{3})(\d{4})$/, '$1-$2-$3');
  return input; // 그 외(국제/내선)는 원본 유지
}
