import type { Role } from '@prisma/client';

import { routes } from '@/utils/consts';

export type DashboardMenuKey =
  | 'home'
  | 'accessories'
  | 'accessorySales'
  | 'repairs'
  | 'expenses'
  | 'debts'
  | 'analytics'
  | 'users';

export const dashboardMenuItems: Array<{
  key: DashboardMenuKey;
  title: string;
  description: string;
  iconClass: string;
  href: string;
  adminOnly?: boolean;
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
    key: 'debts',
    title: 'Պարտքեր',
    description: 'Պարտքով վաճառք և մարումներ',
    iconClass: 'fa-solid fa-hand-holding-dollar',
    href: routes.dashboardDebts,
  },
  {
    key: 'expenses',
    title: 'Օրվա ծախսեր',
    description: 'Կասայից դուրս եկած գումարներ',
    iconClass: 'fa-solid fa-wallet',
    href: routes.dashboardExpenses,
  },
  {
    key: 'analytics',
    title: 'Անալիտիկա',
    description: 'Օրական / շաբաթական / ամսական / տարեկան',
    iconClass: 'fa-solid fa-chart-line',
    href: routes.dashboardAnalytics,
  },
  {
    key: 'users',
    title: 'Օգտատերեր',
    description: 'Աշխատակիցներ և դերեր',
    iconClass: 'fa-solid fa-users',
    href: routes.dashboardUsers,
    adminOnly: true,
  },
];

const workerAllowedPages: DashboardMenuKey[] = ['home', 'accessorySales', 'repairs', 'debts'];

export function canAccessDashboardPage(role: Role, page: DashboardMenuKey) {
  if (role === 'ADMIN') return true;
  if (role === 'MANAGER') return page !== 'users';
  return workerAllowedPages.includes(page);
}

export function getVisibleDashboardMenuItems(role: Role) {
  return dashboardMenuItems.filter((item) => canAccessDashboardPage(role, item.key));
}
