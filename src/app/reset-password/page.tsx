import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { ResetPasswordForm } from '@/components/auth/reset-password-form';
import { authOptions } from '@/lib/auth';
import { routes } from '@/utils/consts';

export default async function ResetPasswordPage() {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect(routes.dashboard);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-neutral-100 to-neutral-50 px-4 py-12">
      <ResetPasswordForm />
    </main>
  );
}
