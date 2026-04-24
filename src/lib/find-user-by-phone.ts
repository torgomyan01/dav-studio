import type { User } from '@prisma/client';

import { prisma } from '@/lib/prisma';
import { normalizePhone } from '@/utils/phone';

/** Մուտքի և վերականգնման համար հեռախոսով օգտատեր գտնել */
export async function findUserByPhone(raw: string): Promise<User | null> {
  const compact = raw.replace(/\s+/g, '');
  const digits = normalizePhone(raw);

  const direct = await prisma.user.findUnique({ where: { phone: raw } });
  if (direct) return direct;

  if (compact !== raw) {
    const c = await prisma.user.findUnique({ where: { phone: compact } });
    if (c) return c;
  }

  if (digits) {
    const byDigits = await prisma.user.findUnique({ where: { phone: digits } });
    if (byDigits) return byDigits;
  }

  const users = await prisma.user.findMany();
  return users.find((u) => normalizePhone(u.phone) === digits) ?? null;
}
