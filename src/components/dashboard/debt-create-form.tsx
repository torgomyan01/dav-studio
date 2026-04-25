'use client';

import { useMemo, useState } from 'react';

import { createDebt } from '@/app/actions/debts';
import { maskPhoneInput } from '@/utils/phone';

type SaleOption = {
  id: string;
  label: string;
  amount: number;
};

type RepairOption = {
  id: string;
  label: string;
  amount: number;
  customerName: string;
  customerPhone: string;
};

type SourceType = 'ACCESSORY_SALE' | 'REPAIR_ORDER';

export function DebtCreateForm({
  accessorySales,
  repairOrders,
}: {
  accessorySales: SaleOption[];
  repairOrders: RepairOption[];
}) {
  const [sourceType, setSourceType] = useState<SourceType>('ACCESSORY_SALE');
  const [sourceId, setSourceId] = useState('');
  const [sourceSearch, setSourceSearch] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedAmount = useMemo(() => {
    if (!sourceId) return null;
    if (sourceType === 'ACCESSORY_SALE') {
      return accessorySales.find((x) => x.id === sourceId)?.amount ?? null;
    }
    return repairOrders.find((x) => x.id === sourceId)?.amount ?? null;
  }, [sourceId, sourceType, accessorySales, repairOrders]);

  function onSourceTypeChange(next: SourceType) {
    setSourceType(next);
    setSourceId('');
    setSourceSearch('');
    setPickerOpen(false);
    setCustomerName('');
    setCustomerPhone('');
    setError(null);
    setMessage(null);
  }

  function onSourceChange(id: string) {
    setSourceId(id);
    setPickerOpen(false);
    setError(null);
    setMessage(null);

    if (sourceType === 'REPAIR_ORDER') {
      const repair = repairOrders.find((x) => x.id === id);
      if (repair) {
        setCustomerName(repair.customerName);
        setCustomerPhone(repair.customerPhone);
      }
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!sourceId) {
      setError(sourceType === 'ACCESSORY_SALE' ? 'Ընտրեք վաճառքը։' : 'Ընտրեք պատվերը։');
      return;
    }
    setPending(true);
    try {
      const res = await createDebt({
        sourceType,
        sourceId,
        customerName,
        customerPhone,
        dueDate,
      });
      if (!res.ok) {
        setError(res.message);
        return;
      }
      setMessage(res.message);
      setSourceId('');
      setSourceSearch('');
      setCustomerName('');
      setCustomerPhone('');
      setDueDate('');
    } finally {
      setPending(false);
    }
  }

  const options = sourceType === 'ACCESSORY_SALE' ? accessorySales : repairOrders;
  const filteredOptions = useMemo(() => {
    const query = sourceSearch.trim();
    if (!query) return options;

    return options
      .map((item) => ({
        item,
        score: scoreOption(item.label, query),
      }))
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((row) => row.item);
  }, [options, sourceSearch]);

  const selectedSourceOption = useMemo(
    () => options.find((item) => item.id === sourceId) ?? null,
    [options, sourceId],
  );
  const selectOptions = useMemo(() => {
    if (!selectedSourceOption) return filteredOptions;
    if (filteredOptions.some((item) => item.id === selectedSourceOption.id)) return filteredOptions;
    return [selectedSourceOption, ...filteredOptions];
  }, [filteredOptions, selectedSourceOption]);

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-neutral-700">Պարտքի աղբյուր</span>
          <select
            value={sourceType}
            onChange={(e) => onSourceTypeChange(e.target.value as SourceType)}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-neutral-900 outline-none ring-green transition focus:border-green focus:ring-2"
          >
            <option value="ACCESSORY_SALE">Ակսեսուարի վաճառք</option>
            <option value="REPAIR_ORDER">Վերանորոգման պատվեր</option>
          </select>
        </label>

        <div className="space-y-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-neutral-700">
              {sourceType === 'ACCESSORY_SALE' ? 'Ընտրել վաճառքը' : 'Ընտրել պատվերը'}
            </span>
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="flex w-full items-center justify-between rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-left text-neutral-900 outline-none ring-green transition hover:bg-neutral-50 focus:border-green focus:ring-2"
            >
              <span className="truncate text-sm">
                {selectedSourceOption
                  ? selectedSourceOption.label
                  : sourceType === 'ACCESSORY_SALE'
                    ? 'Սեղմեք՝ վաճառք ընտրելու համար'
                    : 'Սեղմեք՝ պատվեր ընտրելու համար'}
              </span>
              <span className="fa-solid fa-magnifying-glass text-neutral-400" aria-hidden />
            </button>
          </label>

          <p className="text-xs text-neutral-500">
            {selectedSourceOption
              ? 'Ընտրված է 1 գրառում'
              : `Հասանելի է՝ ${options.length} ${sourceType === 'ACCESSORY_SALE' ? 'վաճառք' : 'պատվեր'}`}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-neutral-700">Հաճախորդի անուն</span>
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-neutral-900 outline-none ring-green transition focus:border-green focus:ring-2"
            placeholder="Օրինակ՝ Արման"
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
            placeholder="094 943 389"
            required
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-neutral-700">Պարտքի գումար (ավտոմատ)</span>
          <input
            value={selectedAmount === null ? '' : `${selectedAmount.toLocaleString('hy-AM')} դրամ`}
            readOnly
            className="w-full rounded-lg border border-neutral-200 bg-neutral-100 px-3 py-2.5 text-neutral-900"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-neutral-700">Մարման վերջնաժամկետ (ոչ պարտադիր)</span>
          <input
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            type="date"
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-neutral-900 outline-none ring-green transition focus:border-green focus:ring-2"
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
        className="inline-flex items-center rounded-lg bg-green px-4 py-2.5 text-sm font-medium text-cream transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? 'Պահպանում…' : 'Ավելացնել պարտք'}
      </button>

      {pickerOpen ? (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 px-3 py-5">
          <div className="max-h-full w-full max-w-3xl overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-4 shadow-xl sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-3 border-b border-neutral-200 pb-3">
              <div>
                <h3 className="text-base font-semibold text-neutral-900">
                  {sourceType === 'ACCESSORY_SALE' ? 'Ընտրել ակսեսուարի վաճառք' : 'Ընտրել վերանորոգման պատվեր'}
                </h3>
                <p className="mt-1 text-xs text-neutral-500">
                  Որոնեք անունով, թվերով, ամսաթվով կամ գումարով՝ արագ գտնվելու համար։
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

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-neutral-700">
                {sourceType === 'ACCESSORY_SALE' ? 'Փնտրել վաճառքը' : 'Փնտրել պատվերը'}
              </span>
              <input
                value={sourceSearch}
                onChange={(e) => setSourceSearch(e.target.value)}
                autoFocus
                placeholder={
                  sourceType === 'ACCESSORY_SALE'
                    ? 'Փնտրեք անունով, քանակով, ամսաթվով կամ գումարով'
                    : 'Փնտրեք սարքով, հաճախորդով, ամսաթվով կամ գումարով'
                }
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none ring-green transition focus:border-green focus:ring-2"
              />
            </label>

            <div className="mt-3 mb-2 flex items-center justify-between text-xs text-neutral-500">
              <p>
                Գտնվել է՝ {filteredOptions.length} {sourceType === 'ACCESSORY_SALE' ? 'վաճառք' : 'պատվեր'}
              </p>
              <button
                type="button"
                onClick={() => setSourceSearch('')}
                className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-neutral-600 hover:bg-neutral-100"
              >
                Մաքրել որոնումը
              </button>
            </div>

            <div className="max-h-[55vh] space-y-2 overflow-y-auto rounded-lg border border-neutral-200 bg-neutral-50 p-2">
              {selectOptions.length === 0 ? (
                <p className="px-2 py-3 text-sm text-neutral-500">Համապատասխան գրառում չի գտնվել։</p>
              ) : (
                selectOptions.map((item) => {
                  const active = sourceId === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSourceChange(item.id)}
                      className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                        active
                          ? 'border-green bg-green/10 text-neutral-900'
                          : 'border-neutral-200 bg-white text-neutral-800 hover:border-neutral-300 hover:bg-neutral-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : null}
    </form>
  );
}

function scoreOption(label: string, query: string): number {
  const normalizedLabel = normalizeSearch(label);
  const normalizedQuery = normalizeSearch(query);
  const labelDigits = label.replace(/\D/g, '');
  const queryDigits = query.replace(/\D/g, '');

  if (!normalizedQuery && !queryDigits) return 0;

  let score = 0;
  if (normalizedQuery) {
    if (normalizedLabel.startsWith(normalizedQuery)) score += 120;
    if (normalizedLabel.includes(normalizedQuery)) score += 90;

    const tokens = normalizedQuery.split(' ').filter(Boolean);
    for (const token of tokens) {
      if (normalizedLabel.includes(token)) score += 18;
    }
  }

  if (queryDigits) {
    if (labelDigits.startsWith(queryDigits)) score += 80;
    if (labelDigits.includes(queryDigits)) score += 60;
  }

  return score;
}

function normalizeSearch(value: string): string {
  return value.toLocaleLowerCase('hy-AM').replace(/\s+/g, ' ').trim();
}
