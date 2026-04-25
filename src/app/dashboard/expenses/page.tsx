import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { DailyExpenseCreateForm } from '@/components/dashboard/daily-expense-create-form';
import { DailyExpenseRowActions } from '@/components/dashboard/daily-expense-row-actions';
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { routes } from '@/utils/consts';

export default async function ExpensesPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect(routes.home);
  }

  const now = new Date();
  const todayStart = startOfDay(now);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [expenses, todayExpenses, monthExpenses] = await Promise.all([
    prisma.dailyExpense.findMany({ orderBy: { spentAt: 'desc' } }),
    prisma.dailyExpense.findMany({
      where: { spentAt: { gte: todayStart } },
      select: { amount: true },
    }),
    prisma.dailyExpense.findMany({
      where: { spentAt: { gte: monthStart } },
      select: { amount: true },
    }),
  ]);

  const todayTotal = sumValues(todayExpenses.map((item) => item.amount));
  const monthTotal = sumValues(monthExpenses.map((item) => item.amount));

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-6 sm:py-8 lg:pl-76">
      <DashboardSidebar session={session} active="expenses" />

      <div className="mx-auto max-w-6xl">
        <section className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
          <header className="border-b border-neutral-200 pb-4">
            <h2 className="text-2xl font-semibold text-neutral-900">Օրվա ծախսեր</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Գրանցեք կասայից դուրս եկած գումարները, որպեսզի օրվա վերջնական արդյունքը ճիշտ հաշվարկվի։
            </p>
          </header>

          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard title="Այսօրվա ծախս" value={formatMoney(todayTotal)} />
            <MetricCard title="Այս ամսվա ծախս" value={formatMoney(monthTotal)} />
            <MetricCard title="Գրանցված ծախսեր" value={`${expenses.length} հատ`} />
          </div>

          <DailyExpenseCreateForm />

          <div className="overflow-hidden rounded-xl border border-neutral-200">
            <div className="grid grid-cols-12 border-b border-neutral-200 bg-neutral-50 px-4 py-3 text-xs font-medium uppercase tracking-wide text-neutral-500">
              <p className="col-span-3">Անվանում</p>
              <p className="col-span-2">Գումար</p>
              <p className="col-span-2">Ամսաթիվ</p>
              <p className="col-span-2">Նկարագրություն</p>
              <p className="col-span-3 text-right">Գործողություններ</p>
            </div>

            <div className="divide-y divide-neutral-200">
              {expenses.length === 0 ? (
                <p className="px-4 py-6 text-sm text-neutral-500">Առայժմ ծախս գրանցված չէ։</p>
              ) : (
                expenses.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 px-4 py-3 text-sm text-neutral-800 hover:bg-neutral-50">
                    <p className="col-span-3 font-medium">{item.title}</p>
                    <p className="col-span-2">{formatMoney(toNumber(item.amount))}</p>
                    <p className="col-span-2 text-xs text-neutral-500">{item.spentAt.toLocaleDateString('hy-AM')}</p>
                    <p className="col-span-2 text-xs text-neutral-600">{item.description || '—'}</p>
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

function toNumber(v: { toString(): string }): number {
  return Number(v.toString());
}

function sumValues(values: Array<{ toString(): string }>) {
  return values.reduce<number>((sum, value) => sum + toNumber(value), 0);
}

function formatMoney(value: number) {
  return `${value.toLocaleString('hy-AM', { maximumFractionDigits: 0 })} դրամ`;
}
