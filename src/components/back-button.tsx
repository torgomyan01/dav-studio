'use client';

import { useRouter } from 'next/navigation';

export function BackButton({ fallbackHref = '/dashboard' }: { fallbackHref?: string }) {
  const router = useRouter();

  function goBack() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  }

  return (
    <button
      type="button"
      onClick={goBack}
      className="mb-3 inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 shadow-sm transition hover:border-green/30 hover:bg-green/5 hover:text-green"
    >
      <span className="fa-solid fa-arrow-left text-xs" aria-hidden />
      Հետ գնալ
    </button>
  );
}
