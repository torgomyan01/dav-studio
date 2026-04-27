import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { BackButton } from '@/components/back-button';
import { DailyExpenseCreateForm } from '@/components/dashboard/daily-expense-create-form';
import { DailyExpenseRowActions } from '@/components/dashboard/daily-expense-row-actions';
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
import { authOptions } from '@/lib/auth';
import { canAccessDashboardPage } from '@/lib/dashboard-permissions';
import { prisma } from '@/lib/prisma';
import { routes } from '@/utils/consts';

type ExpensesSearchParams = {
  date?: string;
};

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<ExpensesSearchParams>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect(routes.home);
  }
  if (!canAccessDashboardPage(session.user.role, 'expenses')) {
    redirect(routes.dashboard);
  }

  const now = new Date();
  const todayStart = startOfDay(now);
  const sp = await searchParams;
  const selectedDay = parseDateInput(sp.date) ?? todayStart;
  const selectedDayEnd = new Date(selectedDay);
  selectedDayEnd.setDate(selectedDay.getDate() + 1);
  const selectedDateValue = toDateInputValue(selectedDay);
  const isToday = isSameDay(selectedDay, todayStart);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [expenses, todayExpenses, monthExpenses, expensesCount] = await Promise.all([
    prisma.dailyExpense.findMany({
      where: { spentAt: { gte: selectedDay, lt: selectedDayEnd } },
      orderBy: { spentAt: 'desc' },
    }),
    prisma.dailyExpense.findMany({
      where: { spentAt: { gte: todayStart } },
      select: { amount: true },
    }),
    prisma.dailyExpense.findMany({
      where: { spentAt: { gte: monthStart } },
      select: { amount: true },
    }),
    prisma.dailyExpense.count(),
  ]);

  const selectedDayTotal = sumValues(expenses.map((item) => item.amount));
  const todayTotal = sumValues(todayExpenses.map((item) => item.amount));
  const monthTotal = sumValues(monthExpenses.map((item) => item.amount));

  return (
    <main className="min-h-screen bg-neutral-50 px-3 py-3 sm:px-4 sm:py-8 lg:pl-76">
      <DashboardSidebar session={session} active="expenses" />

      <div className="mx-auto max-w-6xl">
        <BackButton />
        <section className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-8">
          <header className="border-b border-neutral-200 pb-4">
            <h2 className="text-2xl font-semibold text-neutral-900">Օրվա ծախսեր</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Գրանցեք կասայից դուրս եկած գումարները, որպեսզի օրվա վերջնական արդյունքը ճիշտ հաշվարկվի։
            </p>
          </header>

          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard title={isToday ? 'Այսօրվա ծախս' : 'Ընտրված օրվա ծախս'} value={formatMoney(selectedDayTotal)} />
            <MetricCard title="Այս ամսվա ծախս" value={formatMoney(monthTotal)} />
            <MetricCard title="Բոլոր գրանցված ծախսեր" value={`${expensesCount} հատ`} />
          </div>

          <DailyExpenseCreateForm />

          <form
            action={routes.dashboardExpenses}
            className="grid gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 sm:grid-cols-[1fr_auto_auto]"
          >
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-neutral-700">Ընտրել օրը</span>
              <input
                type="date"
                name="date"
                defaultValue={selectedDateValue}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none ring-green transition focus:border-green focus:ring-2"
              />
            </label>
            <button
              type="submit"
              className="self-end rounded-lg bg-green px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green/90"
            >
              Ցույց տալ
            </button>
            {!isToday ? (
              <a
                href={routes.dashboardExpenses}
                className="self-end rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-center text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100"
              >
                Այսօր
              </a>
            ) : null}
          </form>

          <div className="overflow-hidden rounded-xl border border-neutral-200">
            <div className="hidden grid-cols-12 border-b border-neutral-200 bg-neutral-50 px-4 py-3 text-xs font-medium uppercase tracking-wide text-neutral-500 md:grid">
              <p className="col-span-3">Անվանում</p>
              <p className="col-span-2">Գումար</p>
              <p className="col-span-2">Ամսաթիվ</p>
              <p className="col-span-2">Նկարագրություն</p>
              <p className="col-span-3 text-right">Գործողություններ</p>
            </div>

            <div className="divide-y divide-neutral-200">
              {expenses.length === 0 ? (
                <p className="px-4 py-6 text-sm text-neutral-500">
                  {selectedDay.toLocaleDateString('hy-AM')} օրվա համար ծախս գրանցված չէ։
                </p>
              ) : (
                expenses.map((item) => (
                  <div key={item.id} className="grid grid-cols-1 gap-2 px-4 py-4 text-sm text-neutral-800 hover:bg-neutral-50 md:grid-cols-12 md:items-center md:gap-0 md:py-3">
                    <p className="font-semibold text-neutral-900 md:col-span-3 md:font-medium">{item.title}</p>
                    <p className="flex justify-between rounded-lg bg-neutral-50 px-3 py-2 md:col-span-2 md:block md:bg-transparent md:px-0 md:py-0">
                      <span className="text-xs text-neutral-500 md:hidden">Գումար</span>
                      <span>{formatMoney(toNumber(item.amount))}</span>
                    </p>
                    <p className="flex justify-between rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-500 md:col-span-2 md:block md:bg-transparent md:px-0 md:py-0">
                      <span className="md:hidden">Ամսաթիվ</span>
                      <span>{item.spentAt.toLocaleDateString('hy-AM')}</span>
                    </p>
                    <p className="rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-600 md:col-span-2 md:bg-transparent md:px-0 md:py-0">
                      <span className="mb-1 block text-neutral-500 md:hidden">Նկարագրություն</span>
                      {item.description || '—'}
                    </p>
                    <DailyExpenseRowActions
                      expense={{
                        id: item.id,
                        title: item.title,
                        amount: item.amount.toString(),
                        description: item.description ?? '',
                        spentAt: item.spentAt.toISOString().slice(0, 10),
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

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
      <p className="text-xs text-neutral-500">{title}</p>
      <p className="mt-2 text-lg font-semibold text-neutral-900">{value}</p>
    </div>
  );
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function parseDateInput(value?: string) {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  if (!Number.isFinite(date.getTime())) return null;
  return date;
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function toNumber(v: { toString(): string }): number {
  return Number(v.toString());
}

function sumValues(values: Array<{ toString(): string }>) {
  return values.reduce<number>((sum, value) => sum + toNumber(value), 0);
}

function formatMoney(value: number) {
  return `${value.toLocaleString('hy-AM', { maximumFractionDigits: 0 })} դրամ`;
}
