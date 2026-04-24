import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { LoginForm } from '@/components/auth/login-form';
import { authOptions } from '@/lib/auth';
import { routes } from '@/utils/consts';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect(routes.dashboard);
  }

  const sp = await searchParams;
  const resetSuccess = sp.reset === 'ok';

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-neutral-100 to-neutral-50 px-4 py-12">
      <LoginForm resetSuccess={resetSuccess} />
    </main>
  );
}
