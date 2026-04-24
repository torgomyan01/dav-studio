'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { requestPasswordReset } from '@/app/actions/password-reset';
import { routes } from '@/utils/consts';
import { maskPhoneInput } from '@/utils/phone';

export function ForgotPasswordForm() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await requestPasswordReset(phone);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      router.push(`${routes.resetPassword}?token=${encodeURIComponent(res.token)}`);
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-sm space-y-5 rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm"
    >
      <div className="space-y-1 text-center">
        <div className="flex justify-center">
          <span className="fa-solid fa-key text-4xl text-[var(--color-green)]" aria-hidden />
        </div>
        <h1 className="text-xl font-semibold text-neutral-900">Գաղտնաբառի վերականգնում</h1>
        <p className="text-sm text-neutral-500">
          Մուտքագրեք ձեր հեռախոսահամարը։ Հաջորդ քայլում կկարողանաք ընտրել նոր գաղտնաբառ։
        </p>
      </div>

      <label className="block">
        <span className="mb-1.5 flex items-center gap-2 text-sm font-medium text-neutral-700">
          <span className="fa-solid fa-mobile-screen-button text-neutral-400" aria-hidden />
          Հեռախոսահամար
        </span>
        <input
          name="phone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          required
          value={phone}
          onChange={(e) => setPhone(maskPhoneInput(e.target.value))}
          placeholder="094 943 389"
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
        {pending ? 'Ուղարկում…' : 'Շարունակել'}
      </button>

      <p className="text-center text-sm">
        <Link href={routes.home} className="text-[var(--color-green)] underline-offset-2 hover:underline">
          ← Վերադառնալ մուտք
        </Link>
      </p>
    </form>
  );
}
