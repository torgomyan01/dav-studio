'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { deleteRepairOrder, updateRepairOrder } from '@/app/actions/repairs';
import { maskPhoneInput } from '@/utils/phone';

export function RepairRowActions({
  repair,
}: {
  repair: {
    id: string;
    deviceName: string;
    customerName: string;
    customerPhone: string;
    expenses: string;
    netProfit: string;
    description: string;
    imageUrl: string | null;
  };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deviceName, setDeviceName] = useState(repair.deviceName);
  const [customerName, setCustomerName] = useState(repair.customerName);
  const [customerPhone, setCustomerPhone] = useState(repair.customerPhone);
  const [expenses, setExpenses] = useState(repair.expenses);
  const [totalValue, setTotalValue] = useState(
    String(Number(repair.expenses) + Number(repair.netProfit)),
  );
  const [description, setDescription] = useState(repair.description);
  const [removeImage, setRemoveImage] = useState(false);
  const [newImage, setNewImage] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expensesNumber = Number(expenses);
  const totalValueNumber = Number(totalValue);
  const hasNumbers = Number.isFinite(expensesNumber) && Number.isFinite(totalValueNumber);
  const netProfitValue = hasNumbers ? totalValueNumber - expensesNumber : null;

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (netProfitValue === null) {
      setError('Լրացրեք ծախսը և ընդհանուր արժեքը ճիշտ թվերով։');
      return;
    }

    setPending(true);
    try {
      const formData = new FormData();
      formData.set('id', repair.id);
      formData.set('deviceName', deviceName);
      formData.set('customerName', customerName);
      formData.set('customerPhone', customerPhone);
      formData.set('expenses', expenses);
      formData.set('netProfit', String(netProfitValue));
      formData.set('description', description);
      if (removeImage) formData.set('removeImage', '1');
      if (newImage) formData.set('image', newImage);

      const res = await updateRepairOrder(formData);
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
    const ok = window.confirm('Վստա՞հ եք, որ ցանկանում եք ջնջել այս պատվերը։');
    if (!ok) return;

    setError(null);
    setDeletePending(true);
    try {
      const res = await deleteRepairOrder(repair.id);
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
        <div className="flex flex-wrap gap-2 md:justify-end">
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
          <div className="max-h-full w-full max-w-2xl overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-4 shadow-xl sm:p-8">
            <div className="mb-4 flex items-start justify-between gap-3 border-b border-neutral-200 pb-3">
              <div>
                <h3 className="text-base font-semibold text-neutral-900">Փոփոխել վերանորոգման պատվերը</h3>
                <p className="mt-1 text-sm text-neutral-500">Թարմացրեք տվյալները և պահեք։</p>
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
                <span className="mb-1.5 block text-sm font-medium text-neutral-700">Տեխնիկայի անվանում</span>
                <input
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-neutral-900 outline-none ring-green transition focus:border-green focus:ring-2"
                  required
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-neutral-700">Հաճախորդի անուն</span>
                  <input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-neutral-900 outline-none ring-green transition focus:border-green focus:ring-2"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-neutral-700">Հաճախորդի հեռախոս</span>
                  <input
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(maskPhoneInput(e.target.value))}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-neutral-900 outline-none ring-green transition focus:border-green focus:ring-2"
                    required
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-neutral-700">Ընդհանուր արժեք</span>
                  <input
                    value={totalValue}
                    onChange={(e) => setTotalValue(e.target.value)}
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-neutral-900 outline-none ring-green transition focus:border-green focus:ring-2"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-neutral-700">Ծախս</span>
                  <input
                    value={expenses}
                    onChange={(e) => setExpenses(e.target.value)}
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-neutral-900 outline-none ring-green transition focus:border-green focus:ring-2"
                    required
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-neutral-700">Մաքուր շահույթ</span>
                <input
                  value={netProfitValue === null ? '' : netProfitValue}
                  readOnly
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-100 px-3 py-2.5 text-neutral-900"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-neutral-700">Նկարագրություն</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-neutral-900 outline-none ring-green transition focus:border-green focus:ring-2"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-neutral-700">Նոր նկար (ոչ պարտադիր)</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={(e) => setNewImage(e.target.files?.[0] ?? null)}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none ring-green transition file:mr-3 file:rounded-md file:border-0 file:bg-neutral-100 file:px-2.5 file:py-1.5 file:text-xs file:font-medium file:text-neutral-700 hover:file:bg-neutral-200 focus:border-green focus:ring-2"
                />
              </label>

              <label className="flex items-center gap-2 text-sm text-neutral-700">
                <input
                  type="checkbox"
                  checked={removeImage}
                  onChange={(e) => setRemoveImage(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300 text-green focus:ring-green"
                />
                Հեռացնել ընթացիկ նկարը
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
