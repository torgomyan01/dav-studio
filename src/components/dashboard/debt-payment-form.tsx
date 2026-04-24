'use client';

import { useState } from 'react';

import { addDebtPayment } from '@/app/actions/debts';

export function DebtPaymentForm({
  debtId,
  maxAmount,
}: {
  debtId: string;
  maxAmount: number;
}) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await addDebtPayment({ debtId, amount, note });
      if (!res.ok) {
        setError(res.message);
        return;
      }
      setAmount('');
      setNote('');
      setOpen(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setError(null);
        }}
        className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-100"
      >
        {open ? 'Փակել' : 'Ավելացնել մարում'}
      </button>

      {open ? (
        <form onSubmit={onSubmit} className="grid gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-2">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            step="0.01"
            min="0.01"
            max={maxAmount}
            placeholder={`Մինչև ${maxAmount.toLocaleString('hy-AM')} դրամ`}
            className="w-full rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-xs text-neutral-900 outline-none ring-green transition focus:border-green focus:ring-2"
            required
          />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Նշում (ոչ պարտադիր)"
            className="w-full rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-xs text-neutral-900 outline-none ring-green transition focus:border-green focus:ring-2"
          />
          {error ? (
            <p className="rounded-md bg-red-50 px-2 py-1 text-xs text-red-700" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-green px-2.5 py-1.5 text-xs font-medium text-cream transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? 'Պահպանում…' : 'Պահպանել մարումը'}
          </button>
        </form>
      ) : null}
    </div>
  );
}
