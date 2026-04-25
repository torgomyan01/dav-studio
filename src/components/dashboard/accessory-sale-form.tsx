'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';

import { createAccessorySale } from '@/app/actions/accessory-sales';

type AccessoryOption = {
  id: string;
  name: string;
  imageUrl: string | null;
  quantity: number;
};

type StockFilter = 'all' | 'inStock' | 'outOfStock';
type SortKey = 'nameAsc' | 'nameDesc' | 'quantityDesc' | 'quantityAsc';

export function AccessorySaleForm({ accessories }: { accessories: AccessoryOption[] }) {
  const [open, setOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [accessorySearch, setAccessorySearch] = useState('');
  const [stockFilter, setStockFilter] = useState<StockFilter>('inStock');
  const [sortKey, setSortKey] = useState<SortKey>('nameAsc');
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

  const filteredAccessories = useMemo(() => {
    const q = normalizeSearch(accessorySearch);

    return accessories
      .filter((item) => {
        const matchesSearch = !q || normalizeSearch(item.name).includes(q);
        const matchesStock =
          stockFilter === 'all' ||
          (stockFilter === 'inStock' && item.quantity > 0) ||
          (stockFilter === 'outOfStock' && item.quantity <= 0);
        return matchesSearch && matchesStock;
      })
      .sort((a, b) => {
        if (sortKey === 'nameAsc') return a.name.localeCompare(b.name, 'hy-AM');
        if (sortKey === 'nameDesc') return b.name.localeCompare(a.name, 'hy-AM');
        if (sortKey === 'quantityDesc') return b.quantity - a.quantity;
        return a.quantity - b.quantity;
      });
  }, [accessories, accessorySearch, stockFilter, sortKey]);

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
      setOpen(false);
    } finally {
      setPending(false);
    }
  }

  function onClose() {
    if (pending) return;
    setOpen(false);
    setPickerOpen(false);
    setPreviewImageUrl(null);
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
        Ավելացնել նոր վաճառք
      </button>

      {message ? (
        <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700" role="status">
          {message}
        </p>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-xl rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl sm:p-8">
            <div className="mb-4 flex items-start justify-between gap-3 border-b border-neutral-200 pb-3">
              <div>
                <h3 className="text-base font-semibold text-neutral-900">Նոր վաճառք</h3>
                <p className="mt-1 text-sm text-neutral-500">Ընտրեք ապրանքը և գրանցեք վաճառքը։</p>
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
              <div className="block">
                <span className="mb-1.5 block text-sm font-medium text-neutral-700">Ակսեսուար</span>
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-left text-neutral-900 outline-none ring-green transition hover:bg-neutral-50 focus:border-green focus:ring-2"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    {selected?.imageUrl ? (
                      <Image
                        src={selected.imageUrl}
                        alt={selected.name}
                        width={40}
                        height={40}
                        className="h-10 w-10 shrink-0 rounded-lg border border-neutral-200 object-cover"
                      />
                    ) : (
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-100 text-neutral-400">
                        <span className="fa-regular fa-image" aria-hidden />
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {selected ? selected.name : 'Սեղմեք՝ ակսեսուար ընտրելու համար'}
                      </span>
                      <span className="block text-xs text-neutral-500">
                        {selected ? `Մնացորդ՝ ${selected.quantity} հատ` : 'Որոնում, ֆիլտր, նկարներով ընտրություն'}
                      </span>
                    </span>
                  </span>
                  <span className="fa-solid fa-magnifying-glass text-neutral-400" aria-hidden />
                </button>
              </div>

              {selected ? (
                <p className="rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-500">
                  Ընտրված ապրանքի մնացորդ՝ {selected.quantity} հատ
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
                  {pending ? 'Պահպանում…' : 'Գրանցել վաճառքը'}
                </button>
              </div>
            </form>
          </div>

          {pickerOpen ? (
            <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 px-4 py-6">
              <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xl sm:p-6">
                <div className="mb-4 flex items-start justify-between gap-3 border-b border-neutral-200 pb-3">
                  <div>
                    <h3 className="text-base font-semibold text-neutral-900">Ընտրել ակսեսուար</h3>
                    <p className="mt-1 text-sm text-neutral-500">
                      Որոնեք, ֆիլտրեք և ընտրեք ապրանքը նկարով։
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPickerOpen(false)}
                    className="rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100"
                  >
                    <span className="fa-solid fa-xmark" aria-hidden />
                  </button>
                </div>

                <div className="grid gap-3 lg:grid-cols-12">
                  <label className="block lg:col-span-6">
                    <span className="mb-1.5 block text-sm font-medium text-neutral-700">Որոնել</span>
                    <input
                      value={accessorySearch}
                      onChange={(e) => setAccessorySearch(e.target.value)}
                      autoFocus
                      placeholder="Գրեք ակսեսուարի անունը..."
                      className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none ring-green transition focus:border-green focus:ring-2"
                    />
                  </label>

                  <label className="block lg:col-span-3">
                    <span className="mb-1.5 block text-sm font-medium text-neutral-700">Ֆիլտր</span>
                    <select
                      value={stockFilter}
                      onChange={(e) => setStockFilter(e.target.value as StockFilter)}
                      className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none ring-green transition focus:border-green focus:ring-2"
                    >
                      <option value="all">Բոլորը</option>
                      <option value="inStock">Միայն առկա</option>
                      <option value="outOfStock">Սպառված</option>
                    </select>
                  </label>

                  <label className="block lg:col-span-3">
                    <span className="mb-1.5 block text-sm font-medium text-neutral-700">Սորտավորում</span>
                    <select
                      value={sortKey}
                      onChange={(e) => setSortKey(e.target.value as SortKey)}
                      className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none ring-green transition focus:border-green focus:ring-2"
                    >
                      <option value="nameAsc">Անուն՝ Ա-Ֆ</option>
                      <option value="nameDesc">Անուն՝ Ֆ-Ա</option>
                      <option value="quantityDesc">Քանակ՝ շատից քիչ</option>
                      <option value="quantityAsc">Քանակ՝ քիչից շատ</option>
                    </select>
                  </label>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
                  <p>Գտնվել է՝ {filteredAccessories.length} ակսեսուար</p>
                  <button
                    type="button"
                    onClick={() => {
                      setAccessorySearch('');
                      setStockFilter('inStock');
                      setSortKey('nameAsc');
                    }}
                    className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-neutral-600 hover:bg-neutral-100"
                  >
                    Մաքրել
                  </button>
                </div>

                <div className="mt-3 grid max-h-[58vh] gap-3 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredAccessories.length === 0 ? (
                    <p className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-500 sm:col-span-2 lg:col-span-3">
                      Ակսեսուար չի գտնվել։
                    </p>
                  ) : (
                    filteredAccessories.map((item) => (
                      <div
                        key={item.id}
                        className={`rounded-xl border bg-white p-3 transition ${
                          accessoryId === item.id ? 'border-green shadow-sm' : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => item.imageUrl && setPreviewImageUrl(item.imageUrl)}
                            className="group flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100 text-neutral-400"
                            title="Մեծացնել նկարը"
                          >
                            {item.imageUrl ? (
                              <Image
                                src={item.imageUrl}
                                alt={item.name}
                                width={80}
                                height={80}
                                className="h-full w-full object-cover transition group-hover:scale-105"
                              />
                            ) : (
                              <span className="fa-regular fa-image" aria-hidden />
                            )}
                          </button>

                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-2 text-sm font-medium text-neutral-900">{item.name}</p>
                            <p
                              className={`mt-1 text-xs ${
                                item.quantity > 0 ? 'text-neutral-500' : 'font-medium text-red-600'
                              }`}
                            >
                              Մնացորդ՝ {item.quantity} հատ
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setAccessoryId(item.id);
                                setPickerOpen(false);
                              }}
                              disabled={item.quantity <= 0}
                              className="mt-3 rounded-lg bg-green px-3 py-1.5 text-xs font-medium text-cream transition hover:opacity-95 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500"
                            >
                              {accessoryId === item.id ? 'Ընտրված է' : 'Ընտրել'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {previewImageUrl ? (
            <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/75 px-4 py-6">
              <button
                type="button"
                onClick={() => setPreviewImageUrl(null)}
                className="absolute right-4 top-4 rounded-lg bg-white px-3 py-2 text-sm text-neutral-800 hover:bg-neutral-100"
              >
                Փակել
              </button>
              <Image
                src={previewImageUrl}
                alt="Ակսեսուարի նկար"
                width={900}
                height={700}
                className="max-h-[85vh] w-auto max-w-full rounded-2xl object-contain"
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

function normalizeSearch(value: string): string {
  return value.toLocaleLowerCase('hy-AM').replace(/\s+/g, ' ').trim();
}
