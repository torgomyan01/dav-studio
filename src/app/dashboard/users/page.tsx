import { Role } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
import { UserCreateForm } from '@/components/dashboard/user-create-form';
import { UserRowActions } from '@/components/dashboard/user-row-actions';
import { authOptions } from '@/lib/auth';
import { canAccessDashboardPage } from '@/lib/dashboard-permissions';
import { prisma } from '@/lib/prisma';
import { routes } from '@/utils/consts';

const roleLabels: Record<Role, string> = {
  ADMIN: 'Ադմին',
  MANAGER: 'Մենեջեր',
  WORKER: 'Աշխատող',
};

const roleDescriptions: Record<Role, string> = {
  ADMIN: 'Լիարժեք հասանելիություն ամբողջ համակարգին։',
  MANAGER: 'Կառավարում է հիմնական աշխատանքային էջերը, բայց չի ավելացնում օգտատեր։',
  WORKER: 'Տեսնում է միայն Գլխավոր, Ակսեսուարի վաճառք, Վերանորոգում և Պարտքեր էջերը։',
};

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect(routes.home);
  }
  if (!canAccessDashboardPage(session.user.role, 'users')) {
    redirect(routes.dashboard);
  }

  const users = await prisma.user.findMany({
    orderBy: [{ role: 'asc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      name: true,
      phone: true,
      role: true,
      createdAt: true,
    },
  });

  return (
    <main className="min-h-screen bg-neutral-50 px-3 py-3 sm:px-4 sm:py-8 lg:pl-76">
      <DashboardSidebar session={session} active="users" />

      <div className="mx-auto max-w-6xl">
        <section className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-8">
          <header className="border-b border-neutral-200 pb-4">
            <h2 className="text-2xl font-semibold text-neutral-900">Օգտատերեր</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Ավելացրեք աշխատակիցներ, ընտրեք նրանց դերը և տվեք մուտք իրենց թույլատրված էջերին։
            </p>
          </header>

          <UserCreateForm />

          <section className="grid gap-3 md:grid-cols-3">
            {Object.values(Role).map((role) => (
              <div key={role} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                <p className="text-sm font-semibold text-neutral-900">{roleLabels[role]}</p>
                <p className="mt-1 text-xs leading-5 text-neutral-500">{roleDescriptions[role]}</p>
              </div>
            ))}
          </section>

          <section className="overflow-hidden rounded-xl border border-neutral-200">
            <div className="hidden grid-cols-12 border-b border-neutral-200 bg-neutral-50 px-4 py-3 text-xs font-medium uppercase tracking-wide text-neutral-500 md:grid">
              <p className="col-span-3">Աշխատակից</p>
              <p className="col-span-3">Հեռախոս</p>
              <p className="col-span-2">Դեր</p>
              <p className="col-span-2">Ստեղծվել է</p>
              <p className="col-span-2 text-right">Գործողություններ</p>
            </div>

            <div className="divide-y divide-neutral-200">
              {users.length === 0 ? (
                <p className="px-4 py-6 text-sm text-neutral-500">Օգտատեր դեռ չկա։</p>
              ) : (
                users.map((user) => (
                  <div
                    key={user.id}
                    className="grid grid-cols-1 gap-2 px-4 py-4 text-sm text-neutral-800 hover:bg-neutral-50 md:grid-cols-12 md:items-center md:gap-0 md:py-3"
                  >
                    <p className="font-semibold text-neutral-900 md:col-span-3 md:font-medium">
                      {user.name || 'Անանուն օգտատեր'}
                    </p>
                    <p className="flex justify-between rounded-lg bg-neutral-50 px-3 py-2 md:col-span-3 md:block md:bg-transparent md:px-0 md:py-0">
                      <span className="text-xs text-neutral-500 md:hidden">Հեռախոս</span>
                      <span>{formatPhone(user.phone)}</span>
                    </p>
                    <p className="flex justify-between rounded-lg bg-neutral-50 px-3 py-2 md:col-span-2 md:block md:bg-transparent md:px-0 md:py-0">
                      <span className="text-xs text-neutral-500 md:hidden">Դեր</span>
                      <span>{roleLabels[user.role]}</span>
                    </p>
                    <p className="flex justify-between rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-500 md:col-span-2 md:block md:bg-transparent md:px-0 md:py-0">
                      <span className="md:hidden">Ստեղծվել է</span>
                      <span>{user.createdAt.toLocaleDateString('hy-AM')}</span>
                    </p>
                    <UserRowActions
                      user={{
                        id: user.id,
                        name: user.name || '',
                        phone: user.phone,
                        role: user.role,
                      }}
                    />
                  </div>
                ))
              )}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function formatPhone(phone: string) {
  if (phone.length !== 9) return phone;
  return `${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}`;
}
