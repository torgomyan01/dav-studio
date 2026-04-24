import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Image from 'next/image';

import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
import { RepairCreateForm } from '@/components/dashboard/repair-create-form';
import { RepairStatusButton } from '@/components/dashboard/repair-status-button';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { routes } from '@/utils/consts';

export default async function RepairsPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect(routes.home);
  }

  const repairs = await prisma.repairOrder.findMany({ orderBy: { createdAt: 'desc' } });

  const statusLabel = {
    IN_PROGRESS: 'Վերանորոգման փուլում',
    READY_FOR_PICKUP: 'Պատրաստ է վերցնելու',
    COMPLETED: 'Ավարտված',
  } as const;

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-6 sm:py-8 lg:pl-76">
      <DashboardSidebar session={session} active="repairs" />

      <div className="mx-auto max-w-6xl">
        <section className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
          <header className="border-b border-neutral-200 pb-4">
            <h2 className="text-2xl font-semibold text-neutral-900">Վերանորոգման շահույթ</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Գրանցիր նոր պատվերներ, հետևիր ստատուսին և շահույթին։
            </p>
          </header>

          <RepairCreateForm />

          <div className="rounded-xl border border-neutral-200">
            <div className="grid grid-cols-12 border-b border-neutral-200 bg-neutral-50 px-4 py-3 text-xs font-medium uppercase tracking-wide text-neutral-500">
              <p className="col-span-2">Նկար</p>
              <p className="col-span-3">Տեխնիկա</p>
              <p className="col-span-2">Հաճախորդ</p>
              <p className="col-span-2">Ծախս</p>
              <p className="col-span-2">Մաքուր շահույթ</p>
              <p className="col-span-1">Ստատուս</p>
            </div>

            <div className="divide-y divide-neutral-200">
              {repairs.length === 0 ? (
                <p className="px-4 py-6 text-sm text-neutral-500">Առայժմ վերանորոգման պատվեր չկա։</p>
              ) : (
                repairs.map((item) => (
                  <div key={item.id} className="space-y-2 px-4 py-3 text-sm text-neutral-800">
                    <div className="grid grid-cols-12 items-start gap-2">
                      <div className="col-span-2">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.deviceName}
                            width={48}
                            height={48}
                            className="h-12 w-12 rounded-lg border border-neutral-200 object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-100 text-neutral-400">
                            <span className="fa-regular fa-image" aria-hidden />
                          </div>
                        )}
                      </div>
                      <p className="col-span-3 font-medium">{item.deviceName}</p>
                      <div className="col-span-2">
                        <p>{item.customerName}</p>
                        <p className="text-xs text-neutral-500">{item.customerPhone || '—'}</p>
                      </div>
                      <p className="col-span-2">{item.expenses.toString()}</p>
                      <p className="col-span-2">{item.netProfit.toString()}</p>
                      <div className="col-span-1 space-y-1">
                        <p className="text-xs text-neutral-500">{statusLabel[item.status]}</p>
                        <RepairStatusButton orderId={item.id} status={item.status} />
                      </div>
                    </div>
                    <p className="text-xs text-neutral-600">{item.description}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
