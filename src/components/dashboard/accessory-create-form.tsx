'use client';

import { useState } from 'react';

import { createAccessory } from '@/app/actions/accessories';

export function AccessoryCreateForm() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setPending(true);

    try {
      const formData = new FormData();
      formData.set('name', name);
      formData.set('costPrice', costPrice);
      formData.set('quantity', quantity);
      if (imageFile) formData.set('image', imageFile);

      const res = await createAccessory(formData);
      if (!res.ok) {
        setError(res.message);
        return;
      }

      setMessage(res.message);
      setName('');
      setCostPrice('');
      setQuantity('');
      setImageFile(null);
      setOpen(false);
    } finally {
      setPending(false);
    }
  }

  function onClose() {
    if (pending) return;
    setOpen(false);
    setError(null);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center rounded-lg bg-green px-4 py-2.5 text-sm font-medium text-cream transition hover:opacity-95"
      >
        <i className="fa-solid fa-plus mr-2" aria-hidden />
        Ավելացնել նոր ակսեսուար
      </button>

      {message ? (
        <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700" role="status">
          {message}
        </p>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 px-3 py-5">
          <div className="max-h-full w-full max-w-xl overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-4 shadow-xl sm:p-8">
            <div className="mb-4 flex items-start justify-between gap-3 border-b border-neutral-200 pb-3">
              <div>
                <h3 className="text-base font-semibold text-neutral-900">Նոր ակսեսուար</h3>
                <p className="mt-1 text-sm text-neutral-500">Լրացրեք տվյալները և պահեք բազայում։</p>
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
                <span className="mb-1.5 block text-sm font-medium text-neutral-700">Անվանում</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Օրինակ՝ iPhone 13 case"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-neutral-900 outline-none ring-green transition focus:border-green focus:ring-2"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-neutral-700">Ինքնարժեք</span>
                <input
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Օրինակ՝ 2500"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-neutral-900 outline-none ring-green transition focus:border-green focus:ring-2"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-neutral-700">Քանակ</span>
                <input
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  type="number"
                  step="1"
                  min="0"
                  placeholder="Օրինակ՝ 10"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-neutral-900 outline-none ring-green transition focus:border-green focus:ring-2"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-neutral-700">Նկար (ոչ պարտադիր)</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none ring-green transition file:mr-3 file:rounded-md file:border-0 file:bg-neutral-100 file:px-2.5 file:py-1.5 file:text-xs file:font-medium file:text-neutral-700 hover:file:bg-neutral-200 focus:border-green focus:ring-2"
                />
                <p className="mt-1 text-xs text-neutral-500">Մաքս․ 5MB, ֆորմատներ՝ JPG, PNG, WEBP, GIF</p>
              </label>

              {error ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                  {error}
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
                  {pending ? 'Պահպանում…' : 'Ավելացնել ապրանք'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

