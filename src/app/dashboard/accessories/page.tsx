import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
import { AccessoryCreateForm } from '@/components/dashboard/accessory-create-form';
import { AccessoryRowActions } from '@/components/dashboard/accessory-row-actions';
import { BackButton } from '@/components/back-button';
import { authOptions } from '@/lib/auth';
import { canAccessDashboardPage } from '@/lib/dashboard-permissions';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import Image from 'next/image';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { routes } from '@/utils/consts';

type AccessoriesSearchParams = {
  page?: string;
};

const PAGE_SIZE = 10;

export default async function AccessoriesPage({
  searchParams,
}: {
  searchParams: Promise<AccessoriesSearchParams>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect(routes.home);
  }
  if (!canAccessDashboardPage(session.user.role, 'accessories')) {
    redirect(routes.dashboard);
  }

  const sp = await searchParams;
  const requestedPage = Number(sp.page ?? '1');
  const currentPage = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const skip = (currentPage - 1) * PAGE_SIZE;

  const [accessories, totalAccessories] = await Promise.all([
    prisma.accessory.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.accessory.count(),
  ]);
  const totalPages = Math.max(Math.ceil(totalAccessories / PAGE_SIZE), 1);
  if (currentPage > totalPages && totalAccessories > 0) {
    redirect(`${routes.dashboardAccessories}?page=${totalPages}`);
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-3 py-3 sm:px-4 sm:py-8 lg:pl-76">
      <DashboardSidebar session={session} active="accessories" />

      <div className="mx-auto max-w-6xl">
        <BackButton />
        <section className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-8">
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
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-center text-sm text-neutral-800 hover:bg-neutral-100 sm:w-auto"
            >
              Բացել վաճառքի էջը →
            </Link>
          </header>

          <AccessoryCreateForm />

          <div className="overflow-hidden rounded-xl border border-neutral-200">
            <div className="hidden grid-cols-12 border-b border-neutral-200 bg-neutral-50 px-4 py-3 text-xs font-medium uppercase tracking-wide text-neutral-500 md:grid">
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
                    className="grid grid-cols-1 gap-3 px-4 py-4 text-sm text-neutral-800 hover:bg-neutral-50 md:grid-cols-12 md:items-center md:gap-0 md:py-3"
                  >
                    <div className="flex items-center gap-3 md:col-span-2">
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
                      <div className="md:hidden">
                        <p className="text-xs text-neutral-500">Անվանում</p>
                        <p className="font-semibold text-neutral-900">{item.name}</p>
                      </div>
                    </div>
                    <p className="hidden md:col-span-3 md:block">{item.name}</p>
                    <p className="flex justify-between rounded-lg bg-neutral-50 px-3 py-2 md:col-span-2 md:block md:bg-transparent md:px-0 md:py-0">
                      <span className="text-xs text-neutral-500 md:hidden">Ինքնարժեք</span>
                      <span>{item.costPrice.toString()}</span>
                    </p>
                    <p className="flex justify-between rounded-lg bg-neutral-50 px-3 py-2 md:col-span-2 md:block md:bg-transparent md:px-0 md:py-0">
                      <span className="text-xs text-neutral-500 md:hidden">Քանակ</span>
                      <span>{item.quantity}</span>
                    </p>
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

          <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={totalAccessories} />
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
        Ընդհանուր՝ {totalItems} ապրանք · Էջ {currentPage} / {totalPages}
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
  const href = `${routes.dashboardAccessories}?page=${page}`;
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
