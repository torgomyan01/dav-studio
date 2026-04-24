import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import { authOptions } from '@/lib/auth';
import { routes } from '@/utils/consts';

export default async function ForgotPasswordPage() {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect(routes.dashboard);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-neutral-100 to-neutral-50 px-4 py-12">
      <ForgotPasswordForm />
      <p className="mt-6 max-w-sm text-center text-xs text-neutral-500">
        Արդյունքում բացվում է նոր գաղտնաբառի էջը։ Ապագայում SMS կամ այլ ալիքով հղում ուղարկելու համար կարելի է ինտեգրել ծառայություն։
      </p>
      <Link href={routes.home} className="mt-2 text-sm text-[var(--color-green)] hover:underline">
        Մուտք
      </Link>
    </main>
  );
}
