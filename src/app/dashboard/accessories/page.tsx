import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
import { AccessoryCreateForm } from '@/components/dashboard/accessory-create-form';
import { AccessoryRowActions } from '@/components/dashboard/accessory-row-actions';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import Image from 'next/image';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { routes } from '@/utils/consts';

export default async function AccessoriesPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect(routes.home);
  }

  const accessories = await prisma.accessory.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-6 sm:py-8 lg:pl-76">
      <DashboardSidebar session={session} active="accessories" />

      <div className="mx-auto max-w-6xl">
        <section className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
          <header className="flex flex-wrap items-end justify-between gap-3 border-b border-neutral-200 pb-4">
            <div>
              <h2 className="text-2xl font-semibold text-neutral-900">
                Ակսեսուարներ
              </h2>
              <p className="mt-1 text-sm text-neutral-600">
                Ավելացրու ապրանքներ և պահիր բազայում։
              </p>
            </div>
            <Link
              href={routes.dashboardAccessorySales}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 hover:bg-neutral-100"
            >
              Բացել վաճառքի էջը →
            </Link>
          </header>

          <AccessoryCreateForm />

          <div className="rounded-xl border border-neutral-200 overflow-hidden">
            <div className="grid grid-cols-12 border-b border-neutral-200 bg-neutral-50 px-4 py-3 text-xs font-medium uppercase tracking-wide text-neutral-500">
              <p className="col-span-2">Նկար</p>
              <p className="col-span-3">Անվանում</p>
              <p className="col-span-2">Ինքնարժեք</p>
              <p className="col-span-2">Քանակ</p>
              <p className="col-span-3 text-right">Գործողություններ</p>
            </div>

            <div className="divide-y divide-neutral-200">
              {accessories.length === 0 ? (
                <p className="px-4 py-6 text-sm text-neutral-500">
                  Առայժմ ապրանք չկա։
                </p>
              ) : (
                accessories.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 px-4 py-3 text-sm text-neutral-800"
                  >
                    <div className="col-span-2">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
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
                    <p className="col-span-3">{item.name}</p>
                    <p className="col-span-2">{item.costPrice.toString()}</p>
                    <p className="col-span-2">{item.quantity}</p>
                    <AccessoryRowActions
                      accessory={{
                        id: item.id,
                        name: item.name,
                        costPrice: item.costPrice.toString(),
                        quantity: item.quantity,
                        imageUrl: item.imageUrl,
                      }}
                    />
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
