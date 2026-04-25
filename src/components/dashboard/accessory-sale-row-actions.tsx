'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { deleteAccessorySale, updateAccessorySale } from '@/app/actions/accessory-sales';

type AccessoryOption = {
  id: string;
  name: string;
  quantity: number;
};

export function AccessorySaleRowActions({
  sale,
  accessories,
}: {
  sale: {
    id: string;
    accessoryId: string;
    quantity: number;
    unitSalePrice: string;
  };
  accessories: AccessoryOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [accessoryId, setAccessoryId] = useState(sale.accessoryId);
  const [quantity, setQuantity] = useState(String(sale.quantity));
  const [unitSalePrice, setUnitSalePrice] = useState(sale.unitSalePrice);
  const [pending, setPending] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = accessories.find((item) => item.id === accessoryId) ?? null;
  const availableQuantity = selected
    ? selected.quantity + (selected.id === sale.accessoryId ? sale.quantity : 0)
    : null;

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await updateAccessorySale({
        saleId: sale.id,
        accessoryId,
        quantity,
        unitSalePrice,
      });
      if (!res.ok) {
        setError(res.message);
        return;
      }
      setError(null);
      setOpen(false);
      router.refresh();
    } catch {
      setError('Թարմացման ժամանակ սխալ առաջացավ։ Խնդրում ենք փորձել կրկին։');
    } finally {
      setPending(false);
    }
  }

  async function onDelete() {
    const ok = window.confirm('Վստա՞հ եք, որ ցանկանում եք ջնջել այս վաճառքը։');
    if (!ok) return;
    setError(null);
    setDeletePending(true);
    try {
      const res = await deleteAccessorySale(sale.id);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      setError(null);
      router.refresh();
    } catch {
      setError('Ջնջման ժամանակ սխալ առաջացավ։ Խնդրում ենք փորձել կրկին։');
    } finally {
      setDeletePending(false);
    }
  }

  return (
    <>
      <div className="col-span-full space-y-1 md:col-span-2">
        <div className="flex items-center gap-2 md:justify-end">
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
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 px-3 py-5">
          <div className="max-h-full w-full max-w-xl overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-4 shadow-xl sm:p-8">
            <div className="mb-4 flex items-start justify-between gap-3 border-b border-neutral-200 pb-3">
              <div>
                <h3 className="text-base font-semibold text-neutral-900">Փոփոխել վաճառքը</h3>
                <p className="mt-1 text-sm text-neutral-500">Թարմացրեք վաճառքի տվյալները։</p>
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

              {availableQuantity !== null ? (
                <p className="rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-500">
                  Այս փոփոխության համար հասանելի է՝ {availableQuantity} հատ
                </p>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-neutral-700">Վաճառված քանակ</span>
                  <input
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    type="number"
                    min="1"
                    step="1"
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
