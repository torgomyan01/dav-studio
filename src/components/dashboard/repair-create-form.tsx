'use client';

import { useState } from 'react';

import { createRepairOrder } from '@/app/actions/repairs';
import { maskPhoneInput } from '@/utils/phone';

export function RepairCreateForm() {
  const [open, setOpen] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [expenses, setExpenses] = useState('');
  const [totalValue, setTotalValue] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const expensesNumber = Number(expenses);
  const totalValueNumber = Number(totalValue);
  const hasNumbers =
    Number.isFinite(expensesNumber) && Number.isFinite(totalValueNumber);
  const netProfitValue = hasNumbers ? totalValueNumber - expensesNumber : null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setPending(true);
    try {
      if (netProfitValue === null) {
        setError('Լրացրեք ծախսը և ընդհանուր արժեքը ճիշտ թվերով։');
        return;
      }

      const formData = new FormData();
      formData.set('deviceName', deviceName);
      formData.set('customerName', customerName);
      formData.set('customerPhone', customerPhone);
      formData.set('expenses', expenses);
      formData.set('netProfit', String(netProfitValue));
      formData.set('description', description);
      if (imageFile) formData.set('image', imageFile);

      const res = await createRepairOrder(formData);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      setMessage(res.message);
      setDeviceName('');
      setCustomerName('');
      setCustomerPhone('');
      setImageFile(null);
      setExpenses('');
      setTotalValue('');
      setDescription('');
      setOpen(false);
    } finally {
      setPending(false);
    }
  }

  function onClose() {
    if (pending) return;
    setOpen(false);
    setError(null);
    setMessage(null);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center rounded-lg bg-green px-4 py-2.5 text-sm font-medium text-cream transition hover:opacity-95"
      >
        <i className="fa-solid fa-plus mr-2" aria-hidden />
        Ավելացնել նոր պատվեր
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl sm:p-8">
            <div className="mb-4 flex items-start justify-between gap-3 border-b border-neutral-200 pb-3">
              <div>
                <h3 className="text-base font-semibold text-neutral-900">
                  Նոր վերանորոգման պատվեր
                </h3>
                <p className="mt-1 text-sm text-neutral-500">
                  Լրացրեք տվյալները և պահպանեք պատվերը։
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100"
              >
                <span className="fa-solid fa-xmark" aria-hidden />
              </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Տեխնիկայի անվանում
                </span>
                <input
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="Օրինակ՝ iPhone 13 Pro"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-neutral-900 outline-none ring-green transition focus:border-green focus:ring-2"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Հաճախորդի անուն
                </span>
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Օրինակ՝ Արման"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-neutral-900 outline-none ring-green transition focus:border-green focus:ring-2"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Հաճախորդի հեռախոս
                </span>
                <input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(maskPhoneInput(e.target.value))}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="Օրինակ՝ 094 943 389"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-neutral-900 outline-none ring-green transition focus:border-green focus:ring-2"
                  required
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-neutral-700">
                    Ընդհանուր արժեք
                  </span>
                  <input
                    value={totalValue}
                    onChange={(e) => setTotalValue(e.target.value)}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Օրինակ՝ 12000"
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-neutral-900 outline-none ring-green transition focus:border-green focus:ring-2"
                    required
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-neutral-700">
                    Ծախս
                  </span>
                  <input
                    value={expenses}
                    onChange={(e) => setExpenses(e.target.value)}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Օրինակ՝ 5000"
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-neutral-900 outline-none ring-green transition focus:border-green focus:ring-2"
                    required
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Մաքուր շահույթ
                </span>
                <input
                  value={netProfitValue === null ? '' : netProfitValue}
                  readOnly
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-100 px-3 py-2.5 text-neutral-900"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Նկարագրություն
                </span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Խնդիրը, կատարված աշխատանքը, հաճախորդի նշումներ..."
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-neutral-900 outline-none ring-green transition focus:border-green focus:ring-2"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Նկար (ոչ պարտադիր)
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none ring-green transition file:mr-3 file:rounded-md file:border-0 file:bg-neutral-100 file:px-2.5 file:py-1.5 file:text-xs file:font-medium file:text-neutral-700 hover:file:bg-neutral-200 focus:border-green focus:ring-2"
                />
                <p className="mt-1 text-xs text-neutral-500">Մաքս․ 5MB, JPG/PNG/WEBP/GIF</p>
              </label>

              {error ? (
                <p
                  className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
                  role="alert"
                >
                  {error}
                </p>
              ) : null}

              {message ? (
                <p
                  className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
                  role="status"
                >
                  {message}
                </p>
              ) : null}

              <div className="flex flex-wrap justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-800 hover:bg-neutral-100"
                >
                  Փակել
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-lg bg-green px-4 py-2 text-sm font-medium text-cream transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pending ? 'Պահպանում…' : 'Ավելացնել պատվեր'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
