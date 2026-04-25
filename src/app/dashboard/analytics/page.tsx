import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { AnalyticsCharts } from '@/components/dashboard/analytics-charts';
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
import { authOptions } from '@/lib/auth';
import { canAccessDashboardPage } from '@/lib/dashboard-permissions';
import { prisma } from '@/lib/prisma';
import { routes } from '@/utils/consts';

type RepairLike = {
  createdAt: Date;
  status: 'IN_PROGRESS' | 'READY_FOR_PICKUP' | 'COMPLETED';
  expenses: { toString(): string };
  netProfit: { toString(): string };
  deviceName: string;
};

type AccessoryLike = {
  createdAt: Date;
  costPrice: { toString(): string };
  quantity: number;
  name: string;
};

type DebtLike = {
  createdAt: Date;
  dueDate: Date | null;
  totalAmount: { toString(): string };
  remainingAmount: { toString(): string };
};

type DebtPaymentLike = {
  paidAt: Date;
  amount: { toString(): string };
};

type Metrics = {
  repairsCount: number;
  completedRepairs: number;
  inProgressRepairs: number;
  readyRepairs: number;
  expensesTotal: number;
  netProfitTotal: number;
  averageProfit: number;
  accessoriesCount: number;
  accessoriesQuantity: number;
  accessoriesValue: number;
  debtsCount: number;
  debtOutstanding: number;
  debtCollected: number;
  overdueDebts: number;
};

type TrendRow = {
  label: string;
  repairs: number;
  expenses: number;
  profit: number;
};

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect(routes.home);
  }
  if (!canAccessDashboardPage(session.user.role, 'analytics')) {
    redirect(routes.dashboard);
  }

  const [repairs, accessories, debts, debtPayments] = await Promise.all([
    prisma.repairOrder.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        createdAt: true,
        status: true,
        expenses: true,
        netProfit: true,
        deviceName: true,
      },
    }),
    prisma.accessory.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        createdAt: true,
        costPrice: true,
        quantity: true,
        name: true,
      },
    }),
    prisma.debt.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        createdAt: true,
        dueDate: true,
        totalAmount: true,
        remainingAmount: true,
      },
    }),
    prisma.debtPayment.findMany({
      orderBy: { paidAt: 'desc' },
      select: {
        paidAt: true,
        amount: true,
      },
    }),
  ]);

  const now = new Date();
  const dayStart = startOfDay(now);
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);
  const yearStart = startOfYear(now);

  const daily = computeMetrics(
    repairs.filter((r) => r.createdAt >= dayStart),
    accessories.filter((a) => a.createdAt >= dayStart),
    debts.filter((d) => d.createdAt >= dayStart),
    debtPayments.filter((p) => p.paidAt >= dayStart),
  );
  const weekly = computeMetrics(
    repairs.filter((r) => r.createdAt >= weekStart),
    accessories.filter((a) => a.createdAt >= weekStart),
    debts.filter((d) => d.createdAt >= weekStart),
    debtPayments.filter((p) => p.paidAt >= weekStart),
  );
  const monthly = computeMetrics(
    repairs.filter((r) => r.createdAt >= monthStart),
    accessories.filter((a) => a.createdAt >= monthStart),
    debts.filter((d) => d.createdAt >= monthStart),
    debtPayments.filter((p) => p.paidAt >= monthStart),
  );
  const yearly = computeMetrics(
    repairs.filter((r) => r.createdAt >= yearStart),
    accessories.filter((a) => a.createdAt >= yearStart),
    debts.filter((d) => d.createdAt >= yearStart),
    debtPayments.filter((p) => p.paidAt >= yearStart),
  );
  const allTime = computeMetrics(repairs, accessories, debts, debtPayments);

  const topDevices = summarizeRepairsByDevice(repairs).slice(0, 8);
  const topAccessories = summarizeAccessoriesByName(accessories).slice(0, 8);

  const dailyTrend = buildDailyTrendLastDays(repairs, 7);
  const weeklyTrend = buildWeeklyTrendLastWeeks(repairs, 8);
  const monthlyTrend = buildMonthlyTrendLastMonths(repairs, 12);
  const yearlyTrend = buildYearlyTrendLastYears(repairs, 5);

  return (
    <main className="min-h-screen bg-neutral-50 px-3 py-3 sm:px-4 sm:py-8 lg:pl-76">
      <DashboardSidebar session={session} active="analytics" />

      <div className="mx-auto max-w-7xl">
        <section className="space-y-6 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-8">
          <header className="border-b border-neutral-200 pb-4">
            <h2 className="text-2xl font-semibold text-neutral-900">Անալիտիկա և հաշվարկներ</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Օրական, շաբաթական, ամսական և տարեկան հաշվարկները ցուցադրված են Chart.js գրաֆիկներով։
            </p>
          </header>

          <AnalyticsCharts
            allTime={allTime}
            daily={daily}
            weekly={weekly}
            monthly={monthly}
            yearly={yearly}
            topDevices={topDevices}
            topAccessories={topAccessories}
            dailyTrend={dailyTrend}
            weeklyTrend={weeklyTrend}
            monthlyTrend={monthlyTrend}
            yearlyTrend={yearlyTrend}
          />
        </section>
      </div>
    </main>
  );
}

function toNumber(v: { toString(): string }): number {
  return Number(v.toString());
}

function computeMetrics(
  repairs: RepairLike[],
  accessories: AccessoryLike[],
  debts: DebtLike[],
  debtPayments: DebtPaymentLike[],
): Metrics {
  const repairsCount = repairs.length;
  const completedRepairs = repairs.filter((r) => r.status === 'COMPLETED').length;
  const inProgressRepairs = repairs.filter((r) => r.status === 'IN_PROGRESS').length;
  const readyRepairs = repairs.filter((r) => r.status === 'READY_FOR_PICKUP').length;
  const expensesTotal = repairs.reduce((sum, r) => sum + toNumber(r.expenses), 0);
  const netProfitTotal = repairs.reduce((sum, r) => sum + toNumber(r.netProfit), 0);
  const averageProfit = repairsCount === 0 ? 0 : netProfitTotal / repairsCount;
  const accessoriesCount = accessories.length;
  const accessoriesQuantity = accessories.reduce((sum, a) => sum + a.quantity, 0);
  const accessoriesValue = accessories.reduce((sum, a) => sum + toNumber(a.costPrice) * a.quantity, 0);
  const debtsCount = debts.length;
  const debtOutstanding = debts.reduce((sum, d) => sum + toNumber(d.remainingAmount), 0);
  const debtCollected = debtPayments.reduce((sum, p) => sum + toNumber(p.amount), 0);
  const overdueDebts = debts.filter(
    (d) => toNumber(d.remainingAmount) > 0 && d.dueDate && d.dueDate.getTime() < Date.now(),
  ).length;

  return {
    repairsCount,
    completedRepairs,
    inProgressRepairs,
    readyRepairs,
    expensesTotal,
    netProfitTotal,
    averageProfit,
    accessoriesCount,
    accessoriesQuantity,
    accessoriesValue,
    debtsCount,
    debtOutstanding,
    debtCollected,
    overdueDebts,
  };
}

function summarizeRepairsByDevice(repairs: RepairLike[]) {
  const map = new Map<string, number>();
  for (const row of repairs) {
    const key = row.deviceName.trim() || 'Անվանում չկա';
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

function summarizeAccessoriesByName(accessories: AccessoryLike[]) {
  const map = new Map<string, { quantity: number; value: number }>();
  for (const row of accessories) {
    const key = row.name.trim() || 'Անվանում չկա';
    const prev = map.get(key) ?? { quantity: 0, value: 0 };
    map.set(key, {
      quantity: prev.quantity + row.quantity,
      value: prev.value + toNumber(row.costPrice) * row.quantity,
    });
  }
  return [...map.entries()]
    .map(([name, v]) => ({ name, quantity: v.quantity, value: v.value }))
    .sort((a, b) => b.quantity - a.quantity);
}

function buildDailyTrendLastDays(repairs: RepairLike[], days: number) {
  const rows: TrendRow[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const day = new Date(now);
    day.setDate(now.getDate() - i);
    const from = startOfDay(day);
    const to = new Date(from);
    to.setDate(from.getDate() + 1);
    rows.push(trendRow(formatDate(from), repairsInRange(repairs, from, to)));
  }
  return rows;
}

function buildWeeklyTrendLastWeeks(repairs: RepairLike[], weeks: number) {
  const rows: TrendRow[] = [];
  const nowWeekStart = startOfWeek(new Date());
  for (let i = weeks - 1; i >= 0; i -= 1) {
    const from = new Date(nowWeekStart);
    from.setDate(nowWeekStart.getDate() - i * 7);
    const to = new Date(from);
    to.setDate(from.getDate() + 7);
    rows.push(trendRow(`${formatDate(from)} - ${formatDate(new Date(to.getTime() - 1))}`, repairsInRange(repairs, from, to)));
  }
  return rows;
}

function buildMonthlyTrendLastMonths(repairs: RepairLike[], months: number) {
  const rows: TrendRow[] = [];
  const base = startOfMonth(new Date());
  for (let i = months - 1; i >= 0; i -= 1) {
    const from = new Date(base.getFullYear(), base.getMonth() - i, 1);
    const to = new Date(from.getFullYear(), from.getMonth() + 1, 1);
    rows.push(trendRow(`${from.getMonth() + 1}.${from.getFullYear()}`, repairsInRange(repairs, from, to)));
  }
  return rows;
}

function buildYearlyTrendLastYears(repairs: RepairLike[], years: number) {
  const rows: TrendRow[] = [];
  const nowYear = new Date().getFullYear();
  for (let i = years - 1; i >= 0; i -= 1) {
    const y = nowYear - i;
    const from = new Date(y, 0, 1);
    const to = new Date(y + 1, 0, 1);
    rows.push(trendRow(String(y), repairsInRange(repairs, from, to)));
  }
  return rows;
}

function repairsInRange(repairs: RepairLike[], from: Date, to: Date) {
  return repairs.filter((r) => r.createdAt >= from && r.createdAt < to);
}

function trendRow(label: string, repairs: RepairLike[]): TrendRow {
  const expenses = repairs.reduce((sum, r) => sum + toNumber(r.expenses), 0);
  const profit = repairs.reduce((sum, r) => sum + toNumber(r.netProfit), 0);
  return { label, repairs: repairs.length, expenses, profit };
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function startOfWeek(d: Date) {
  const dayStart = startOfDay(d);
  const dayIndex = (dayStart.getDay() + 6) % 7;
  const res = new Date(dayStart);
  res.setDate(dayStart.getDate() - dayIndex);
  return res;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function startOfYear(d: Date) {
  return new Date(d.getFullYear(), 0, 1);
}

function formatDate(d: Date) {
  return d.toLocaleDateString('hy-AM');
}
