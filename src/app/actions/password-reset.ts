'use server';

import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

import { findUserByPhone } from '@/lib/find-user-by-phone';
import {
  generatePasswordResetPlainToken,
  hashPasswordResetToken,
  passwordResetExpiresAt,
} from '@/lib/password-reset-token';
import { prisma } from '@/lib/prisma';

export type PasswordResetRequestState =
  | { ok: true; token: string }
  | { ok: false; message: string };

export async function requestPasswordReset(phoneRaw: string): Promise<PasswordResetRequestState> {
  const raw = phoneRaw.trim();
  if (!raw) {
    return { ok: false, message: 'Մուտքագրեք հեռախոսահամարը։' };
  }

  const user = await findUserByPhone(raw);
  if (!user) {
    return { ok: false, message: 'Այս հեռախոսահամարով հաշիվ չի գտնվել։' };
  }

  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

  const plain = generatePasswordResetPlainToken();
  const tokenHash = hashPasswordResetToken(plain);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: passwordResetExpiresAt(),
    },
  });

  return { ok: true, token: plain };
}

export type CompletePasswordResetState = { ok: true } | { ok: false; message: string };

export async function completePasswordReset(
  plainToken: string,
  password: string,
  passwordConfirm: string,
): Promise<CompletePasswordResetState> {
  const t = plainToken.trim();
  if (!t) {
    return { ok: false, message: 'Վերականգնման հղումը անվավեր է։' };
  }
  if (password.length < 8) {
    return { ok: false, message: 'Գաղտնաբառը պետք է լինի առնվազն 8 նիշ։' };
  }
  if (password !== passwordConfirm) {
    return { ok: false, message: 'Գաղտնաբառերը չեն համընկնում։' };
  }

  const tokenHash = hashPasswordResetToken(t);
  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!row || row.expiresAt < new Date()) {
    return {
      ok: false,
      message: 'Հղումը ժամկետանց է կամ անվավեր է։ Խնդրեք նոր վերականգնում։',
    };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.deleteMany({ where: { userId: row.userId } }),
  ]);

  revalidatePath('/');
  return { ok: true };
}
