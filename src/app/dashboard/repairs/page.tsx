import type { Prisma } from '@prisma/client';
import type { ReactNode } from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

import { BackButton } from '@/components/back-button';
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
import { RepairCreateForm } from '@/components/dashboard/repair-create-form';
import { RepairRowActions } from '@/components/dashboard/repair-row-actions';
import { RepairStatusButton } from '@/components/dashboard/repair-status-button';
import { authOptions } from '@/lib/auth';
import { canAccessDashboardPage } from '@/lib/dashboard-permissions';
import { prisma } from '@/lib/prisma';
import { routes } from '@/utils/consts';

type RepairsSearchParams = {
  q?: string;
  status?: string;
  device?: string;
  sort?: string;
  dir?: string;
  page?: string;
};

const PAGE_SIZE = 10;

const statusLabel = {
  IN_PROGRESS: 'Վերանորոգման փուլում',
  READY_FOR_PICKUP: 'Պատրաստ է վերցնելու',
  COMPLETED: 'Ավարտված',
} as const;

const statusOptions = Object.keys(statusLabel) as Array<keyof typeof statusLabel>;

export default async function RepairsPage({
  searchParams,
}: {
  searchParams: Promise<RepairsSearchParams>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect(routes.home);
  }
  if (!canAccessDashboardPage(session.user.role, 'repairs')) {
    redirect(routes.dashboard);
  }

  const sp = await searchParams;
  const q = (sp.q ?? '').trim();
  const device = (sp.device ?? '').trim();
  const status = statusOptions.includes(sp.status as keyof typeof statusLabel)
    ? (sp.status as keyof typeof statusLabel)
    : '';
  const sort = ['createdAt', 'deviceName', 'customerName', 'expenses', 'netProfit', 'status'].includes(
    sp.sort ?? '',
  )
    ? (sp.sort as 'createdAt' | 'deviceName' | 'customerName' | 'expenses' | 'netProfit' | 'status')
    : 'createdAt';
  const dir = sp.dir === 'asc' ? 'asc' : 'desc';
  const requestedPage = Number(sp.page ?? '1');
  const currentPage = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const skip = (currentPage - 1) * PAGE_SIZE;

  const where: Prisma.RepairOrderWhereInput = {};
  if (status) where.status = status;
  if (device) where.deviceName = device;
  if (q) {
    const digits = q.replace(/\D/g, '');
    where.OR = [
      { deviceName: { contains: q } },
      { customerName: { contains: q } },
      { description: { contains: q } },
      ...(digits ? [{ customerPhone: { contains: digits } }] : []),
    ];
  }

  const orderBy: Prisma.RepairOrderOrderByWithRelationInput[] =
    sort === 'status'
      ? [{ status: 'asc' }, { createdAt: dir }]
      : [{ status: 'asc' }, { [sort]: dir }];
  const [repairs, totalRepairs, deviceOptions] = await Promise.all([
    prisma.repairOrder.findMany({
      where,
      orderBy,
      skip,
      take: PAGE_SIZE,
    }),
    prisma.repairOrder.count({ where }),
    prisma.repairOrder.findMany({
      distinct: ['deviceName'],
      orderBy: { deviceName: 'asc' },
      select: { deviceName: true },
    }),
  ]);
  const totalPages = Math.max(Math.ceil(totalRepairs / PAGE_SIZE), 1);
  if (currentPage > totalPages && totalRepairs > 0) {
    redirect(createRepairPageHref(totalPages, { q, device, status, sort, dir }));
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-3 py-3 sm:px-4 sm:py-8 lg:pl-76">
      <DashboardSidebar session={session} active="repairs" />

      <div className="mx-auto max-w-6xl">
        <BackButton />
        <section className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-8">
          <header className="border-b border-neutral-200 pb-4">
            <h2 className="text-2xl font-semibold text-neutral-900">
              Վերանորոգման շահույթ
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              Գրանցիր նոր պատվերներ, հետևիր ստատուսին և շահույթին։
            </p>
          </header>

          <RepairCreateForm />

          <form
            action={routes.dashboardRepairs}
            className="grid gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 lg:grid-cols-12"
          >
            <label className="block lg:col-span-3">
              <span className="mb-1.5 block text-sm font-medium text-neutral-700">Որոնել</span>
              <input
                name="q"
                defaultValue={q}
                placeholder="Տեխնիկա, հաճախորդ, հեռախոս..."
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none ring-green transition focus:border-green focus:ring-2"
              />
            </label>

            <label className="block lg:col-span-2">
              <span className="mb-1.5 block text-sm font-medium text-neutral-700">Տեխնիկա</span>
              <select
                name="device"
                defaultValue={device}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none ring-green transition focus:border-green focus:ring-2"
              >
                <option value="">Բոլորը</option>
                {deviceOptions.map((item) => (
                  <option key={item.deviceName} value={item.deviceName}>
                    {item.deviceName}
                  </option>
                ))}
              </select>
            </label>

            <label className="block lg:col-span-2">
              <span className="mb-1.5 block text-sm font-medium text-neutral-700">Ստատուս</span>
              <select
                name="status"
                defaultValue={status}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none ring-green transition focus:border-green focus:ring-2"
              >
                <option value="">Բոլորը</option>
                {statusOptions.map((key) => (
                  <option key={key} value={key}>
                    {statusLabel[key]}
                  </option>
                ))}
              </select>
            </label>

            <label className="block lg:col-span-2">
              <span className="mb-1.5 block text-sm font-medium text-neutral-700">Սորտավորել</span>
              <select
                name="sort"
                defaultValue={sort}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none ring-green transition focus:border-green focus:ring-2"
              >
                <option value="createdAt">Ամսաթիվ</option>
                <option value="deviceName">Տեխնիկա</option>
                <option value="customerName">Հաճախորդ</option>
                <option value="expenses">Ծախս</option>
                <option value="netProfit">Շահույթ</option>
                <option value="status">Ստատուս</option>
              </select>
            </label>

            <label className="block lg:col-span-1">
              <span className="mb-1.5 block text-sm font-medium text-neutral-700">Ուղղություն</span>
              <select
                name="dir"
                defaultValue={dir}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none ring-green transition focus:border-green focus:ring-2"
              >
                <option value="desc">Նվազող</option>
                <option value="asc">Աճող</option>
              </select>
            </label>

            <div className="grid gap-2 sm:flex sm:items-end lg:col-span-2">
              <button
                type="submit"
                className="rounded-lg bg-green px-4 py-2.5 text-sm font-medium text-cream transition hover:opacity-95"
              >
                Կիրառել
              </button>
              <Link
                href={routes.dashboardRepairs}
                className="rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-center text-sm text-neutral-800 hover:bg-neutral-100"
              >
                Մաքրել
              </Link>
            </div>
          </form>

          <div className="overflow-hidden rounded-xl border border-neutral-200">
            <div className="hidden grid-cols-12 border-b border-neutral-200 bg-neutral-50 px-4 py-3 text-xs font-medium uppercase tracking-wide text-neutral-500 md:grid">
              <p className="col-span-1">Նկար</p>
              <p className="col-span-2">Տեխնիկա</p>
              <p className="col-span-2">Հաճախորդ</p>
              <p className="col-span-1">Ծախս</p>
              <p className="col-span-1">Շահույթ</p>
              <p className="col-span-3">Ստատուս</p>
              <p className="col-span-2 text-right">Գործողություններ</p>
            </div>

            <div className="divide-y divide-neutral-200">
              {repairs.length === 0 ? (
                <p className="px-4 py-6 text-sm text-neutral-500">
                  Առայժմ վերանորոգման պատվեր չկա։
                </p>
              ) : (
                repairs.map((item) => (
                  <div
                    key={item.id}
                    className="space-y-3 px-4 py-4 text-sm text-neutral-800 hover:bg-neutral-50 md:py-3"
                  >
                    <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-12 md:gap-2">
                      <div className="flex items-center gap-3 md:col-span-1">
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
                        <div className="md:hidden">
                          <p className="text-xs text-neutral-500">Տեխնիկա</p>
                          <p className="font-semibold text-neutral-900">{item.deviceName}</p>
                        </div>
                      </div>
                      <p className="hidden font-medium md:col-span-2 md:block">
                        {item.deviceName}
                      </p>
                      <div className="rounded-lg bg-neutral-50 px-3 py-2 md:col-span-2 md:bg-transparent md:px-0 md:py-0">
                        <p className="mb-1 text-xs text-neutral-500 md:hidden">Հաճախորդ</p>
                        <p>{item.customerName}</p>
                        <p className="text-xs text-neutral-500">
                          {item.customerPhone || '—'}
                        </p>
                      </div>
                      <p className="flex justify-between rounded-lg bg-neutral-50 px-3 py-2 md:col-span-1 md:block md:bg-transparent md:px-0 md:py-0">
                        <span className="text-xs text-neutral-500 md:hidden">Ծախս</span>
                        <span>{item.expenses.toString()}</span>
                      </p>
                      <p className="flex justify-between rounded-lg bg-neutral-50 px-3 py-2 md:col-span-1 md:block md:bg-transparent md:px-0 md:py-0">
                        <span className="text-xs text-neutral-500 md:hidden">Շահույթ</span>
                        <span>{item.netProfit.toString()}</span>
                      </p>
                      <div className="space-y-2 rounded-lg bg-neutral-50 px-3 py-2 md:col-span-3 md:bg-transparent md:px-0 md:py-0">
                        <p className="text-xs text-neutral-500">
                          {statusLabel[item.status]}
                        </p>
                        <RepairStatusButton
                          orderId={item.id}
                          status={item.status}
                        />
                      </div>
                      <RepairRowActions
                        repair={{
                          id: item.id,
                          deviceName: item.deviceName,
                          customerName: item.customerName,
                          customerPhone: item.customerPhone ?? '',
                          expenses: item.expenses.toString(),
                          netProfit: item.netProfit.toString(),
                          description: item.description,
                          imageUrl: item.imageUrl,
                        }}
                      />
                    </div>
                    {item.description ? (
                      <p className="rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-600 md:bg-transparent md:px-0 md:py-0">
                        {item.description}
                      </p>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalRepairs}
            query={{ q, device, status, sort, dir }}
          />
        </section>
      </div>
    </main>
  );
}

function Pagination({
  currentPage,
  totalPages,
  totalItems,
  query,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  query: {
    q: string;
    device: string;
    status: string;
    sort: string;
    dir: string;
  };
}) {
  if (totalItems === 0) return null;

  const pages = buildPageList(currentPage, totalPages);

  return (
    <nav className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
      <p className="text-xs text-neutral-500">
        Ընդհանուր՝ {totalItems} պատվեր · Էջ {currentPage} / {totalPages}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <PageLink page={Math.max(currentPage - 1, 1)} query={query} disabled={currentPage === 1}>
          Նախորդ
        </PageLink>
        {pages.map((page) => (
          <PageLink key={page} page={page} query={query} active={page === currentPage}>
            {page}
          </PageLink>
        ))}
        <PageLink page={Math.min(currentPage + 1, totalPages)} query={query} disabled={currentPage === totalPages}>
          Հաջորդ
        </PageLink>
      </div>
    </nav>
  );
}

function PageLink({
  page,
  query,
  active,
  disabled,
  children,
}: {
  page: number;
  query: {
    q: string;
    device: string;
    status: string;
    sort: string;
    dir: string;
  };
  active?: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  const className = `rounded-lg border px-3 py-2 text-xs font-semibold transition ${
    active
      ? 'border-green bg-green text-white'
      : 'border-neutral-200 bg-white text-neutral-700 hover:border-green/30 hover:bg-green/5 hover:text-green'
  } ${disabled ? 'pointer-events-none opacity-50' : ''}`;

  return (
    <a href={createRepairPageHref(page, query)} className={className} aria-current={active ? 'page' : undefined}>
      {children}
    </a>
  );
}

function createRepairPageHref(
  page: number,
  query: {
    q: string;
    device: string;
    status: string;
    sort: string;
    dir: string;
  },
) {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  if (query.device) params.set('device', query.device);
  if (query.status) params.set('status', query.status);
  if (query.sort && query.sort !== 'createdAt') params.set('sort', query.sort);
  if (query.dir && query.dir !== 'desc') params.set('dir', query.dir);
  if (page > 1) params.set('page', String(page));

  const qs = params.toString();
  return qs ? `${routes.dashboardRepairs}?${qs}` : routes.dashboardRepairs;
}

function buildPageList(currentPage: number, totalPages: number) {
  const from = Math.max(1, currentPage - 2);
  const to = Math.min(totalPages, currentPage + 2);
  return Array.from({ length: to - from + 1 }, (_, index) => from + index);
}
