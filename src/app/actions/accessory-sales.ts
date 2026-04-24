'use server';

import { revalidatePath } from 'next/cache';

import { prisma } from '@/lib/prisma';
import { routes } from '@/utils/consts';

export type CreateAccessorySaleState =
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
