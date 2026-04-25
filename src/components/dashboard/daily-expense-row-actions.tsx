'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { deleteDailyExpense, updateDailyExpense } from '@/app/actions/expenses';

export function DailyExpenseRowActions({
  expense,
}: {
  expense: {
    id: string;
    title: string;
    amount: string;
    description: string;
    spentAt: string;
  };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(expense.title);
  const [amount, setAmount] = useState(expense.amount);
  const [description, setDescription] = useState(expense.description);
  const [spentAt, setSpentAt] = useState(expense.spentAt);
  const [pending, setPending] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await updateDailyExpense({ id: expense.id, title, amount, description, spentAt });
      if (!res.ok) {
        setError(res.message);
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError('Թարմացման ժամանակ սխալ առաջացավ։ Խնդրում ենք փորձել կրկին։');
    } finally {
      setPending(false);
    }
  }

  async function onDelete() {
    const ok = window.confirm('Վստա՞հ եք, որ ցանկանում եք ջնջել այս ծախսը։');
    if (!ok) return;
    setError(null);
    setDeletePending(true);
    try {
      const res = await deleteDailyExpense(expense.id);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      router.refresh();
    } catch {
      setError('Ջնջման ժամանակ սխալ առաջացավ։ Խնդրում ենք փորձել կրկին։');
    } finally {
      setDeletePending(false);
    }
  }

  return (
    <>
      <div className="col-span-3 space-y-1">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setOpen(true)}
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
        {!open && error ? (
          <p className="text-right text-xs text-red-700" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-xl rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl sm:p-8">
            <div className="mb-4 flex items-start justify-between gap-3 border-b border-neutral-200 pb-3">
              <div>
                <h3 className="text-base font-semibold text-neutral-900">Փոփոխել ծախսը</h3>
                <p className="mt-1 text-sm text-neutral-500">Թարմացրեք ծախսի տվյալները։</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100"
              >
                <span className="fa-solid fa-xmark" aria-hidden />
              </button>
            </div>

            <form onSubmit={onSave} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-neutral-700">Ծախսի անվանում</span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-neutral-900 outline-none ring-green transition focus:border-green focus:ring-2"
                  required
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-neutral-700">Գումար</span>
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    type="number"
                    min="0.01"
                    step="0.01"
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-neutral-900 outline-none ring-green transition focus:border-green focus:ring-2"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-neutral-700">Ամսաթիվ</span>
                  <input
                    value={spentAt}
                    onChange={(e) => setSpentAt(e.target.value)}
                    type="date"
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-neutral-900 outline-none ring-green transition focus:border-green focus:ring-2"
                    required
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-neutral-700">Նկարագրություն</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-neutral-900 outline-none ring-green transition focus:border-green focus:ring-2"
                />
              </label>

              {error ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                  {error}
                </p>
              ) : null}

              <div className="flex flex-wrap justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-800 hover:bg-neutral-100"
                >
                  Փակել
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-lg bg-green px-4 py-2 text-sm font-medium text-cream transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pending ? 'Պահպանում…' : 'Պահպանել'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
