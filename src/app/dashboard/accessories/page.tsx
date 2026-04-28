import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
import { AccessoryCreateForm } from '@/components/dashboard/accessory-create-form';
import { AccessoryFilters } from '@/components/dashboard/accessory-filters';
import { AccessoryRowActions } from '@/components/dashboard/accessory-row-actions';
import { BackButton } from '@/components/back-button';
import type { Prisma } from '@prisma/client';
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
  q?: string;
  name?: string;
  sort?: string;
  dir?: string;
};

const PAGE_SIZE = 10;

type AccessorySearchItem = {
  name: string;
  costPrice: { toString(): string };
  quantity: number;
  createdAt: Date;
};

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
  const q = (sp.q ?? '').trim();
  const selectedName = (sp.name ?? '').trim();
  const sort = ['createdAt', 'name', 'costPrice', 'quantity'].includes(sp.sort ?? '')
    ? (sp.sort as 'createdAt' | 'name' | 'costPrice' | 'quantity')
    : 'createdAt';
  const dir = sp.dir === 'asc' ? 'asc' : 'desc';
  const requestedPage = Number(sp.page ?? '1');
  const currentPage = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const skip = (currentPage - 1) * PAGE_SIZE;

  const where: Prisma.AccessoryWhereInput = selectedName ? { name: selectedName } : {};
  const orderBy: Prisma.AccessoryOrderByWithRelationInput[] = [{ [sort]: dir }, { createdAt: 'desc' }];
  const nameOptionsPromise = prisma.accessory.findMany({
    distinct: ['name'],
    orderBy: { name: 'asc' },
    select: { name: true },
  });

  const [rawAccessories, totalAccessories, nameOptions] = q
    ? await Promise.all([
        prisma.accessory.findMany({
          where,
          orderBy,
        }),
        Promise.resolve(0),
        nameOptionsPromise,
      ])
    : await Promise.all([
        prisma.accessory.findMany({
          where,
          orderBy,
          skip,
          take: PAGE_SIZE,
        }),
        prisma.accessory.count({ where }),
        nameOptionsPromise,
      ]);

  const rankedAccessories = q
    ? rankAccessoriesBySearch(rawAccessories, q).sort((a, b) => b.score - a.score || compareAccessories(a.item, b.item, sort, dir))
    : [];
  const accessories = q ? rankedAccessories.slice(skip, skip + PAGE_SIZE).map((row) => row.item) : rawAccessories;
  const resolvedTotalAccessories = q ? rankedAccessories.length : totalAccessories;
  const resolvedTotalPages = Math.max(Math.ceil(resolvedTotalAccessories / PAGE_SIZE), 1);
  if (currentPage > resolvedTotalPages && resolvedTotalAccessories > 0) {
    redirect(createAccessoriesPageHref(resolvedTotalPages, { q, name: selectedName, sort, dir }));
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

          <AccessoryFilters
            q={q}
            selectedName={selectedName}
            sort={sort}
            dir={dir}
            nameOptions={nameOptions.map((item) => item.name)}
          />

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

          <Pagination
            currentPage={currentPage}
            totalPages={resolvedTotalPages}
            totalItems={resolvedTotalAccessories}
            query={{ q, name: selectedName, sort, dir }}
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
    name: string;
    sort: string;
    dir: string;
  };
}) {
  if (totalItems === 0) return null;

  const pages = buildPageList(currentPage, totalPages);

  return (
    <nav className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
      <p className="text-xs text-neutral-500">
        Ընդհանուր՝ {totalItems} ապրանք · Էջ {currentPage} / {totalPages}
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
    name: string;
    sort: string;
    dir: string;
  };
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const href = createAccessoriesPageHref(page, query);
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

function createAccessoriesPageHref(
  page: number,
  query: {
    q: string;
    name: string;
    sort: string;
    dir: string;
  },
) {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  if (query.name) params.set('name', query.name);
  if (query.sort && query.sort !== 'createdAt') params.set('sort', query.sort);
  if (query.dir && query.dir !== 'desc') params.set('dir', query.dir);
  if (page > 1) params.set('page', String(page));

  const qs = params.toString();
  return qs ? `${routes.dashboardAccessories}?${qs}` : routes.dashboardAccessories;
}

function buildPageList(currentPage: number, totalPages: number) {
  const from = Math.max(1, currentPage - 2);
  const to = Math.min(totalPages, currentPage + 2);
  return Array.from({ length: to - from + 1 }, (_, index) => from + index);
}

function rankAccessoriesBySearch<T extends AccessorySearchItem>(items: T[], query: string) {
  const normalizedQuery = normalizeSearchText(query);
  const compactQuery = compactSearchText(normalizedQuery);
  const queryTokens = searchTokens(normalizedQuery);
  const queryNumber = numberFromSearch(query);

  if (!normalizedQuery && !queryNumber) return items.map((item) => ({ item, score: 1 }));

  return items
    .map((item) => ({ item, score: accessorySearchScore(item, normalizedQuery, compactQuery, queryTokens, queryNumber) }))
    .filter((row) => row.score > 0);
}

function accessorySearchScore(
  item: AccessorySearchItem,
  normalizedQuery: string,
  compactQuery: string,
  queryTokens: string[],
  queryNumber: number | null,
) {
  const normalizedName = normalizeSearchText(item.name);
  const compactName = compactSearchText(normalizedName);
  const nameTokens = searchTokens(normalizedName);
  let score = 0;

  if (normalizedName === normalizedQuery) score += 1000;
  if (normalizedName.startsWith(normalizedQuery)) score += 850;
  if (normalizedName.includes(normalizedQuery)) score += 650;
  if (compactQuery && compactName.includes(compactQuery)) score += 600;

  const matchedTokens = queryTokens.filter((token) => nameTokens.some((nameToken) => tokenMatches(nameToken, token)));
  if (queryTokens.length > 0 && matchedTokens.length === queryTokens.length) score += 420 + matchedTokens.length * 40;
  else score += matchedTokens.length * 120;

  for (const token of queryTokens) {
    if (nameTokens.some((nameToken) => isCloseMatch(nameToken, token))) score += 70;
  }

  if (queryNumber !== null) {
    const costPrice = Number(item.costPrice.toString());
    if (item.quantity === queryNumber) score += 180;
    if (Number.isFinite(costPrice) && Math.round(costPrice) === queryNumber) score += 160;
    if (String(item.quantity).includes(String(queryNumber))) score += 60;
    if (Number.isFinite(costPrice) && String(Math.round(costPrice)).includes(String(queryNumber))) score += 60;
  }

  return score;
}

function normalizeSearchText(value: string) {
  return value
    .toLocaleLowerCase('hy-AM')
    .replace(/և/g, 'եւ')
    .replace(/ё/g, 'е')
    .replace(/[՝՛՜՞.,/#!$%^&*;:{}=_`~()"'[\]\\|<>+-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function compactSearchText(value: string) {
  return value.replace(/\s+/g, '');
}

function searchTokens(value: string) {
  return normalizeSearchText(value)
    .split(' ')
    .map((token) => token.trim())
    .filter(Boolean);
}

function numberFromSearch(value: string) {
  const digits = value.replace(/\D/g, '');
  if (!digits) return null;
  const number = Number(digits);
  return Number.isFinite(number) ? number : null;
}

function tokenMatches(nameToken: string, queryToken: string) {
  return nameToken === queryToken || nameToken.includes(queryToken) || queryToken.includes(nameToken);
}

function isCloseMatch(nameToken: string, queryToken: string) {
  if (queryToken.length < 3 || nameToken.length < 3) return false;
  return levenshteinDistance(nameToken, queryToken) <= (queryToken.length <= 5 ? 1 : 2);
}

function levenshteinDistance(a: string, b: string) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j += 1) dp[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }

  return dp[a.length][b.length];
}

function compareAccessories<T extends AccessorySearchItem>(
  a: T,
  b: T,
  sort: 'createdAt' | 'name' | 'costPrice' | 'quantity',
  dir: 'asc' | 'desc',
) {
  const direction = dir === 'asc' ? 1 : -1;
  if (sort === 'name') return a.name.localeCompare(b.name, 'hy-AM') * direction;
  if (sort === 'costPrice') return (Number(a.costPrice.toString()) - Number(b.costPrice.toString())) * direction;
  if (sort === 'quantity') return (a.quantity - b.quantity) * direction;
  return (a.createdAt.getTime() - b.createdAt.getTime()) * direction;
}
