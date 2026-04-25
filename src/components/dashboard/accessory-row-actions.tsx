'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { deleteAccessory, updateAccessory } from '@/app/actions/accessories';

export function AccessoryRowActions({
  accessory,
}: {
  accessory: {
    id: string;
    name: string;
    costPrice: string;
    quantity: number;
    imageUrl: string | null;
  };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(accessory.name);
  const [costPrice, setCostPrice] = useState(accessory.costPrice);
  const [quantity, setQuantity] = useState(String(accessory.quantity));
  const [removeImage, setRemoveImage] = useState(false);
  const [newImage, setNewImage] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const formData = new FormData();
      formData.set('id', accessory.id);
      formData.set('name', name);
      formData.set('costPrice', costPrice);
      formData.set('quantity', quantity);
      if (removeImage) formData.set('removeImage', '1');
      if (newImage) formData.set('image', newImage);

      const res = await updateAccessory(formData);
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
    const ok = window.confirm('Վստա՞հ եք, որ ցանկանում եք ջնջել այս ապրանքը։');
    if (!ok) return;
    setError(null);
    setDeletePending(true);
    try {
      const res = await deleteAccessory(accessory.id);
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
      <div className="col-span-full space-y-1 md:col-span-3">
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
                <h3 className="text-base font-semibold text-neutral-900">Փոփոխել ակսեսուարը</h3>
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
                <span className="mb-1.5 block text-sm font-medium text-neutral-700">Անվանում</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-neutral-900 outline-none ring-green transition focus:border-green focus:ring-2"
                  required
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-neutral-700">Ինքնարժեք</span>
                  <input
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    type="number"
                    step="0.01"
                    min="0"
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
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-neutral-900 outline-none ring-green transition focus:border-green focus:ring-2"
                    required
                  />
                </label>
              </div>

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
