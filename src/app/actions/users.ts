'use server';

import { Prisma, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { normalizePhone } from '@/utils/phone';
import { routes } from '@/utils/consts';

type UserActionState = { ok: true; message: string } | { ok: false; message: string };

const roleValues = [Role.ADMIN, Role.MANAGER, Role.WORKER] as const;

export async function createUser(input: {
  name: string;
  phone: string;
  password: string;
  role: string;
}): Promise<UserActionState> {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== Role.ADMIN) {
    return { ok: false, message: 'Միայն ադմինը կարող է ավելացնել նոր օգտատեր։' };
  }

  const name = input.name.trim();
  const phone = normalizePhone(input.phone);
  const password = input.password.trim();
  const role = roleValues.includes(input.role as Role) ? (input.role as Role) : null;

  if (!name) return { ok: false, message: 'Մուտքագրեք աշխատակցի անունը։' };
  if (phone.length !== 9) return { ok: false, message: 'Հեռախոսահամարը պետք է լինի 9 նիշ։' };
  if (password.length < 6) return { ok: false, message: 'Գաղտնաբառը պետք է լինի առնվազն 6 նիշ։' };
  if (!role) return { ok: false, message: 'Ընտրեք օգտատերի դերը։' };

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: {
        name,
        phone,
        passwordHash,
        role,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { ok: false, message: 'Այս հեռախոսահամարով օգտատեր արդեն կա։' };
    }
    return { ok: false, message: 'Օգտատեր ստեղծելու ժամանակ սխալ առաջացավ։' };
  }

  revalidatePath(routes.dashboardUsers);
  return { ok: true, message: 'Օգտատերը հաջողությամբ ավելացվեց։' };
}

export async function updateUser(input: {
  id: string;
  name: string;
  phone: string;
  password: string;
  role: string;
}): Promise<UserActionState> {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== Role.ADMIN) {
    return { ok: false, message: 'Միայն ադմինը կարող է փոփոխել օգտատերերին։' };
  }

  const id = input.id.trim();
  const name = input.name.trim();
  const phone = normalizePhone(input.phone);
  const password = input.password.trim();
  const role = roleValues.includes(input.role as Role) ? (input.role as Role) : null;

  if (!id) return { ok: false, message: 'Օգտատերի ID-ը սխալ է։' };
  if (!name) return { ok: false, message: 'Մուտքագրեք աշխատակցի անունը։' };
  if (phone.length !== 9) return { ok: false, message: 'Հեռախոսահամարը պետք է լինի 9 նիշ։' };
  if (password && password.length < 6) return { ok: false, message: 'Նոր գաղտնաբառը պետք է լինի առնվազն 6 նիշ։' };
  if (!role) return { ok: false, message: 'Ընտրեք օգտատերի դերը։' };

  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
  if (!user) return { ok: false, message: 'Օգտատերը չի գտնվել։' };

  if (user.role === Role.ADMIN && role !== Role.ADMIN) {
    const adminsCount = await prisma.user.count({ where: { role: Role.ADMIN } });
    if (adminsCount <= 1) {
      return { ok: false, message: 'Չեք կարող վերջին ադմինի դերը փոխել։' };
    }
  }

  try {
    await prisma.user.update({
      where: { id },
      data: {
        name,
        phone,
        role,
        ...(password ? { passwordHash: await bcrypt.hash(password, 12) } : {}),
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { ok: false, message: 'Այս հեռախոսահամարով օգտատեր արդեն կա։' };
    }
    return { ok: false, message: 'Օգտատեր փոփոխելու ժամանակ սխալ առաջացավ։' };
  }

  revalidatePath(routes.dashboardUsers);
  return { ok: true, message: 'Օգտատերը թարմացվեց։' };
}

export async function deleteUser(idRaw: string): Promise<UserActionState> {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== Role.ADMIN) {
    return { ok: false, message: 'Միայն ադմինը կարող է ջնջել օգտատերերին։' };
  }

  const id = idRaw.trim();
  if (!id) return { ok: false, message: 'Օգտատերի ID-ը սխալ է։' };
  if (id === session.user.id) {
    return { ok: false, message: 'Չեք կարող ջնջել ձեր սեփական օգտատերը։' };
  }

  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
  if (!user) return { ok: false, message: 'Օգտատերը չի գտնվել։' };

  if (user.role === Role.ADMIN) {
    const adminsCount = await prisma.user.count({ where: { role: Role.ADMIN } });
    if (adminsCount <= 1) {
      return { ok: false, message: 'Չեք կարող ջնջել վերջին ադմինին։' };
    }
  }

  await prisma.user.delete({ where: { id } });

  revalidatePath(routes.dashboardUsers);
  return { ok: true, message: 'Օգտատերը ջնջվեց։' };
}
