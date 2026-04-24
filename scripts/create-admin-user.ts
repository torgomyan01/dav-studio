import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

import { normalizePhone } from '../src/utils/phone';

const prisma = new PrismaClient();

async function createAdminUser() {
  const rawPhone = process.env.ADMIN_PHONE ?? '094943389';
  const phone = normalizePhone(rawPhone) || rawPhone.trim();
  const password = 'Davoinaski1.';
  const name = 'Դավիթ';

  try {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ phone }, { phone: rawPhone.trim() }],
      },
    });

    const hashedPassword = await bcrypt.hash(password, 12);

    if (existing) {
      console.log(`User with phone "${existing.phone}" already exists. Updating...`);

      await prisma.user.update({
        where: { id: existing.id },
        data: {
          phone,
          name,
          passwordHash: hashedPassword,
          role: Role.ADMIN,
        },
      });

      console.log(`✅ Admin updated: ${name}, phone ${phone}, role ADMIN`);
      console.log(`Password: ${password}`);
      return;
    }

    const user = await prisma.user.create({
      data: {
        phone,
        name,
        passwordHash: hashedPassword,
        role: Role.ADMIN,
      },
    });

    console.log('✅ Admin user created.');
    console.log(`Name: ${name}`);
    console.log(`Phone: ${phone}`);
    console.log(`Password: ${password}`);
    console.log(`ID: ${user.id}`);
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(() => {
    process.exit(1);
  });
