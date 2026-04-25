'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { createUser } from '@/app/actions/users';
import { maskPhoneInput } from '@/utils/phone';

type UserRole = 'ADMIN' | 'MANAGER' | 'WORKER';

const roleValues: UserRole[] = ['ADMIN', 'MANAGER', 'WORKER'];

const roleLabels: Record<UserRole, string> = {
  ADMIN: 'Ադմին',
  MANAGER: 'Մենեջեր',
  WORKER: 'Աշխատող',
};

export function UserCreateForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('WORKER');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setMessage(null);
    setError(null);

    try {
      const res = await createUser({ name, phone, password, role });
      if (!res.ok) {
        setError(res.message);
        return;
      }

      setMessage(res.message);
      setName('');
      setPhone('');
      setPassword('');
      setRole('WORKER');
      router.refresh();
    } catch {
      setError('Օգտատեր ավելացնելու ժամանակ սխալ առաջացավ։ Խնդրում ենք փորձել կրկին։');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
      <div className="mb-4">
        <p className="text-sm font-semibold text-neutral-900">Ավելացնել նոր օգտատեր</p>
        <p className="mt-1 text-xs text-neutral-500">
          Աշխատակիցը մուտք կգործի հեռախոսահամարով և գաղտնաբառով։
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-neutral-700">Անուն</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Օր․ Արման"
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none ring-green transition focus:border-green focus:ring-2"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-neutral-700">Հեռախոսահամար</span>
          <input
            value={phone}
            onChange={(e) => setPhone(maskPhoneInput(e.target.value))}
            required
            inputMode="tel"
            placeholder="094 943 389"
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none ring-green transition focus:border-green focus:ring-2"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-neutral-700">Գաղտնաբառ</span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            type="password"
            placeholder="Առնվազն 6 նիշ"
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none ring-green transition focus:border-green focus:ring-2"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-neutral-700">Դեր</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none ring-green transition focus:border-green focus:ring-2"
          >
            {roleValues.map((value) => (
              <option key={value} value={value}>
                {roleLabels[value]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="mt-3 text-sm text-green">{message}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-4 w-full rounded-xl bg-green px-4 py-3 text-sm font-semibold text-white transition hover:bg-green/90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {pending ? 'Ավելացվում է…' : 'Ավելացնել օգտատեր'}
      </button>
    </form>
  );
}
