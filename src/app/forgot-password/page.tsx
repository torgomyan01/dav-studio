import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { BackButton } from '@/components/back-button';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import { authOptions } from '@/lib/auth';
import { routes } from '@/utils/consts';

export default async function ForgotPasswordPage() {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect(routes.dashboard);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-linear-to-b from-neutral-100 to-neutral-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <BackButton fallbackHref={routes.home} />
      </div>
      <ForgotPasswordForm />
      <p className="mt-6 max-w-sm text-center text-xs text-neutral-500">
        Արդյունքում բացվում է նոր գաղտնաբառի էջը։ Ապագայում SMS կամ այլ ալիքով հղում ուղարկելու համար կարելի է ինտեգրել ծառայություն։
      </p>
      <Link href={routes.home} className="mt-2 text-sm text-green hover:underline">
        Մուտք
      </Link>
    </main>
  );
}
