'use client';

import { useMemo, useState } from 'react';

import { createAccessorySale } from '@/app/actions/accessory-sales';

type AccessoryOption = {
  id: string;
  name: string;
  quantity: number;
};

export function AccessorySaleForm({ accessories }: { accessories: AccessoryOption[] }) {
  const [accessoryId, setAccessoryId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitSalePrice, setUnitSalePrice] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const selected = useMemo(
    () => accessories.find((a) => a.id === accessoryId) ?? null,
    [accessories, accessoryId],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setPending(true);
    try {
      const res = await createAccessorySale({ accessoryId, quantity, unitSalePrice });
      if (!res.ok) {
        setError(res.message);
        return;
      }
      setMessage(res.message);
      setAccessoryId('');
      setQuantity('');
      setUnitSalePrice('');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
      <h3 className="text-base font-semibold text-neutral-900">Նոր վաճառք</h3>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-neutral-700">Ակսեսուար</span>
        <select
          value={accessoryId}
          onChange={(e) => setAccessoryId(e.target.value)}
          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-neutral-900 outline-none ring-green transition focus:border-green focus:ring-2"
          required
        >
          <option value="">Ընտրեք ակսեսուարը</option>
          {accessories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} (մնացորդ՝ {item.quantity})
            </option>
          ))}
        </select>
      </label>

      {selected ? <p className="text-xs text-neutral-500">Ընտրված ապրանքի մնացորդ՝ {selected.quantity} հատ</p> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-neutral-700">Վաճառված քանակ</span>
          <input
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            type="number"
            min="1"
            step="1"
            placeholder="Օրինակ՝ 2"
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-neutral-900 outline-none ring-green transition focus:border-green focus:ring-2"
            required
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-neutral-700">Վաճառքի գին (մեկ հատ)</span>
          <input
            value={unitSalePrice}
            onChange={(e) => setUnitSalePrice(e.target.value)}
            type="number"
            min="0"
            step="0.01"
            placeholder="Օրինակ՝ 7000"
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-neutral-900 outline-none ring-green transition focus:border-green focus:ring-2"
            required
          />
        </label>
      </div>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {message ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700" role="status">
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-green py-2.5 text-sm font-medium text-cream transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? 'Պահպանում…' : 'Գրանցել վաճառքը'}
      </button>
    </form>
  );
}
