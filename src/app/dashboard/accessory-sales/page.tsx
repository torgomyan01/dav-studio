import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { BackButton } from '@/components/back-button';
import { AccessorySaleForm } from '@/components/dashboard/accessory-sale-form';
import { AccessorySaleRowActions } from '@/components/dashboard/accessory-sale-row-actions';
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
import { authOptions } from '@/lib/auth';
import { canAccessDashboardPage } from '@/lib/dashboard-permissions';
import { prisma } from '@/lib/prisma';
import { routes } from '@/utils/consts';

type AccessorySalesSearchParams = {
  page?: string;
};

const PAGE_SIZE = 10;

export default async function AccessorySalesPage({
  searchParams,
}: {
  searchParams: Promise<AccessorySalesSearchParams>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect(routes.home);
  }
  if (!canAccessDashboardPage(session.user.role, 'accessorySales')) {
    redirect(routes.dashboard);
  }

  const sp = await searchParams;
  const requestedPage = Number(sp.page ?? '1');
  const currentPage = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const skip = (currentPage - 1) * PAGE_SIZE;

  const [accessories, sales, totalSales] = await Promise.all([
    prisma.accessory.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        quantity: true,
      },
    }),
    prisma.accessorySale.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: PAGE_SIZE,
      include: {
        accessory: {
          select: {
            name: true,
          },
        },
        debt: {
          select: {
            id: true,
          },
        },
      },
    }),
    prisma.accessorySale.count(),
  ]);
  const totalPages = Math.max(Math.ceil(totalSales / PAGE_SIZE), 1);
  if (currentPage > totalPages && totalSales > 0) {
    redirect(`${routes.dashboardAccessorySales}?page=${totalPages}`);
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-3 py-3 sm:px-4 sm:py-8 lg:pl-76">
      <DashboardSidebar session={session} active="accessorySales" />

      <div className="mx-auto max-w-6xl">
        <BackButton />
        <section className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-8">
          <header className="border-b border-neutral-200 pb-4">
            <h2 className="text-2xl font-semibold text-neutral-900">
              Ակսեսուարի վաճառք
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              Ընտրեք ակսեսուարը, գրեք վաճառված քանակը և վաճառքի արժեքը։
            </p>
          </header>

          <AccessorySaleForm accessories={accessories} />

          <div className="overflow-hidden rounded-xl border border-neutral-200">
            <div className="hidden grid-cols-12 border-b border-neutral-200 bg-neutral-50 px-4 py-3 text-xs font-medium uppercase tracking-wide text-neutral-500 md:grid">
              <p className="col-span-3">Ակսեսուար</p>
              <p className="col-span-1">Քանակ</p>
              <p className="col-span-2">Վաճառքի գին</p>
              <p className="col-span-2">Ընդամենը</p>
              <p className="col-span-2">Ամսաթիվ</p>
              <p className="col-span-2 text-right">Գործողություններ</p>
            </div>

            <div className="divide-y divide-neutral-200">
              {sales.length === 0 ? (
                <p className="px-4 py-6 text-sm text-neutral-500">
                  Առայժմ վաճառք չկա։
                </p>
              ) : (
                sales.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-1 gap-2 px-4 py-4 text-sm text-neutral-800 hover:bg-neutral-50 md:grid-cols-12 md:items-center md:gap-0 md:py-3"
                  >
                    <p className="font-semibold text-neutral-900 md:col-span-3 md:font-normal">{item.accessory.name}</p>
                    <p className="flex justify-between rounded-lg bg-neutral-50 px-3 py-2 md:col-span-1 md:block md:bg-transparent md:px-0 md:py-0">
                      <span className="text-xs text-neutral-500 md:hidden">Քանակ</span>
                      <span>{item.quantity}</span>
                    </p>
                    <p className="flex justify-between rounded-lg bg-neutral-50 px-3 py-2 md:col-span-2 md:block md:bg-transparent md:px-0 md:py-0">
                      <span className="text-xs text-neutral-500 md:hidden">Վաճառքի գին</span>
                      <span>{item.unitSalePrice.toString()}</span>
                    </p>
                    <p className="flex justify-between rounded-lg bg-neutral-50 px-3 py-2 md:col-span-2 md:block md:bg-transparent md:px-0 md:py-0">
                      <span className="text-xs text-neutral-500 md:hidden">Ընդամենը</span>
                      <span>{item.totalSalePrice.toString()}</span>
                    </p>
                    <p className="flex justify-between rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-500 md:col-span-2 md:block md:bg-transparent md:px-0 md:py-0">
                      <span className="md:hidden">Ամսաթիվ</span>
                      <span>{item.createdAt.toLocaleDateString('hy-AM')}</span>
                    </p>
                    <AccessorySaleRowActions
                      sale={{
                        id: item.id,
                        accessoryId: item.accessoryId,
                        quantity: item.quantity,
                        unitSalePrice: item.unitSalePrice.toString(),
                      }}
                      accessories={accessories}
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={totalSales} />
        </section>
      </div>
    </main>
  );
}

function Pagination({
  currentPage,
  totalPages,
  totalItems,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
}) {
  if (totalItems === 0) return null;

  const pages = buildPageList(currentPage, totalPages);

  return (
    <nav className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
      <p className="text-xs text-neutral-500">
        Ընդհանուր՝ {totalItems} վաճառք · Էջ {currentPage} / {totalPages}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <PageLink page={Math.max(currentPage - 1, 1)} disabled={currentPage === 1}>
          Նախորդ
        </PageLink>
        {pages.map((page) => (
          <PageLink key={page} page={page} active={page === currentPage}>
            {page}
          </PageLink>
        ))}
        <PageLink page={Math.min(currentPage + 1, totalPages)} disabled={currentPage === totalPages}>
          Հաջորդ
        </PageLink>
      </div>
    </nav>
  );
}

function PageLink({
  page,
  active,
  disabled,
  children,
}: {
  page: number;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const href = `${routes.dashboardAccessorySales}?page=${page}`;
  const className = `rounded-lg border px-3 py-2 text-xs font-semibold transition ${
    active
      ? 'border-green bg-green text-white'
      : 'border-neutral-200 bg-white text-neutral-700 hover:border-green/30 hover:bg-green/5 hover:text-green'
  } ${disabled ? 'pointer-events-none opacity-50' : ''}`;

  return (
    <a href={href} className={className} aria-current={active ? 'page' : undefined}>
      {children}
    </a>
  );
}

function buildPageList(currentPage: number, totalPages: number) {
  const from = Math.max(1, currentPage - 2);
  const to = Math.min(totalPages, currentPage + 2);
  return Array.from({ length: to - from + 1 }, (_, index) => from + index);
}
