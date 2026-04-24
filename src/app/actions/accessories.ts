'use server';

import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

import { prisma } from '@/lib/prisma';
import { routes } from '@/utils/consts';

type AccessoryActionState =
  | { ok: true; message: string }
  | { ok: false; message: string };

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

export async function createAccessory(
  formData: FormData
): Promise<AccessoryActionState> {
  const name = String(formData.get('name') ?? '').trim();
  const costPriceNumber = Number(formData.get('costPrice'));
  const quantityNumber = Number(formData.get('quantity'));

  if (!name) return { ok: false, message: 'Մուտքագրեք անվանումը։' };
  if (!Number.isFinite(costPriceNumber) || costPriceNumber < 0)
    return { ok: false, message: 'Ինքնարժեքը պետք է լինի 0 կամ դրական թիվ։' };
  if (!Number.isInteger(quantityNumber) || quantityNumber < 0)
    return {
      ok: false,
      message: 'Քանակը պետք է լինի ամբողջ և դրական (կամ 0)։',
    };

  const imageRes = await saveAccessoryImage(formData.get('image'));
  if (!imageRes.ok) return imageRes;

  await prisma.accessory.create({
    data: {
      name,
      imageUrl: imageRes.imageUrl,
      costPrice: costPriceNumber,
      quantity: quantityNumber,
    },
  });

  revalidatePath(routes.dashboardAccessories);
  revalidatePath(routes.dashboard);
  return { ok: true, message: 'Ապրանքը հաջողությամբ ավելացվեց։' };
}

export async function updateAccessory(
  formData: FormData
): Promise<AccessoryActionState> {
  const id = String(formData.get('id') ?? '').trim();
  const name = String(formData.get('name') ?? '').trim();
  const costPriceNumber = Number(formData.get('costPrice'));
  const quantityNumber = Number(formData.get('quantity'));
  const removeImage = String(formData.get('removeImage') ?? '') === '1';

  if (!id) return { ok: false, message: 'Ապրանքի ID-ը սխալ է։' };
  if (!name) return { ok: false, message: 'Մուտքագրեք անվանումը։' };
  if (!Number.isFinite(costPriceNumber) || costPriceNumber < 0) {
    return { ok: false, message: 'Ինքնարժեքը պետք է լինի 0 կամ դրական թիվ։' };
  }
  if (!Number.isInteger(quantityNumber) || quantityNumber < 0) {
    return {
      ok: false,
      message: 'Քանակը պետք է լինի ամբողջ և դրական (կամ 0)։',
    };
  }

  const accessory = await prisma.accessory.findUnique({
    where: { id },
    select: { id: true, imageUrl: true },
  });
  if (!accessory) return { ok: false, message: 'Ապրանքը չի գտնվել։' };

  const imageRes = await saveAccessoryImage(formData.get('image'));
  if (!imageRes.ok) return imageRes;

  const imageUrl = removeImage
    ? null
    : (imageRes.imageUrl ?? accessory.imageUrl);

  await prisma.accessory.update({
    where: { id },
    data: {
      name,
      costPrice: costPriceNumber,
      quantity: quantityNumber,
      imageUrl,
    },
  });

  revalidatePath(routes.dashboardAccessories);
  revalidatePath(routes.dashboardAccessorySales);
  revalidatePath(routes.dashboardAnalytics);
  revalidatePath(routes.dashboard);
  return { ok: true, message: 'Ապրանքը թարմացվեց։' };
}

export async function deleteAccessory(
  idRaw: string
): Promise<AccessoryActionState> {
  const id = idRaw.trim();
  if (!id) return { ok: false, message: 'Ապրանքի ID-ը սխալ է։' };

  const accessory = await prisma.accessory.findUnique({
    where: { id },
    select: {
      id: true,
      _count: {
        select: {
          sales: true,
        },
      },
    },
  });

  if (!accessory) {
    return { ok: false, message: 'Ապրանքը չի գտնվել։' };
  }

  if (accessory._count.sales > 0) {
    return {
      ok: false,
      message: `Այս ապրանքը չի կարելի ջնջել, որովհետև կապված է ${accessory._count.sales} վաճառքի հետ։ Նախ հեռացրեք կամ փոխեք այդ վաճառքները։`,
    };
  }

  try {
    await prisma.accessory.delete({ where: { id } });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return { ok: false, message: 'Ապրանքը չի գտնվել (հնարավոր է արդեն ջնջված է)։' };
      }
      if (error.code === 'P2003') {
        return {
          ok: false,
          message: 'Այս ապրանքը կապված է այլ գրառումների հետ և չի կարող ջնջվել։',
        };
      }
    }
    return {
      ok: false,
      message: 'Ջնջումը չհաջողվեց։ Խնդրում ենք փորձել կրկին։',
    };
  }

  revalidatePath(routes.dashboardAccessories);
  revalidatePath(routes.dashboardAccessorySales);
  revalidatePath(routes.dashboardAnalytics);
  revalidatePath(routes.dashboard);
  return { ok: true, message: 'Ապրանքը ջնջվեց։' };
}

async function saveAccessoryImage(
  maybeFile: FormDataEntryValue | null
): Promise<
  { ok: true; imageUrl: string | null } | { ok: false; message: string }
> {
  if (!(maybeFile instanceof File) || maybeFile.size === 0) {
    return { ok: true, imageUrl: null };
  }
  if (!ALLOWED_IMAGE_TYPES.has(maybeFile.type)) {
    return {
      ok: false,
      message: 'Նկարի ֆորմատը պետք է լինի JPG, PNG, WEBP կամ GIF։',
    };
  }
  if (maybeFile.size > MAX_IMAGE_SIZE_BYTES) {
    return { ok: false, message: 'Նկարի չափը չպետք է գերազանցի 5MB։' };
  }

  const ext = extensionByMimeType(maybeFile.type);
  if (!ext) return { ok: false, message: 'Նկարի ֆորմատը չի աջակցվում։' };

  const uploadsDir = path.join(
    process.cwd(),
    'public',
    'uploads',
    'accessories'
  );
  await mkdir(uploadsDir, { recursive: true });

  const filename = `${Date.now()}-${randomUUID()}.${ext}`;
  const filePath = path.join(uploadsDir, filename);
  const buffer = Buffer.from(await maybeFile.arrayBuffer());
  await writeFile(filePath, buffer);

  return { ok: true, imageUrl: `/uploads/accessories/${filename}` };
}

function extensionByMimeType(mimeType: string): string | null {
  if (mimeType === 'image/jpeg') return 'jpg';
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  if (mimeType === 'image/gif') return 'gif';
  return null;
}
