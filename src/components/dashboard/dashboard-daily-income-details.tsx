'use client';

import { useMemo, useState } from 'react';

type AccessoryDetail = {
  name: string;
  quantity: number;
  unitSalePrice: number;
  totalSalePrice: number;
  netProfit: number;
  createdAt: string;
};

type RepairDetail = {
  deviceName: string;
  customerName: string;
  customerPhone: string;
  expenses: number;
  netProfit: number;
  totalAmount: number;
  description: string | null;
  status: string;
  createdAt: string;
};

type DailyIncomeDetails = {
  accessories: AccessoryDetail[];
  repairs: RepairDetail[];
};

export function DashboardDailyIncomeDetails({ details }: { details: DailyIncomeDetails }) {
  const [open, setOpen] = useState(false);
  const totals = useMemo(
    () => ({
      accessoryNetProfit: details.accessories.reduce((sum, item) => sum + item.netProfit, 0),
      repairNetProfit: details.repairs.reduce((sum, item) => sum + item.netProfit, 0),
      soldQuantity: details.accessories.reduce((sum, item) => sum + item.quantity, 0),
    }),
    [details],
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green/90 sm:w-auto"
      >
        <i className="fa-solid fa-list-check text-xs" />
        Տեսնել մաքուր շահույթը
      </button>

      {open && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-neutral-950/60 px-3 py-5">
          <div className="flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-neutral-200 p-4 sm:p-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-green">Օրվա մանրամասն հաշվետվություն</p>
                <h3 className="mt-1 text-xl font-semibold text-neutral-900">Օրվա մաքուր շահույթի մանրամասներ</h3>
                <p className="mt-1 text-sm text-neutral-600">
                  Վաճառված ապրանք՝ {totals.soldQuantity} հատ · Ակսեսուարների մաքուր շահույթ՝{' '}
                  {formatMoney(totals.accessoryNetProfit)} · Վերանորոգման մաքուր շահույթ՝{' '}
                  {formatMoney(totals.repairNetProfit)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-neutral-200 px-3 py-2 text-sm font-semibold text-neutral-600 transition hover:border-red-200 hover:text-red-700"
              >
                Փակել
              </button>
            </div>

            <div className="overflow-y-auto p-4 sm:p-5">
              <div className="grid gap-5 lg:grid-cols-2">
                <section className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="font-semibold text-neutral-900">Ակսեսուարի վաճառքներ</h4>
                      <p className="text-xs text-neutral-500">{details.accessories.length} վաճառք</p>
                    </div>
                    <span className="rounded-full bg-green/10 px-3 py-1 text-xs font-semibold text-green">
                      Մաքուր՝ {formatMoney(totals.accessoryNetProfit)}
                    </span>
                  </div>

                  {details.accessories.length === 0 ? (
                    <EmptyState text="Այսօր դեռ ակսեսուարի վաճառք չի գրանցվել։" />
                  ) : (
                    <div className="space-y-3">
                      {details.accessories.map((item, index) => (
                        <div key={`${item.name}-${item.createdAt}-${index}`} className="rounded-xl border border-neutral-200 bg-white p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-neutral-900">{item.name}</p>
                              <p className="mt-1 text-xs text-neutral-500">{item.createdAt}</p>
                            </div>
                            <p className="text-right text-sm font-semibold text-green">
                              <span className="block text-xs font-medium text-neutral-500">Մաքուր շահույթ</span>
                              {formatMoney(item.netProfit)}
                            </p>
                          </div>
                          <div className="mt-3 grid gap-2 text-xs text-neutral-600 sm:grid-cols-2">
                            <span>Քանակ՝ {item.quantity} հատ</span>
                            <span>Միավորի գին՝ {formatMoney(item.unitSalePrice)}</span>
                            <span>Ընդհանուր վաճառք՝ {formatMoney(item.totalSalePrice)}</span>
                            <span>Մաքուր շահույթ՝ {formatMoney(item.netProfit)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="font-semibold text-neutral-900">Վերանորոգման պատվերներ</h4>
                      <p className="text-xs text-neutral-500">{details.repairs.length} պատվեր</p>
                    </div>
                    <span className="rounded-full bg-green/10 px-3 py-1 text-xs font-semibold text-green">
                      Մաքուր՝ {formatMoney(totals.repairNetProfit)}
                    </span>
                  </div>

                  {details.repairs.length === 0 ? (
                    <EmptyState text="Այսօր դեռ վերանորոգման պատվեր չի գրանցվել։" />
                  ) : (
                    <div className="space-y-3">
                      {details.repairs.map((item, index) => (
                        <div key={`${item.deviceName}-${item.createdAt}-${index}`} className="rounded-xl border border-neutral-200 bg-white p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-neutral-900">{item.deviceName}</p>
                              <p className="mt-1 text-xs text-neutral-500">
                                {item.customerName} · {item.customerPhone}
                              </p>
                            </div>
                            <p className="text-right text-sm font-semibold text-green">
                              <span className="block text-xs font-medium text-neutral-500">Մաքուր շահույթ</span>
                              {formatMoney(item.netProfit)}
                            </p>
                          </div>
                          <div className="mt-3 grid gap-2 text-xs text-neutral-600 sm:grid-cols-2">
                            <span>Ծախս՝ {formatMoney(item.expenses)}</span>
                            <span>Մաքուր շահույթ՝ {formatMoney(item.netProfit)}</span>
                            <span>Ընդհանուր արժեք՝ {formatMoney(item.totalAmount)}</span>
                            <span>Կարգավիճակ՝ {item.status}</span>
                            <span>{item.createdAt}</span>
                          </div>
                          {item.description && <p className="mt-3 text-xs text-neutral-500">Նկարագրություն՝ {item.description}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-4 text-sm text-neutral-500">
      {text}
    </div>
  );
}

function formatMoney(value: number) {
  return `${value.toLocaleString('hy-AM', { maximumFractionDigits: 0 })} դրամ`;
}
