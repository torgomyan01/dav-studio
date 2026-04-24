'use server';

import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import type { RepairStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';

import { prisma } from '@/lib/prisma';
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

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'repairs');
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

const nextStatusByCurrent: Record<RepairStatus, RepairStatus | null> = {
  IN_PROGRESS: 'READY_FOR_PICKUP',
  READY_FOR_PICKUP: 'COMPLETED',
  COMPLETED: null,
};

export async function updateRepairStatus(orderId: string): Promise<UpdateRepairStatusState> {
  const id = orderId.trim();
  if (!id) return { ok: false, message: 'Պատվերի ID-ը սխալ է։' };

  const row = await prisma.repairOrder.findUnique({ where: { id } });
  if (!row) return { ok: false, message: 'Պատվերը չի գտնվել։' };

  const next = nextStatusByCurrent[row.status];
  if (!next) return { ok: false, message: 'Այս պատվերը արդեն ավարտված է։' };

  await prisma.repairOrder.update({
    where: { id },
    data: { status: next },
  });

  revalidatePath(routes.dashboardRepairs);
  return { ok: true, message: 'Ստատուսը թարմացվեց։' };
}

function extensionByMimeType(mimeType: string): string | null {
  if (mimeType === 'image/jpeg') return 'jpg';
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  if (mimeType === 'image/gif') return 'gif';
  return null;
}
