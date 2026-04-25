'use server';

import { revalidatePath } from 'next/cache';

import { prisma } from '@/lib/prisma';
import { routes } from '@/utils/consts';

type ExpenseActionState = { ok: true; message: string } | { ok: false; message: string };

export async function createDailyExpense(input: {
  title: string;
  amount: string;
  description: string;
  spentAt: string;
}): Promise<ExpenseActionState> {
  const title = input.title.trim();
  const amount = Number(input.amount);
  const description = input.description.trim();
  const spentAt = parseDate(input.spentAt) ?? new Date();

  if (!title) return { ok: false, message: 'Մուտքագրեք ծախսի անվանումը։' };
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, message: 'Գումարը պետք է լինի դրական թիվ։' };
  }

  await prisma.dailyExpense.create({
    data: {
      title,
      amount,
      description: description || null,
      spentAt,
    },
  });

  revalidateExpensePaths();
  return { ok: true, message: 'Ծախսը հաջողությամբ գրանցվեց։' };
}

export async function updateDailyExpense(input: {
  id: string;
  title: string;
  amount: string;
  description: string;
  spentAt: string;
}): Promise<ExpenseActionState> {
  const id = input.id.trim();
  const title = input.title.trim();
  const amount = Number(input.amount);
  const description = input.description.trim();
  const spentAt = parseDate(input.spentAt);

  if (!id) return { ok: false, message: 'Ծախսի ID-ը սխալ է։' };
  if (!title) return { ok: false, message: 'Մուտքագրեք ծախսի անվանումը։' };
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, message: 'Գումարը պետք է լինի դրական թիվ։' };
  }
  if (!spentAt) return { ok: false, message: 'Ամսաթիվը սխալ է։' };

  const row = await prisma.dailyExpense.findUnique({ where: { id }, select: { id: true } });
  if (!row) return { ok: false, message: 'Ծախսը չի գտնվել։' };

  await prisma.dailyExpense.update({
    where: { id },
    data: {
      title,
      amount,
      description: description || null,
      spentAt,
    },
  });

  revalidateExpensePaths();
  return { ok: true, message: 'Ծախսը թարմացվեց։' };
}

export async function deleteDailyExpense(idRaw: string): Promise<ExpenseActionState> {
  const id = idRaw.trim();
  if (!id) return { ok: false, message: 'Ծախսի ID-ը սխալ է։' };

  const row = await prisma.dailyExpense.findUnique({ where: { id }, select: { id: true } });
  if (!row) return { ok: false, message: 'Ծախսը չի գտնվել։' };

  await prisma.dailyExpense.delete({ where: { id } });

  revalidateExpensePaths();
  return { ok: true, message: 'Ծախսը ջնջվեց։' };
}

function parseDate(raw: string): Date | null {
  if (!raw.trim()) return null;
  const date = new Date(raw);
  if (!Number.isFinite(date.getTime())) return null;
  return date;
}

function revalidateExpensePaths() {
  revalidatePath(routes.dashboardExpenses);
  revalidatePath(routes.dashboardAnalytics);
  revalidatePath(routes.dashboard);
}
