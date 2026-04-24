'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';

import { completePasswordReset } from '@/app/actions/password-reset';
import { routes } from '@/utils/consts';

function ResetPasswordFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!token.trim()) {
      setError('Վերականգնման հղումը բացակայում է։');
      return;
    }
    setPending(true);
    try {
      const res = await completePasswordReset(token, password, passwordConfirm);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      router.push(`${routes.home}?reset=ok`);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  if (!token) {
    return (
      <div className="w-full max-w-sm space-y-4 rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center text-sm text-amber-900">
        <p>Վերականգնման թոքեն բացակայում է։</p>
        <Link href={routes.forgotPassword} className="font-medium text-[var(--color-green)] underline">
          Նորից փորձել
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-sm space-y-5 rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm"
    >
      <div className="space-y-1 text-center">
        <div className="flex justify-center">
          <span className="fa-solid fa-lock text-4xl text-[var(--color-green)]" aria-hidden />
        </div>
        <h1 className="text-xl font-semibold text-neutral-900">Նոր գաղտնաբառ</h1>
        <p className="text-sm text-neutral-500">Առնվազն 8 նիշ։</p>
      </div>

      <label className="block">
        <span className="mb-1.5 text-sm font-medium text-neutral-700">Նոր գաղտնաբառ</span>
        <input
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-neutral-900 outline-none ring-[var(--color-green)] transition focus:border-[var(--color-green)] focus:ring-2"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 text-sm font-medium text-neutral-700">Կրկնել գաղտնաբառը</span>
        <input
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-neutral-900 outline-none ring-[var(--color-green)] transition focus:border-[var(--color-green)] focus:ring-2"
        />
      </label>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-[var(--color-green)] py-2.5 text-sm font-medium text-[var(--color-cream)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? 'Պահպանում…' : 'Պահպանել'}
      </button>

      <p className="text-center text-sm">
        <Link href={routes.home} className="text-[var(--color-green)] underline-offset-2 hover:underline">
          ← Մուտք
        </Link>
      </p>
    </form>
  );
}

export function ResetPasswordForm() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
          Բեռնում…
        </div>
      }
    >
      <ResetPasswordFormInner />
    </Suspense>
  );
}
