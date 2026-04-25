import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
import { DebtCreateForm } from '@/components/dashboard/debt-create-form';
import { DebtPaymentForm } from '@/components/dashboard/debt-payment-form';
import { authOptions } from '@/lib/auth';
import { canAccessDashboardPage } from '@/lib/dashboard-permissions';
import { prisma } from '@/lib/prisma';
import { routes } from '@/utils/consts';

export default async function DebtsPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect(routes.home);
  }
  if (!canAccessDashboardPage(session.user.role, 'debts')) {
    redirect(routes.dashboard);
  }

  const [accessorySales, repairOrders, debts] = await Promise.all([
    prisma.accessorySale.findMany({
      where: { debt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        accessory: {
          select: { name: true },
        },
      },
      take: 200,
    }),
    prisma.repairOrder.findMany({
      where: { debt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        deviceName: true,
        customerName: true,
        customerPhone: true,
        expenses: true,
        netProfit: true,
      },
      take: 200,
    }),
    prisma.debt.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        accessorySale: {
          include: {
            accessory: {
              select: { name: true },
            },
          },
        },
        repairOrder: {
          select: {
            id: true,
            deviceName: true,
            createdAt: true,
          },
        },
        payments: {
          orderBy: { paidAt: 'desc' },
          take: 10,
        },
      },
    }),
  ]);

  const accessoryOptions = accessorySales.map((sale) => ({
    id: sale.id,
    label: `${sale.accessory.name} · ${sale.quantity} հատ · ${formatMoney(toNumber(sale.totalSalePrice))} · ${sale.createdAt.toLocaleDateString('hy-AM')}`,
    amount: toNumber(sale.totalSalePrice),
  }));

  const repairOptions = repairOrders.map((repair) => ({
    id: repair.id,
    label: `${repair.deviceName} · ${repair.customerName} · ${formatMoney(toNumber(repair.expenses) + toNumber(repair.netProfit))} · ${repair.createdAt.toLocaleDateString('hy-AM')}`,
    amount: toNumber(repair.expenses) + toNumber(repair.netProfit),
    customerName: repair.customerName,
    customerPhone: repair.customerPhone ?? '',
  }));

  return (
    <main className="min-h-screen bg-neutral-50 px-3 py-3 sm:px-4 sm:py-8 lg:pl-76">
      <DashboardSidebar session={session} active="debts" />

      <div className="mx-auto max-w-7xl">
        <section className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-8">
          <header className="border-b border-neutral-200 pb-4">
            <h2 className="text-2xl font-semibold text-neutral-900">Պարտքեր</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Ավելացրեք պարտքեր միայն ակսեսուարի վաճառքից կամ վերանորոգման պատվերից, և գրանցեք մասամբ մարումները։
            </p>
          </header>

          <DebtCreateForm accessorySales={accessoryOptions} repairOrders={repairOptions} />

          <div className="space-y-3">
            {debts.length === 0 ? (
              <p className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-6 text-sm text-neutral-500">
                Առայժմ պարտքեր չկան։
              </p>
            ) : (
              debts.map((debt) => {
                const status = getEffectiveStatus({
                  status: debt.status,
                  dueDate: debt.dueDate,
                  remaining: toNumber(debt.remainingAmount),
                });
                return (
                  <article key={debt.id} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                    <div className="grid gap-3 lg:grid-cols-[1.6fr_1fr_1.4fr]">
                      <div>
                        <p className="text-sm font-semibold text-neutral-900">
                          {debt.sourceType === 'ACCESSORY_SALE'
                            ? `Ակսեսուարի վաճառք · ${debt.accessorySale?.accessory.name ?? '—'}`
                            : `Վերանորոգում · ${debt.repairOrder?.deviceName ?? '—'}`}
                        </p>
                        <p className="mt-1 text-xs text-neutral-500">
                          {debt.sourceType === 'ACCESSORY_SALE'
                            ? debt.accessorySale?.createdAt.toLocaleDateString('hy-AM')
                            : debt.repairOrder?.createdAt.toLocaleDateString('hy-AM')}
                        </p>
                        <p className="mt-2 text-sm text-neutral-700">
                          {debt.customerName} · {debt.customerPhone}
                        </p>
                      </div>

                      <div className="text-sm text-neutral-700">
                        <p>Ընդհանուր՝ {formatMoney(toNumber(debt.totalAmount))}</p>
                        <p>Մարված՝ {formatMoney(toNumber(debt.paidAmount))}</p>
                        <p className="font-semibold text-neutral-900">
                          Մնացորդ՝ {formatMoney(toNumber(debt.remainingAmount))}
                        </p>
                        <p className="mt-1 text-xs text-neutral-500">
                          Ստատուս՝ <span className="font-medium text-neutral-700">{statusLabel(status)}</span>
                        </p>
                      </div>

                      <div className="space-y-2">
                        <DebtPaymentForm debtId={debt.id} maxAmount={toNumber(debt.remainingAmount)} />
                        <div className="rounded-lg border border-neutral-200 bg-white p-2">
                          <p className="mb-1 text-xs font-medium text-neutral-600">Վերջին մարումներ</p>
                          {debt.payments.length === 0 ? (
                            <p className="text-xs text-neutral-400">Մարում դեռ չկա։</p>
                          ) : (
                            <div className="space-y-1">
                              {debt.payments.map((payment) => (
                                <p key={payment.id} className="text-xs text-neutral-600">
                                  {payment.paidAt.toLocaleDateString('hy-AM')} ·{' '}
                                  <span className="font-medium">{formatMoney(toNumber(payment.amount))}</span>
                                  {payment.note ? ` · ${payment.note}` : ''}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function toNumber(v: { toString(): string }): number {
  return Number(v.toString());
}

function formatMoney(v: number) {
  return `${v.toLocaleString('hy-AM', { maximumFractionDigits: 2 })} դրամ`;
}

function statusLabel(status: 'ACTIVE' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE') {
  const map = {
    ACTIVE: 'Ակտիվ',
    PARTIALLY_PAID: 'Մասամբ մարված',
    PAID: 'Լրիվ մարված',
    OVERDUE: 'Ժամկետանց',
  } as const;
  return map[status];
}

function getEffectiveStatus(input: {
  status: 'ACTIVE' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';
  dueDate: Date | null;
  remaining: number;
}) {
  if (input.remaining <= 0) return 'PAID' as const;
  if (input.dueDate && input.dueDate.getTime() < Date.now()) return 'OVERDUE' as const;
  return input.status;
}
