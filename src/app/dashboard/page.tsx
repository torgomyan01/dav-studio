import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { DashboardDailyIncomeDetails } from '@/components/dashboard/dashboard-daily-income-details';
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
  const now = new Date();
  const todayStart = startOfDay(now);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(todayStart.getDate() - 1);
  const weekStart = startOfWeek(now);

  const [
    todayAccessorySales,
    yesterdayAccessorySales,
    todayRepairs,
    yesterdayRepairs,
    weekAccessorySales,
    weekRepairs,
    lowStockAccessories,
    overdueDebts,
    todayDebtPayments,
    todayCashExpenses,
  ] = await Promise.all([
    prisma.accessorySale.findMany({
      where: { createdAt: { gte: todayStart } },
      select: {
        createdAt: true,
        quantity: true,
        unitSalePrice: true,
        totalSalePrice: true,
        accessory: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.accessorySale.findMany({
      where: { createdAt: { gte: yesterdayStart, lt: todayStart } },
      select: { totalSalePrice: true },
    }),
    prisma.repairOrder.findMany({
      where: repairIncomeWhere(todayStart),
      select: {
        createdAt: true,
        completedAt: true,
        deviceName: true,
        customerName: true,
        customerPhone: true,
        expenses: true,
        netProfit: true,
        description: true,
        status: true,
      },
    }),
    prisma.repairOrder.findMany({
      where: repairIncomeWhere(yesterdayStart, todayStart),
      select: { createdAt: true, completedAt: true, expenses: true, netProfit: true },
    }),
    prisma.accessorySale.findMany({
      where: { createdAt: { gte: weekStart } },
      select: { createdAt: true, totalSalePrice: true },
    }),
    prisma.repairOrder.findMany({
      where: repairIncomeWhere(weekStart),
      select: { createdAt: true, completedAt: true, expenses: true, netProfit: true },
    }),
    prisma.accessory.findMany({
      where: { quantity: { lte: 5 } },
      orderBy: [{ quantity: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, quantity: true },
      take: 8,
    }),
    prisma.debt.findMany({
      where: {
        dueDate: { lt: now },
        remainingAmount: { gt: 0 },
      },
      select: { remainingAmount: true },
    }),
    prisma.debtPayment.findMany({
      where: { paidAt: { gte: todayStart } },
      select: { amount: true },
    }),
    prisma.dailyExpense.findMany({
      where: { spentAt: { gte: todayStart } },
      select: { amount: true },
    }),
  ]);

  const todayAccessoryIncome = sumValues(todayAccessorySales.map((row) => row.totalSalePrice));
  const yesterdayAccessoryIncome = sumValues(yesterdayAccessorySales.map((row) => row.totalSalePrice));
  const todayRepairIncome = sumRepairIncome(todayRepairs);
  const yesterdayRepairIncome = sumRepairIncome(yesterdayRepairs);
  const todayIncome = todayAccessoryIncome + todayRepairIncome;
  const yesterdayIncome = yesterdayAccessoryIncome + yesterdayRepairIncome;
  const remainingToBeatYesterday = Math.max(yesterdayIncome - todayIncome + 1, 0);
  const progressPercent =
    yesterdayIncome <= 0 ? (todayIncome > 0 ? 100 : 0) : Math.min((todayIncome / yesterdayIncome) * 100, 100);
  const todayActionsCount = todayAccessorySales.length + todayRepairs.length;
  const yesterdayActionsCount = yesterdayAccessorySales.length + yesterdayRepairs.length;
  const dailyGoal = Math.max(Math.ceil((yesterdayIncome || 50000) * 1.1), 50000);
  const goalProgressPercent = Math.min((todayIncome / dailyGoal) * 100, 100);
  const weekRecord = getWeekRecord(weekStart, weekAccessorySales, weekRepairs);
  const strongSection = getStrongSection(todayAccessoryIncome, todayRepairIncome);
  const overdueDebtAmount = sumValues(overdueDebts.map((row) => row.remainingAmount));
  const todayDebtPaid = sumValues(todayDebtPayments.map((row) => row.amount));
  const todayCashExpenseTotal = sumValues(todayCashExpenses.map((row) => row.amount));
  const todayCashExpenseCount = todayCashExpenses.length;
  const todayFinalResult = todayIncome - todayCashExpenseTotal;
  const expenseRatio = todayIncome > 0 ? (todayCashExpenseTotal / todayIncome) * 100 : 0;
  const isSlowDay = now.getHours() >= 14 && todayIncome < dailyGoal * 0.35;
  const dayTip = getDayTip(strongSection.key, lowStockAccessories.length, overdueDebts.length, isSlowDay);
  const expenseMotivation = getExpenseMotivation(todayCashExpenseCount, expenseRatio, todayFinalResult);
  const todayAccessoryShare = todayIncome > 0 ? (todayAccessoryIncome / todayIncome) * 100 : 0;
  const todayRepairShare = todayIncome > 0 ? (todayRepairIncome / todayIncome) * 100 : 0;
  const dailyIncomeDetails = {
    accessories: todayAccessorySales.map((item) => ({
      name: item.accessory.name,
      quantity: item.quantity,
      unitSalePrice: toNumber(item.unitSalePrice),
      totalSalePrice: toNumber(item.totalSalePrice),
      createdAt: item.createdAt.toLocaleString('hy-AM'),
    })),
    repairs: todayRepairs.map((item) => ({
      deviceName: item.deviceName,
      customerName: item.customerName,
      customerPhone: item.customerPhone ?? '—',
      expenses: toNumber(item.expenses),
      netProfit: toNumber(item.netProfit),
      totalAmount: toNumber(item.expenses) + toNumber(item.netProfit),
      description: item.description,
      status: statusLabel(item.status),
      createdAt: (item.completedAt ?? item.createdAt).toLocaleString('hy-AM'),
    })),
  };

  return (
    <main className="min-h-screen bg-neutral-50 px-3 py-3 sm:px-4 sm:py-8 lg:pl-76">
      <DashboardSidebar session={session} active="home" />

      <div className="mx-auto max-w-6xl">
        <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-8">
          <header className="mb-6 border-b border-neutral-200 pb-4">
            <h2 className="text-2xl font-semibold text-neutral-900">Վահանակ</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Աջ հատվածում հիմնական աշխատանքային կոնտենտն է։
            </p>
          </header>

          <section className="mb-6 rounded-2xl border border-green/20 bg-linear-to-br from-green/10 via-white to-neutral-50 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-green">
                  Օրվա մոտիվացիա
                </p>
                <h3 className="mt-1 text-xl font-semibold text-neutral-900">
                  {motivationTitle(todayIncome, yesterdayIncome)}
                </h3>
                <p className="mt-2 max-w-2xl text-sm text-neutral-600">
                  {motivationMessage(
                    todayIncome,
                    yesterdayIncome,
                    remainingToBeatYesterday
                  )}
                </p>
              </div>
              <div className="rounded-xl border border-green/20 bg-white px-4 py-3 text-right shadow-sm">
                <p className="text-xs text-neutral-500">Այսօրվա եկամուտ</p>
                <p className="mt-1 text-2xl font-semibold text-green">
                  {formatMoney(todayIncome)}
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  Ծախսերից հետո՝{' '}
                  <span
                    className={
                      todayFinalResult >= 0 ? 'text-green' : 'text-red-700'
                    }
                  >
                    {formatMoney(todayFinalResult)}
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-4">
              <MotivationMetric
                title="Երեկվա եկամուտ"
                value={formatMoney(yesterdayIncome)}
              />
              <MotivationMetric
                title="Երեկը անցնելու համար"
                value={
                  remainingToBeatYesterday > 0
                    ? formatMoney(remainingToBeatYesterday)
                    : 'Արդեն անցել ես'
                }
              />
              <MotivationMetric
                title="Այսօրվա գործարքներ"
                value={`${todayActionsCount} հատ`}
              />
              <MotivationMetric
                title="Երեկվա գործարքներ"
                value={`${yesterdayActionsCount} հատ`}
              />
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <MotivationMetric
                title="Այսօրվա կասայի ծախս"
                value={formatMoney(todayCashExpenseTotal)}
              />
              <MotivationMetric
                title="Օրվա վերջնական արդյունք"
                value={formatMoney(todayFinalResult)}
              />
            </div>

            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-xs text-neutral-500">
                <span>Երեկվա արդյունքը անցնելու պրոգրես</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-neutral-200">
                <div
                  className="h-full rounded-full bg-green"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </section>

          <section className="mb-6 rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-blue-700">
                  Ծախսերի վերահսկում
                </p>
                <h3 className="mt-1 text-lg font-semibold text-neutral-900">
                  {expenseMotivation.title}
                </h3>
                <p className="mt-2 max-w-2xl text-sm text-neutral-600">
                  {expenseMotivation.message}
                </p>
              </div>
              <div className="grid gap-2 text-right sm:grid-cols-2">
                <div className="rounded-xl border border-blue-100 bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs text-neutral-500">Ծախսերի քանակ</p>
                  <p className="mt-1 text-xl font-semibold text-neutral-900">
                    {todayCashExpenseCount} հատ
                  </p>
                </div>
                <div className="rounded-xl border border-blue-100 bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs text-neutral-500">Ծախս / եկամուտ</p>
                  <p
                    className={`mt-1 text-xl font-semibold ${expenseRatio > 35 ? 'text-red-700' : 'text-green'}`}
                  >
                    {Math.round(expenseRatio)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-xs text-neutral-500">
                <span>Ծախսերի հարաբերակցություն եկամտին</span>
                <span>{Math.round(Math.min(expenseRatio, 100))}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white">
                <div
                  className={`h-full rounded-full ${expenseRatio > 35 ? 'bg-red-500' : 'bg-blue-600'}`}
                  style={{ width: `${Math.min(expenseRatio, 100)}%` }}
                />
              </div>
            </div>

            <Link
              href={routes.dashboardExpenses}
              className="mt-3 inline-block text-sm text-blue-700 hover:underline"
            >
              Բացել օրվա ծախսերը →
            </Link>
          </section>

          <section className="mb-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-green">
                  Օրվա եկամտի բաժանում
                </p>
                <h3 className="mt-1 text-lg font-semibold text-neutral-900">
                  Որտեղից է եկել այսօրվա գումարը
                </h3>
                <p className="mt-1 text-sm text-neutral-600">
                  Ակսեսուարների վաճառք՝ {formatMoney(todayAccessoryIncome)} ·
                  Վերանորոգում՝ {formatMoney(todayRepairIncome)}
                </p>
              </div>
              <DashboardDailyIncomeDetails details={dailyIncomeDetails} />
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">
                      Ակսեսուարներից վաճառք
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {todayAccessorySales.length} վաճառք
                    </p>
                  </div>
                  <p className="text-lg font-semibold text-green">
                    {formatMoney(todayAccessoryIncome)}
                  </p>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-200">
                  <div
                    className="h-full rounded-full bg-green"
                    style={{ width: `${todayAccessoryShare}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-neutral-500">
                  Օրվա եկամտի {Math.round(todayAccessoryShare)}%
                </p>
              </div>

              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">
                      Վերանորոգումներից
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {todayRepairs.length} պատվեր
                    </p>
                  </div>
                  <p className="text-lg font-semibold text-green">
                    {formatMoney(todayRepairIncome)}
                  </p>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-200">
                  <div
                    className="h-full rounded-full bg-green"
                    style={{ width: `${todayRepairShare}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-neutral-500">
                  Օրվա եկամտի {Math.round(todayRepairShare)}%
                </p>
              </div>
            </div>
          </section>

          <section className="mb-6 grid gap-4 lg:grid-cols-3">
            <InsightCard
              icon="fa-solid fa-bullseye"
              title="Օրվա նպատակ"
              value={formatMoney(dailyGoal)}
              text={`Այսօր լրացված է ${Math.round(goalProgressPercent)}%։ Նպատակին մնացել է ${formatMoney(Math.max(dailyGoal - todayIncome, 0))}։`}
              progress={goalProgressPercent}
            />
            <InsightCard
              icon="fa-solid fa-trophy"
              title="Շաբաթվա ռեկորդ"
              value={
                weekRecord.income > 0
                  ? formatMoney(weekRecord.income)
                  : 'Դեռ ռեկորդ չկա'
              }
              text={
                weekRecord.income > 0
                  ? `${weekRecord.label} օրն է շաբաթվա ամենաուժեղը։ Այսօր փորձիր մոտենալ կամ անցնել այդ արդյունքը։`
                  : 'Այս շաբաթվա առաջին ուժեղ արդյունքը կարող է լինել հենց այսօր։'
              }
            />
            <InsightCard
              icon="fa-solid fa-chart-simple"
              title="Այսօրվա ուժեղ բաժին"
              value={strongSection.label}
              text={strongSection.message}
            />
          </section>

          <section className="mb-6 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-neutral-900">
                Պարտքերի առողջություն
              </p>
              <p className="mt-2 text-sm text-neutral-600">
                Այսօր մարվել է{' '}
                <span className="font-semibold text-green">
                  {formatMoney(todayDebtPaid)}
                </span>
                ։
              </p>
              <p
                className={`mt-1 text-sm ${overdueDebts.length > 0 ? 'text-red-700' : 'text-neutral-600'}`}
              >
                Ժամկետանց պարտքեր՝ {overdueDebts.length} հատ (
                {formatMoney(overdueDebtAmount)})
              </p>
              <Link
                href={routes.dashboardDebts}
                className="mt-3 inline-block text-sm text-green hover:underline"
              >
                Բացել պարտքերը →
              </Link>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-neutral-900">
                Պահեստի արագ ազդակ
              </p>
              {lowStockAccessories.length === 0 ? (
                <p className="mt-2 text-sm text-neutral-600">
                  Քիչ մնացած ապրանք չկա։ Պահեստը առողջ է։
                </p>
              ) : (
                <div className="mt-2 space-y-1">
                  {lowStockAccessories.map((item) => (
                    <p key={item.id} className="text-sm text-neutral-600">
                      {item.name}՝{' '}
                      <span className="font-semibold text-red-700">
                        {item.quantity} հատ
                      </span>
                    </p>
                  ))}
                </div>
              )}
              <Link
                href={routes.dashboardAccessories}
                className="mt-3 inline-block text-sm text-green hover:underline"
              >
                Բացել պահեստը →
              </Link>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-neutral-900">
                Օրվա խորհուրդ
              </p>
              <p className="mt-2 text-sm text-neutral-600">{dayTip}</p>
              {isSlowDay ? (
                <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  Օրը մի քիչ դանդաղ է գնում․ փորձիր ակտիվացնել աքսեսուարների
                  առաջարկը յուրաքանչյուր հաճախորդի հետ։
                </p>
              ) : null}
            </div>
          </section>

          <section className="mb-6 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-neutral-900">
                  Կասայի օրվա արդյունք
                </p>
                <p className="mt-1 text-sm text-neutral-600">
                  Եկամուտ՝ {formatMoney(todayIncome)} · Ծախս՝{' '}
                  {formatMoney(todayCashExpenseTotal)} · Գրառում՝{' '}
                  {todayCashExpenseCount} հատ
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-neutral-500">Վերջնական արդյունք</p>
                <p
                  className={`text-xl font-semibold ${todayFinalResult >= 0 ? 'text-green' : 'text-red-700'}`}
                >
                  {formatMoney(todayFinalResult)}
                </p>
                <Link
                  href={routes.dashboardExpenses}
                  className="mt-2 inline-block text-sm text-green hover:underline"
                >
                  Գրանցել ծախս →
                </Link>
              </div>
            </div>
          </section>

          <section className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
                  Պահեստի վերահսկում
                </p>
                <h3 className="mt-1 text-lg font-semibold text-neutral-900">
                  Ավարտվող ապրանքներ
                </h3>
                <p className="mt-1 text-sm text-neutral-600">
                  Այստեղ երևում են այն ապրանքները, որոնց մնացորդը 5 հատ կամ
                  պակաս է։
                </p>
              </div>
              <Link
                href={routes.dashboardAccessories}
                className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-amber-800 hover:bg-amber-100"
              >
                Բացել ամբողջ պահեստը →
              </Link>
            </div>

            {lowStockAccessories.length === 0 ? (
              <p className="mt-4 rounded-xl border border-amber-100 bg-white px-4 py-3 text-sm text-neutral-600">
                Այս պահին ավարտվող ապրանքներ չկան։ Պահեստի մնացորդները նորմալ
                են։
              </p>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {lowStockAccessories.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-amber-100 bg-white p-3 shadow-sm"
                  >
                    <p className="line-clamp-2 text-sm font-semibold text-neutral-900">
                      {item.name}
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="text-xs text-neutral-500">Մնացորդ</span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          item.quantity === 0
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.quantity === 0
                          ? 'Սպառված'
                          : `${item.quantity} հատ`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-xs text-neutral-500">
                Ակսեսուարներ (ընդհանուր)
              </p>
              <p className="mt-2 text-lg font-semibold text-neutral-900">
                {accessoryCount}
              </p>
              <Link
                href={routes.dashboardAccessories}
                className="mt-2 inline-block text-sm text-green hover:underline"
              >
                Բացել էջը →
              </Link>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-xs text-neutral-500">
                Վերանորոգման պատվերներ (ընդհանուր)
              </p>
              <p className="mt-2 text-lg font-semibold text-neutral-900">
                {repairsCount}
              </p>
              <Link
                href={routes.dashboardRepairs}
                className="mt-2 inline-block text-sm text-green hover:underline"
              >
                Բացել էջը →
              </Link>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-xs text-neutral-500">
                Ակսեսուարի վաճառքներ (ընդհանուր)
              </p>
              <p className="mt-2 text-lg font-semibold text-neutral-900">
                {accessorySalesCount}
              </p>
              <Link
                href={routes.dashboardAccessorySales}
                className="mt-2 inline-block text-sm text-green hover:underline"
              >
                Բացել էջը →
              </Link>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-xs text-neutral-500">Հաշվարկային անալիտիկա</p>
              <p className="mt-2 text-lg font-semibold text-neutral-900">
                4 կտրվածք
              </p>
              <Link
                href={routes.dashboardAnalytics}
                className="mt-2 inline-block text-sm text-green hover:underline"
              >
                Բացել էջը →
              </Link>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-xs text-neutral-500">Պարտքեր (ընդհանուր)</p>
              <p className="mt-2 text-lg font-semibold text-neutral-900">
                {debtsCount}
              </p>
              <Link
                href={routes.dashboardDebts}
                className="mt-2 inline-block text-sm text-green hover:underline"
              >
                Բացել էջը →
              </Link>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-xs text-neutral-500">Այսօրվա կասայի ծախս</p>
              <p className="mt-2 text-lg font-semibold text-neutral-900">
                {formatMoney(todayCashExpenseTotal)}
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                {todayCashExpenseCount} գրառում
              </p>
              <Link
                href={routes.dashboardExpenses}
                className="mt-2 inline-block text-sm text-green hover:underline"
              >
                Բացել էջը →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
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

function repairIncomeWhere(from: Date, to?: Date) {
  const range = to ? { gte: from, lt: to } : { gte: from };
  return {
    status: 'COMPLETED' as const,
    OR: [
      { completedAt: range },
      {
        completedAt: null,
        createdAt: range,
      },
    ],
  };
}

function toNumber(v: { toString(): string }): number {
  return Number(v.toString());
}

function sumValues(values: Array<{ toString(): string }>) {
  return values.reduce<number>((sum, value) => sum + toNumber(value), 0);
}

function sumRepairIncome(rows: Array<{ expenses: { toString(): string }; netProfit: { toString(): string } }>) {
  return rows.reduce<number>((sum, row) => sum + toNumber(row.expenses) + toNumber(row.netProfit), 0);
}

function formatMoney(value: number) {
  return `${value.toLocaleString('hy-AM', { maximumFractionDigits: 0 })} դրամ`;
}

function statusLabel(status: string) {
  if (status === 'READY_FOR_PICKUP') return 'Պատրաստ է վերցնելու';
  if (status === 'COMPLETED') return 'Ավարտված';
  return 'Ընթացքի մեջ';
}

function motivationTitle(todayIncome: number, yesterdayIncome: number) {
  if (todayIncome === 0 && yesterdayIncome === 0) return 'Այսօր լավ օր սկսելու ժամանակն է';
  if (todayIncome > yesterdayIncome) return 'Այսօր արդեն անցել ես երեկվա արդյունքը';
  if (todayIncome === yesterdayIncome && todayIncome > 0) return 'Այսօր հավասարվել ես երեկվան';
  return 'Այսօր նպատակդ երեկվա արդյունքը գերազանցելն է';
}

function motivationMessage(todayIncome: number, yesterdayIncome: number, remaining: number) {
  if (todayIncome > yesterdayIncome) {
    return 'Շատ լավ տեմպ է․ հիմա նպատակն է պահել ռիթմը և օրը փակել ավելի ուժեղ արդյունքով։';
  }
  if (yesterdayIncome === 0) {
    return 'Երեկ եկամուտ չի գրանցվել, այսօրվա ամեն վաճառք կամ պատվեր արդեն առաջընթաց է։';
  }
  return `Երեկվա արդյունքը անցնելու համար մնացել է մոտ ${formatMoney(remaining)}։ Փոքր քայլերով փակիր տարբերությունը՝ մեկ վաճառք, մեկ պատվեր, մեկ լավ սպասարկում։`;
}

function getWeekRecord(
  weekStart: Date,
  accessorySales: Array<{ createdAt: Date; totalSalePrice: { toString(): string } }>,
  repairs: Array<{
    createdAt: Date;
    completedAt: Date | null;
    expenses: { toString(): string };
    netProfit: { toString(): string };
  }>,
) {
  const rows = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + index);
    return { date: day, income: 0 };
  });

  for (const sale of accessorySales) {
    const row = rows.find((item) => isSameDay(item.date, sale.createdAt));
    if (row) row.income += toNumber(sale.totalSalePrice);
  }
  for (const repair of repairs) {
    const row = rows.find((item) => isSameDay(item.date, repair.completedAt ?? repair.createdAt));
    if (row) row.income += toNumber(repair.expenses) + toNumber(repair.netProfit);
  }

  const best = rows.reduce((max, row) => (row.income > max.income ? row : max), rows[0]);
  return {
    income: best.income,
    label: best.date.toLocaleDateString('hy-AM', { weekday: 'long' }),
  };
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getStrongSection(accessoryIncome: number, repairIncome: number) {
  if (accessoryIncome === 0 && repairIncome === 0) {
    return {
      key: 'none',
      label: 'Սկիզբը դեռ առջևում է',
      message: 'Այսօր դեռ եկամուտ չկա․ առաջին գրանցումը կարող է փոխել ամբողջ օրվա տեմպը։',
    };
  }
  if (accessoryIncome >= repairIncome) {
    return {
      key: 'accessories',
      label: 'Ակսեսուարներ',
      message: 'Այսօր աքսեսուարների վաճառքն է առաջ տանում օրը։ Շարունակիր առաջարկել case, ապակի և լիցքավորիչ։',
    };
  }
  return {
    key: 'repairs',
    label: 'Վերանորոգում',
    message: 'Այսօր վերանորոգումներն են ուժեղ։ Յուրաքանչյուր ավարտված պատվերի հետ փորձիր առաջարկել նաև աքսեսուար։',
  };
}

function getDayTip(section: string, lowStockCount: number, overdueDebtCount: number, isSlowDay: boolean) {
  if (overdueDebtCount > 0) return 'Այսօր լավ պահ է մի քանի պարտք հիշեցնելու համար․ նույնիսկ փոքր մարումը ուժեղացնում է դրամական հոսքը։';
  if (lowStockCount > 0) return 'Քիչ մնացած ապրանքները պահիր ուշադրության կենտրոնում․ դրանք հաճախ արագ շարժվող դիրքեր են։';
  if (isSlowDay) return 'Յուրաքանչյուր հաճախորդի հետ արա մեկ հավելյալ առաջարկ․ փոքր վաճառքներն են փրկում դանդաղ օրերը։';
  if (section === 'repairs') return 'Վերանորոգումից հետո առաջարկիր պաշտպանիչ ապակի կամ case․ հաճախորդն արդեն վստահում է քեզ։';
  if (section === 'accessories') return 'Ակսեսուարների վաճառքը լավ է գնում․ փորձիր զույգերով առաջարկել՝ case + ապակի։';
  return 'Այսօր սկսիր մեկ փոքր հաղթանակից՝ մեկ վաճառք, մեկ պատվեր, մեկ գոհ հաճախորդ։';
}

function getExpenseMotivation(expenseCount: number, expenseRatio: number, finalResult: number) {
  if (expenseCount === 0) {
    return {
      title: 'Այսօր կասայից ծախս դեռ չկա',
      message: 'Լավ սկիզբ է․ եթե ծախս լինի, գրանցիր անմիջապես, որ օրվա իրական արդյունքը միշտ պարզ երևա։',
    };
  }
  if (finalResult < 0) {
    return {
      title: 'Ծախսերը գերազանցել են օրվա եկամուտը',
      message: 'Այսօր պետք է ուշադիր լինել․ փորձիր մինչև օրվա վերջ ավելացնել վաճառք կամ հավաքել պարտքի մարում, որ կասան դրական փակվի։',
    };
  }
  if (expenseRatio > 35) {
    return {
      title: 'Ծախսերը բարձր են օրվա եկամտի համեմատ',
      message: 'Ծախսերը վերահսկելի պահելու համար նոր վճարումից առաջ ստուգիր՝ արդյոք այն այսօր պարտադիր է, թե կարելի է տեղափոխել։',
    };
  }
  return {
    title: 'Ծախսերը վերահսկելի են',
    message: 'Շարունակիր նույն ձևով գրանցել ամեն դուրս եկած գումարը․ մաքուր արդյունքը ճիշտ տեսնելը օգնում է ավելի լավ որոշումներ անել։',
  };
}

function InsightCard({
  icon,
  title,
  value,
  text,
  progress,
}: {
  icon: string;
  title: string;
  value: string;
  text: string;
  progress?: number;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className={`text-green ${icon}`} aria-hidden />
        <p className="text-sm font-semibold text-neutral-900">{title}</p>
      </div>
      <p className="mt-2 text-lg font-semibold text-neutral-900">{value}</p>
      <p className="mt-1 text-sm text-neutral-600">{text}</p>
      {typeof progress === 'number' ? (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-200">
          <div className="h-full rounded-full bg-green" style={{ width: `${progress}%` }} />
        </div>
      ) : null}
    </div>
  );
}

function MotivationMetric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-3">
      <p className="text-xs text-neutral-500">{title}</p>
      <p className="mt-1 text-sm font-semibold text-neutral-900">{value}</p>
    </div>
  );
}
