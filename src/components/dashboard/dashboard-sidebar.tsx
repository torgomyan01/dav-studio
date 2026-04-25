import Link from 'next/link';
import type { Session } from 'next-auth';

import { SignOutButton } from '@/components/auth/sign-out-button';
import { routes } from '@/utils/consts';

type DashboardMenuKey =
  | 'home'
  | 'accessories'
  | 'accessorySales'
  | 'repairs'
  | 'expenses'
  | 'debts'
  | 'analytics';

export function DashboardSidebar({
  session,
  active,
}: {
  session: Session;
  active: DashboardMenuKey;
}) {
  const roleLabel: Record<string, string> = {
    ADMIN: 'Ադմին',
    MANAGER: 'Մենեջեր',
    WORKER: 'Աշխատող',
  };

  const menuItems: Array<{
    key: DashboardMenuKey;
    title: string;
    description: string;
    iconClass: string;
    href: string;
  }> = [
    {
      key: 'home',
      title: 'Գլխավոր',
      description: 'Ընդհանուր վիճակագրություն',
      iconClass: 'fa-solid fa-house',
      href: routes.dashboard,
    },
    {
      key: 'accessorySales',
      title: 'Ակսեսուարի վաճառք',
      description: 'Վաճառք և քանակի նվազեցում',
      iconClass: 'fa-solid fa-cash-register',
      href: routes.dashboardAccessorySales,
    },
    {
      key: 'accessories',
      title: 'Ակսեսուարներ',
      description: 'Ավելացնել ապրանք',
      iconClass: 'fa-solid fa-bag-shopping',
      href: routes.dashboardAccessories,
    },

    {
      key: 'repairs',
      title: 'Վերանորոգում',
      description: 'Պատվերներ և ստատուսներ',
      iconClass: 'fa-solid fa-screwdriver-wrench',
      href: routes.dashboardRepairs,
    },
    {
      key: 'expenses',
      title: 'Օրվա ծախսեր',
      description: 'Կասայից դուրս եկած գումարներ',
      iconClass: 'fa-solid fa-wallet',
      href: routes.dashboardExpenses,
    },
    {
      key: 'debts',
      title: 'Պարտքեր',
      description: 'Պարտքով վաճառք և մարումներ',
      iconClass: 'fa-solid fa-hand-holding-dollar',
      href: routes.dashboardDebts,
    },
    {
      key: 'analytics',
      title: 'Անալիտիկա',
      description: 'Օրական / շաբաթական / ամսական / տարեկան',
      iconClass: 'fa-solid fa-chart-line',
      href: routes.dashboardAnalytics,
    },
  ];

  return (
    <aside className="mb-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm lg:fixed lg:left-0 lg:top-0 lg:z-40 lg:mb-0 lg:h-screen lg:w-72 lg:overflow-y-auto lg:rounded-none lg:rounded-r-3xl lg:border-y-0 lg:border-l-0 lg:px-5 lg:py-6 lg:shadow-xl">
      <div className="mb-4 rounded-xl border border-green/15 bg-linear-to-br from-green/10 to-green/5 p-3">
        <h1 className="text-lg font-semibold text-neutral-900">
          Ohanyan Studio
        </h1>
        <p className="mt-1 text-xs text-neutral-600">
          {session.user.name ?? '—'} · {session.user.phone || '—'}
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          {roleLabel[session.user.role] ?? session.user.role}
        </p>
      </div>

      <nav className="space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={`group block w-full rounded-xl border px-3 py-2.5 text-left transition ${
              active === item.key
                ? 'border-green bg-green/10 shadow-sm'
                : 'border-transparent bg-neutral-50 hover:border-neutral-200 hover:bg-neutral-100'
            }`}
          >
            <span className="flex items-center gap-2 text-sm font-medium text-neutral-900">
              <span
                className={`inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs transition ${
                  active === item.key
                    ? 'bg-green text-cream'
                    : 'bg-white text-neutral-500 group-hover:bg-neutral-200'
                }`}
                aria-hidden
              >
                <span className={item.iconClass} />
              </span>
              {item.title}
            </span>
            <span className="mt-1 block text-xs text-neutral-500">
              {item.description}
            </span>
          </Link>
        ))}
      </nav>

      <div className="mt-5 border-t border-neutral-200 pt-4">
        <div className="w-full [&>button]:w-full">
          <SignOutButton />
        </div>
      </div>
    </aside>
  );
}
