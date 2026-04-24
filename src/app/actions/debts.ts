'use server';

import { DebtSourceType } from '@prisma/client';
import { revalidatePath } from 'next/cache';

import { prisma } from '@/lib/prisma';
import { normalizePhone } from '@/utils/phone';
import { routes } from '@/utils/consts';

type ActionState = { ok: true; message: string } | { ok: false; message: string };
type DebtSourcePayload =
  | { ok: false; message: string }
  | {
      ok: true;
      accessorySaleId: string | null;
      repairOrderId: string | null;
      totalAmount: number;
      fallbackCustomerName: string;
      fallbackCustomerPhone: string;
    };
type DebtPaymentPayload = { ok: true } | { ok: false; message: string };

export async function createDebt(input: {
  sourceType: DebtSourceType;
  sourceId: string;
  customerName: string;
  customerPhone: string;
  dueDate?: string;
}): Promise<ActionState> {
  const sourceType = input.sourceType;
  const sourceId = input.sourceId.trim();
  const customerNameInput = input.customerName.trim();
  const customerPhone = normalizePhone(input.customerPhone);
  const dueDate = parseDueDate(input.dueDate);

  if (!sourceId) return { ok: false, message: 'Ընտրեք աղբյուրի գրառումը։' };
  if (!customerPhone) return { ok: false, message: 'Մուտքագրեք հաճախորդի հեռախոսահամարը։' };

  const payload = await prisma.$transaction(async (tx): Promise<DebtSourcePayload> => {
    if (sourceType === 'ACCESSORY_SALE') {
      const sale = await tx.accessorySale.findUnique({
        where: { id: sourceId },
        select: { id: true, totalSalePrice: true, debt: { select: { id: true } } },
      });
      if (!sale) return { ok: false, message: 'Ընտրված ակսեսուարի վաճառքը չի գտնվել։' };
      if (sale.debt) return { ok: false, message: 'Այս վաճառքի համար արդեն կա պարտք։' };
      return {
        ok: true,
        accessorySaleId: sale.id,
        repairOrderId: null,
        totalAmount: toNumber(sale.totalSalePrice),
        fallbackCustomerName: '',
        fallbackCustomerPhone: '',
      };
    }

    const repair = await tx.repairOrder.findUnique({
      where: { id: sourceId },
      select: {
        id: true,
        customerName: true,
        customerPhone: true,
        expenses: true,
        netProfit: true,
        debt: { select: { id: true } },
      },
    });
    if (!repair) return { ok: false, message: 'Ընտրված վերանորոգման պատվերը չի գտնվել։' };
    if (repair.debt) return { ok: false, message: 'Այս պատվերի համար արդեն կա պարտք։' };
    return {
      ok: true,
      accessorySaleId: null,
      repairOrderId: repair.id,
      totalAmount: toNumber(repair.expenses) + toNumber(repair.netProfit),
      fallbackCustomerName: repair.customerName,
      fallbackCustomerPhone: normalizePhone(repair.customerPhone ?? ''),
    };
  });

  if (!payload.ok) return { ok: false, message: payload.message };

  const customerName = customerNameInput || payload.fallbackCustomerName;
  if (!customerName) return { ok: false, message: 'Մուտքագրեք հաճախորդի անունը։' };

  const now = new Date();
  const status = computeStatus(payload.totalAmount, 0, dueDate, now);

  await prisma.debt.create({
    data: {
      sourceType,
      accessorySaleId: payload.accessorySaleId,
      repairOrderId: payload.repairOrderId,
      customerName,
      customerPhone: customerPhone || payload.fallbackCustomerPhone,
      totalAmount: payload.totalAmount,
      paidAmount: 0,
      remainingAmount: payload.totalAmount,
      dueDate,
      status,
    },
  });

  revalidatePath(routes.dashboardDebts);
  revalidatePath(routes.dashboardAnalytics);
  revalidatePath(routes.dashboard);
  return { ok: true, message: 'Պարտքը հաջողությամբ ավելացվեց։' };
}

export async function addDebtPayment(input: {
  debtId: string;
  amount: string;
  note?: string;
}): Promise<ActionState> {
  const debtId = input.debtId.trim();
  const amount = Number(input.amount);
  const note = input.note?.trim();

  if (!debtId) return { ok: false, message: 'Պարտքի ID-ը սխալ է։' };
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, message: 'Մարման գումարը պետք է լինի դրական թիվ։' };
  }

  const result = await prisma.$transaction(async (tx): Promise<DebtPaymentPayload> => {
    const debt = await tx.debt.findUnique({
      where: { id: debtId },
      select: {
        id: true,
        paidAmount: true,
        remainingAmount: true,
        dueDate: true,
      },
    });
    if (!debt) return { ok: false, message: 'Պարտքը չի գտնվել։' };

    const paidAmount = toNumber(debt.paidAmount);
    const remainingAmount = toNumber(debt.remainingAmount);

    if (remainingAmount <= 0) {
      return { ok: false, message: 'Այս պարտքը արդեն ամբողջությամբ մարված է։' };
    }
    if (amount > remainingAmount) {
      return {
        ok: false,
        message: `Մարման գումարը չպետք է գերազանցի մնացորդը (${remainingAmount.toLocaleString('hy-AM')} դրամ)։`,
      };
    }

    const nextPaidAmount = paidAmount + amount;
    const nextRemainingAmount = remainingAmount - amount;
    const totalAmount = paidAmount + remainingAmount;
    const status = computeStatus(totalAmount, nextPaidAmount, debt.dueDate, new Date());

    await tx.debtPayment.create({
      data: {
        debtId,
        amount,
        note: note || null,
      },
    });

    await tx.debt.update({
      where: { id: debtId },
      data: {
        paidAmount: nextPaidAmount,
        remainingAmount: nextRemainingAmount,
        status,
      },
    });

    return { ok: true };
  });

  if (!result.ok) return { ok: false, message: result.message };

  revalidatePath(routes.dashboardDebts);
  revalidatePath(routes.dashboardAnalytics);
  revalidatePath(routes.dashboard);
  return { ok: true, message: 'Մարումը գրանցվեց։' };
}

function parseDueDate(raw?: string): Date | null {
  if (!raw?.trim()) return null;
  const date = new Date(raw);
  if (!Number.isFinite(date.getTime())) return null;
  return date;
}

function toNumber(v: { toString(): string }): number {
  return Number(v.toString());
}

function computeStatus(totalAmount: number, paidAmount: number, dueDate: Date | null, now: Date) {
  const remaining = totalAmount - paidAmount;
  if (remaining <= 0) return 'PAID' as const;
  if (dueDate && dueDate.getTime() < now.getTime()) return 'OVERDUE' as const;
  if (paidAmount > 0) return 'PARTIALLY_PAID' as const;
  return 'ACTIVE' as const;
}
