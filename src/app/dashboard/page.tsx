import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { routes } from '@/utils/consts';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect(routes.home);
  }

  const accessoryCount = await prisma.accessory.count();
  const accessorySalesCount = await prisma.accessorySale.count();
  const repairsCount = await prisma.repairOrder.count();
  const debtsCount = await prisma.debt.count();

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-6 sm:py-8 lg:pl-76">
      <DashboardSidebar session={session} active="home" />

      <div className="mx-auto max-w-6xl">
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
          <header className="mb-6 border-b border-neutral-200 pb-4">
            <h2 className="text-2xl font-semibold text-neutral-900">Վահանակ</h2>
            <p className="mt-1 text-sm text-neutral-600">Աջ հատվածում հիմնական աշխատանքային կոնտենտն է։</p>
          </header>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-xs text-neutral-500">Ակսեսուարներ (ընդհանուր)</p>
              <p className="mt-2 text-lg font-semibold text-neutral-900">{accessoryCount}</p>
              <Link href={routes.dashboardAccessories} className="mt-2 inline-block text-sm text-green hover:underline">
                Բացել էջը →
              </Link>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-xs text-neutral-500">Վերանորոգման պատվերներ (ընդհանուր)</p>
              <p className="mt-2 text-lg font-semibold text-neutral-900">{repairsCount}</p>
              <Link href={routes.dashboardRepairs} className="mt-2 inline-block text-sm text-green hover:underline">
                Բացել էջը →
              </Link>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-xs text-neutral-500">Ակսեսուարի վաճառքներ (ընդհանուր)</p>
              <p className="mt-2 text-lg font-semibold text-neutral-900">{accessorySalesCount}</p>
              <Link
                href={routes.dashboardAccessorySales}
                className="mt-2 inline-block text-sm text-green hover:underline"
              >
                Բացել էջը →
              </Link>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-xs text-neutral-500">Հաշվարկային անալիտիկա</p>
              <p className="mt-2 text-lg font-semibold text-neutral-900">4 կտրվածք</p>
              <Link href={routes.dashboardAnalytics} className="mt-2 inline-block text-sm text-green hover:underline">
                Բացել էջը →
              </Link>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-xs text-neutral-500">Պարտքեր (ընդհանուր)</p>
              <p className="mt-2 text-lg font-semibold text-neutral-900">{debtsCount}</p>
              <Link href={routes.dashboardDebts} className="mt-2 inline-block text-sm text-green hover:underline">
                Բացել էջը →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
