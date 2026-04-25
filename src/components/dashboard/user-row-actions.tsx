'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { deleteUser, updateUser } from '@/app/actions/users';
import { maskPhoneInput } from '@/utils/phone';

type UserRole = 'ADMIN' | 'MANAGER' | 'WORKER';

const roleValues: UserRole[] = ['ADMIN', 'MANAGER', 'WORKER'];

const roleLabels: Record<UserRole, string> = {
  ADMIN: 'Ադմին',
  MANAGER: 'Մենեջեր',
  WORKER: 'Աշխատող',
};

export function UserRowActions({
  user,
}: {
  user: {
    id: string;
    name: string;
    phone: string;
    role: UserRole;
  };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(maskPhoneInput(user.phone));
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(user.role);
  const [pending, setPending] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setPending(true);

    try {
      const res = await updateUser({ id: user.id, name, phone, password, role });
      if (!res.ok) {
        setError(res.message);
        return;
      }

      setMessage(res.message);
      setPassword('');
      setOpen(false);
      router.refresh();
    } catch {
      setError('Օգտատեր փոփոխելու ժամանակ սխալ առաջացավ։ Խնդրում ենք փորձել կրկին։');
    } finally {
      setPending(false);
    }
  }

  async function onDelete() {
    const ok = window.confirm('Վստա՞հ եք, որ ցանկանում եք ջնջել այս օգտատիրոջը։');
    if (!ok) return;

    setError(null);
    setMessage(null);
    setDeletePending(true);
    try {
      const res = await deleteUser(user.id);
      if (!res.ok) {
        setError(res.message);
        return;
      }

      router.refresh();
    } catch {
      setError('Օգտատեր ջնջելու ժամանակ սխալ առաջացավ։ Խնդրում ենք փորձել կրկին։');
    } finally {
      setDeletePending(false);
    }
  }

  return (
    <>
      <div className="col-span-full space-y-1 md:col-span-2">
        <div className="flex gap-2 md:justify-end">
          <button
            type="button"
            onClick={() => {
              setError(null);
              setMessage(null);
              setOpen(true);
            }}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-100"
          >
            Փոփոխել
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={deletePending}
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deletePending ? 'Ջնջվում…' : 'Ջնջել'}
          </button>
        </div>
        {!open && error ? <p className="text-xs text-red-700 md:text-right">{error}</p> : null}
        {!open && message ? <p className="text-xs text-green md:text-right">{message}</p> : null}
      </div>

      {open ? (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 px-3 py-5">
          <div className="max-h-full w-full max-w-xl overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-4 shadow-xl sm:p-8">
            <div className="mb-4 flex items-start justify-between gap-3 border-b border-neutral-200 pb-3">
              <div>
                <h3 className="text-base font-semibold text-neutral-900">Փոփոխել օգտատիրոջը</h3>
                <p className="mt-1 text-sm text-neutral-500">Թարմացրեք տվյալները և պահեք։</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-50"
              >
                Փակել
              </button>
            </div>

            <form onSubmit={onSave} className="space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-neutral-700">Անուն</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
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
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none ring-green transition focus:border-green focus:ring-2"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-neutral-700">Նոր գաղտնաբառ</span>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  type="password"
                  placeholder="Դատարկ թողեք, եթե չեք փոխում"
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

              {error ? <p className="text-sm text-red-700">{error}</p> : null}
              {message ? <p className="text-sm text-green">{message}</p> : null}

              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-xl bg-green px-4 py-3 text-sm font-semibold text-white transition hover:bg-green/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending ? 'Պահպանվում է…' : 'Պահպանել փոփոխությունները'}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
