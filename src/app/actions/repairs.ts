'use server';

import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { Prisma, type RepairStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';

import { prisma } from '@/lib/prisma';
import { getUploadDir } from '@/lib/uploads';
import { routes } from '@/utils/consts';
import { normalizePhone } from '@/utils/phone';

export type CreateRepairOrderState =
  | { ok: true; message: string }
  | { ok: false; message: string };

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export async function createRepairOrder(formData: FormData): Promise<CreateRepairOrderState> {
  const deviceName = String(formData.get('deviceName') ?? '').trim();
  const customerName = String(formData.get('customerName') ?? '').trim();
  const customerPhone = normalizePhone(String(formData.get('customerPhone') ?? ''));
  const description = String(formData.get('description') ?? '').trim();
  const expensesNumber = Number(formData.get('expenses'));
  const netProfitNumber = Number(formData.get('netProfit'));
  const imageFile = formData.get('image');

  if (!deviceName) return { ok: false, message: 'Մուտքագրեք տեխնիկայի անվանումը։' };
  if (!customerName) return { ok: false, message: 'Մուտքագրեք հաճախորդի անունը։' };
  if (!customerPhone) return { ok: false, message: 'Մուտքագրեք հաճախորդի հեռախոսահամարը։' };
  if (!Number.isFinite(expensesNumber) || expensesNumber < 0) {
    return { ok: false, message: 'Ծախսը պետք է լինի 0 կամ դրական թիվ։' };
  }
  if (!Number.isFinite(netProfitNumber)) {
    return { ok: false, message: 'Մաքուր շահույթը պետք է լինի թիվ։' };
  }

  let imageUrl: string | null = null;
  if (imageFile instanceof File && imageFile.size > 0) {
    if (!ALLOWED_IMAGE_TYPES.has(imageFile.type)) {
      return { ok: false, message: 'Նկարի ֆորմատը պետք է լինի JPG, PNG, WEBP կամ GIF։' };
    }
    if (imageFile.size > MAX_IMAGE_SIZE_BYTES) {
      return { ok: false, message: 'Նկարի չափը չպետք է գերազանցի 5MB։' };
    }
    const ext = extensionByMimeType(imageFile.type);
    if (!ext) return { ok: false, message: 'Նկարի ֆորմատը չի աջակցվում։' };

    const uploadsDir = getUploadDir('repairs');
    await mkdir(uploadsDir, { recursive: true });

    const filename = `${Date.now()}-${randomUUID()}.${ext}`;
    const filePath = path.join(uploadsDir, filename);
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    await writeFile(filePath, buffer);

    imageUrl = `/uploads/repairs/${filename}`;
  }

  await prisma.repairOrder.create({
    data: {
      deviceName,
      customerName,
      customerPhone,
      imageUrl,
      expenses: expensesNumber,
      netProfit: netProfitNumber,
      description,
      status: 'IN_PROGRESS',
    },
  });

  revalidatePath(routes.dashboardRepairs);
  revalidatePath(routes.dashboardDebts);
  revalidatePath(routes.dashboard);
  return { ok: true, message: 'Վերանորոգման պատվերը հաջողությամբ ավելացվեց։' };
}

export type UpdateRepairStatusState =
  | { ok: true; message: string }
  | { ok: false; message: string };

type RepairActionState =
  | { ok: true; message: string }
  | { ok: false; message: string };

const nextStatusByCurrent: Record<RepairStatus, RepairStatus | null> = {
  IN_PROGRESS: 'READY_FOR_PICKUP',
  READY_FOR_PICKUP: 'COMPLETED',
  COMPLETED: null,
};

export async function updateRepairOrder(formData: FormData): Promise<RepairActionState> {
  const id = String(formData.get('id') ?? '').trim();
  const deviceName = String(formData.get('deviceName') ?? '').trim();
  const customerName = String(formData.get('customerName') ?? '').trim();
  const customerPhone = normalizePhone(String(formData.get('customerPhone') ?? ''));
  const description = String(formData.get('description') ?? '').trim();
  const expensesNumber = Number(formData.get('expenses'));
  const netProfitNumber = Number(formData.get('netProfit'));
  const removeImage = String(formData.get('removeImage') ?? '') === '1';

  if (!id) return { ok: false, message: 'Պատվերի ID-ը սխալ է։' };
  if (!deviceName) return { ok: false, message: 'Մուտքագրեք տեխնիկայի անվանումը։' };
  if (!customerName) return { ok: false, message: 'Մուտքագրեք հաճախորդի անունը։' };
  if (!customerPhone) return { ok: false, message: 'Մուտքագրեք հաճախորդի հեռախոսահամարը։' };
  if (!Number.isFinite(expensesNumber) || expensesNumber < 0) {
    return { ok: false, message: 'Ծախսը պետք է լինի 0 կամ դրական թիվ։' };
  }
  if (!Number.isFinite(netProfitNumber)) {
    return { ok: false, message: 'Մաքուր շահույթը պետք է լինի թիվ։' };
  }

  const repair = await prisma.repairOrder.findUnique({
    where: { id },
    select: {
      id: true,
      imageUrl: true,
      debt: {
        select: {
          id: true,
          paidAmount: true,
          dueDate: true,
        },
      },
    },
  });
  if (!repair) return { ok: false, message: 'Պատվերը չի գտնվել։' };

  const imageRes = await saveRepairImage(formData.get('image'));
  if (!imageRes.ok) return imageRes;

  const imageUrl = removeImage ? null : imageRes.imageUrl ?? repair.imageUrl;
  const totalAmount = expensesNumber + netProfitNumber;

  await prisma.$transaction(async (tx) => {
    await tx.repairOrder.update({
      where: { id },
      data: {
        deviceName,
        customerName,
        customerPhone,
        imageUrl,
        expenses: expensesNumber,
        netProfit: netProfitNumber,
        description,
        completedAt: null,
      },
    });

    if (repair.debt) {
      const paidAmount = Number(repair.debt.paidAmount.toString());
      const remainingAmount = Math.max(totalAmount - paidAmount, 0);
      await tx.debt.update({
        where: { id: repair.debt.id },
        data: {
          customerName,
          customerPhone,
          totalAmount,
          remainingAmount,
          status: computeDebtStatus(totalAmount, paidAmount, repair.debt.dueDate, new Date()),
        },
      });
    }
  });

  revalidatePath(routes.dashboardRepairs);
  revalidatePath(routes.dashboardDebts);
  revalidatePath(routes.dashboardAnalytics);
  revalidatePath(routes.dashboard);
  return { ok: true, message: 'Պատվերը թարմացվեց։' };
}

export async function deleteRepairOrder(orderId: string): Promise<RepairActionState> {
  const id = orderId.trim();
  if (!id) return { ok: false, message: 'Պատվերի ID-ը սխալ է։' };

  const repair = await prisma.repairOrder.findUnique({
    where: { id },
    select: {
      id: true,
      debt: { select: { id: true, remainingAmount: true } },
    },
  });
  if (!repair) return { ok: false, message: 'Պատվերը չի գտնվել։' };
  if (repair.debt) {
    return {
      ok: false,
      message: `Այս պատվերը չի կարելի ջնջել, որովհետև դրա հիման վրա պարտք է բացված։ Մնացորդ՝ ${Number(repair.debt.remainingAmount.toString()).toLocaleString('hy-AM')} դրամ։`,
    };
  }

  try {
    await prisma.repairOrder.delete({ where: { id } });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return { ok: false, message: 'Պատվերը չի գտնվել (հնարավոր է արդեն ջնջված է)։' };
      }
      if (error.code === 'P2003') {
        return {
          ok: false,
          message: 'Այս պատվերը կապված է այլ գրառումների հետ և չի կարող ջնջվել։',
        };
      }
    }
    return { ok: false, message: 'Ջնջումը չհաջողվեց։ Խնդրում ենք փորձել կրկին։' };
  }

  revalidatePath(routes.dashboardRepairs);
  revalidatePath(routes.dashboardDebts);
  revalidatePath(routes.dashboardAnalytics);
  revalidatePath(routes.dashboard);
  return { ok: true, message: 'Պատվերը ջնջվեց։' };
}

export async function updateRepairStatus(orderId: string): Promise<UpdateRepairStatusState> {
  const id = orderId.trim();
  if (!id) return { ok: false, message: 'Պատվերի ID-ը սխալ է։' };

  const row = await prisma.repairOrder.findUnique({ where: { id } });
  if (!row) return { ok: false, message: 'Պատվերը չի գտնվել։' };

  const next = nextStatusByCurrent[row.status];
  if (!next) return { ok: false, message: 'Այս պատվերը արդեն ավարտված է։' };

  await prisma.repairOrder.update({
    where: { id },
    data: {
      status: next,
      completedAt: next === 'COMPLETED' ? new Date() : row.completedAt,
    },
  });

  revalidatePath(routes.dashboardRepairs);
  revalidatePath(routes.dashboardAnalytics);
  revalidatePath(routes.dashboard);
  return { ok: true, message: 'Ստատուսը թարմացվեց։' };
}

async function saveRepairImage(
  maybeFile: FormDataEntryValue | null,
): Promise<{ ok: true; imageUrl: string | null } | { ok: false; message: string }> {
  if (!(maybeFile instanceof File) || maybeFile.size === 0) {
    return { ok: true, imageUrl: null };
  }
  if (!ALLOWED_IMAGE_TYPES.has(maybeFile.type)) {
    return { ok: false, message: 'Նկարի ֆորմատը պետք է լինի JPG, PNG, WEBP կամ GIF։' };
  }
  if (maybeFile.size > MAX_IMAGE_SIZE_BYTES) {
    return { ok: false, message: 'Նկարի չափը չպետք է գերազանցի 5MB։' };
  }
  const ext = extensionByMimeType(maybeFile.type);
  if (!ext) return { ok: false, message: 'Նկարի ֆորմատը չի աջակցվում։' };

  const uploadsDir = getUploadDir('repairs');
  await mkdir(uploadsDir, { recursive: true });

  const filename = `${Date.now()}-${randomUUID()}.${ext}`;
  const filePath = path.join(uploadsDir, filename);
  const buffer = Buffer.from(await maybeFile.arrayBuffer());
  await writeFile(filePath, buffer);

  return { ok: true, imageUrl: `/uploads/repairs/${filename}` };
}

function computeDebtStatus(totalAmount: number, paidAmount: number, dueDate: Date | null, now: Date) {
  const remaining = totalAmount - paidAmount;
  if (remaining <= 0) return 'PAID' as const;
  if (dueDate && dueDate.getTime() < now.getTime()) return 'OVERDUE' as const;
  if (paidAmount > 0) return 'PARTIALLY_PAID' as const;
  return 'ACTIVE' as const;
}

function extensionByMimeType(mimeType: string): string | null {
  if (mimeType === 'image/jpeg') return 'jpg';
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  if (mimeType === 'image/gif') return 'gif';
  return null;
}
