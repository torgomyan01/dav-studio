'use server';

import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

import { prisma } from '@/lib/prisma';
import { routes } from '@/utils/consts';

export type CreateAccessorySaleState =
  | { ok: true; message: string }
  | { ok: false; message: string };

type AccessorySaleActionState =
  | { ok: true; message: string }
  | { ok: false; message: string };

export async function createAccessorySale(input: {
  accessoryId: string;
  quantity: string;
  unitSalePrice: string;
}): Promise<CreateAccessorySaleState> {
  const accessoryId = input.accessoryId.trim();
  const quantity = Number(input.quantity);
  const unitSalePrice = Number(input.unitSalePrice);

  if (!accessoryId) return { ok: false, message: 'Ընտրեք ակսեսուարը։' };
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return { ok: false, message: 'Քանակը պետք է լինի դրական ամբողջ թիվ։' };
  }
  if (!Number.isFinite(unitSalePrice) || unitSalePrice < 0) {
    return { ok: false, message: 'Վաճառքի գինը պետք է լինի 0 կամ դրական թիվ։' };
  }

  const accessory = await prisma.accessory.findUnique({ where: { id: accessoryId } });
  if (!accessory) return { ok: false, message: 'Ակսեսուարը չի գտնվել։' };
  if (accessory.quantity < quantity) {
    return {
      ok: false,
      message: `Պահեստում բավարար քանակ չկա։ Մնացել է ${accessory.quantity} հատ։`,
    };
  }

  const totalSalePrice = unitSalePrice * quantity;

  await prisma.$transaction([
    prisma.accessorySale.create({
      data: {
        accessoryId,
        quantity,
        unitSalePrice,
        totalSalePrice,
      },
    }),
    prisma.accessory.update({
      where: { id: accessoryId },
      data: {
        quantity: {
          decrement: quantity,
        },
      },
    }),
  ]);

  revalidatePath(routes.dashboardAccessorySales);
  revalidatePath(routes.dashboardAccessories);
  revalidatePath(routes.dashboardDebts);
  revalidatePath(routes.dashboardAnalytics);
  revalidatePath(routes.dashboard);

  return { ok: true, message: 'Վաճառքը գրանցվեց և պահեստի քանակը թարմացվեց։' };
}

export async function updateAccessorySale(input: {
  saleId: string;
  accessoryId: string;
  quantity: string;
  unitSalePrice: string;
}): Promise<AccessorySaleActionState> {
  const saleId = input.saleId.trim();
  const accessoryId = input.accessoryId.trim();
  const quantity = Number(input.quantity);
  const unitSalePrice = Number(input.unitSalePrice);

  if (!saleId) return { ok: false, message: 'Վաճառքի ID-ը սխալ է։' };
  if (!accessoryId) return { ok: false, message: 'Ընտրեք ակսեսուարը։' };
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return { ok: false, message: 'Քանակը պետք է լինի դրական ամբողջ թիվ։' };
  }
  if (!Number.isFinite(unitSalePrice) || unitSalePrice < 0) {
    return { ok: false, message: 'Վաճառքի գինը պետք է լինի 0 կամ դրական թիվ։' };
  }

  const result = await prisma.$transaction(async (tx): Promise<AccessorySaleActionState> => {
    const sale = await tx.accessorySale.findUnique({
      where: { id: saleId },
      select: {
        id: true,
        accessoryId: true,
        quantity: true,
        debt: {
          select: {
            id: true,
            paidAmount: true,
            dueDate: true,
          },
        },
      },
    });
    if (!sale) return { ok: false, message: 'Վաճառքը չի գտնվել։' };

    const accessory = await tx.accessory.findUnique({
      where: { id: accessoryId },
      select: { id: true, quantity: true },
    });
    if (!accessory) return { ok: false, message: 'Ակսեսուարը չի գտնվել։' };

    const availableQuantity =
      sale.accessoryId === accessoryId ? accessory.quantity + sale.quantity : accessory.quantity;
    if (availableQuantity < quantity) {
      return {
        ok: false,
        message: `Պահեստում բավարար քանակ չկա։ Հասանելի է ${availableQuantity} հատ։`,
      };
    }

    const totalSalePrice = unitSalePrice * quantity;

    await tx.accessory.update({
      where: { id: sale.accessoryId },
      data: { quantity: { increment: sale.quantity } },
    });
    await tx.accessory.update({
      where: { id: accessoryId },
      data: { quantity: { decrement: quantity } },
    });
    await tx.accessorySale.update({
      where: { id: saleId },
      data: {
        accessoryId,
        quantity,
        unitSalePrice,
        totalSalePrice,
      },
    });

    if (sale.debt) {
      const paidAmount = Number(sale.debt.paidAmount.toString());
      const remainingAmount = Math.max(totalSalePrice - paidAmount, 0);
      await tx.debt.update({
        where: { id: sale.debt.id },
        data: {
          totalAmount: totalSalePrice,
          remainingAmount,
          status: computeDebtStatus(totalSalePrice, paidAmount, sale.debt.dueDate, new Date()),
        },
      });
    }

    return { ok: true, message: 'Վաճառքը թարմացվեց և պահեստը վերահաշվարկվեց։' };
  });

  revalidateAccessorySalePaths();
  return result;
}

export async function deleteAccessorySale(saleIdRaw: string): Promise<AccessorySaleActionState> {
  const saleId = saleIdRaw.trim();
  if (!saleId) return { ok: false, message: 'Վաճառքի ID-ը սխալ է։' };

  const sale = await prisma.accessorySale.findUnique({
    where: { id: saleId },
    select: {
      id: true,
      accessoryId: true,
      quantity: true,
      debt: { select: { id: true, remainingAmount: true } },
    },
  });
  if (!sale) return { ok: false, message: 'Վաճառքը չի գտնվել։' };
  if (sale.debt) {
    return {
      ok: false,
      message: `Այս վաճառքը չի կարելի ջնջել, որովհետև դրա հիման վրա պարտք է բացված։ Մնացորդ՝ ${Number(sale.debt.remainingAmount.toString()).toLocaleString('hy-AM')} դրամ։`,
    };
  }

  try {
    await prisma.$transaction([
      prisma.accessorySale.delete({ where: { id: saleId } }),
      prisma.accessory.update({
        where: { id: sale.accessoryId },
        data: { quantity: { increment: sale.quantity } },
      }),
    ]);
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return { ok: false, message: 'Վաճառքը չի գտնվել (հնարավոր է արդեն ջնջված է)։' };
      }
      if (error.code === 'P2003') {
        return {
          ok: false,
          message: 'Այս վաճառքը կապված է այլ գրառումների հետ և չի կարող ջնջվել։',
        };
      }
    }
    return { ok: false, message: 'Ջնջումը չհաջողվեց։ Խնդրում ենք փորձել կրկին։' };
  }

  revalidateAccessorySalePaths();
  return { ok: true, message: 'Վաճառքը ջնջվեց և պահեստի քանակը վերադարձվեց։' };
}

function revalidateAccessorySalePaths() {
  revalidatePath(routes.dashboardAccessorySales);
  revalidatePath(routes.dashboardAccessories);
  revalidatePath(routes.dashboardDebts);
  revalidatePath(routes.dashboardAnalytics);
  revalidatePath(routes.dashboard);
}

function computeDebtStatus(totalAmount: number, paidAmount: number, dueDate: Date | null, now: Date) {
  const remaining = totalAmount - paidAmount;
  if (remaining <= 0) return 'PAID' as const;
  if (dueDate && dueDate.getTime() < now.getTime()) return 'OVERDUE' as const;
  if (paidAmount > 0) return 'PARTIALLY_PAID' as const;
  return 'ACTIVE' as const;
}
