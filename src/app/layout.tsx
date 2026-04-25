import './globals.scss';
import '../icons/icons.css';
import './tailwind.css';

import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';

import { Providers } from '@/app/providers';
import { AppInstallPrompt } from '@/components/app-install-prompt';
import { authOptions } from '@/lib/auth';

const SITE_NAME = 'Ohanyan Studio';
const DEFAULT_DESCRIPTION =
  'Հեռախոսների վերանորոգում, ակսեսուարների վաճառք։ Խանութի ներքին հաշվառում։';
const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXTAUTH_URL ||
  'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  applicationName: SITE_NAME,
  title: {
    default: `${SITE_NAME} — հեռախոսների վերանորոգում և ակսեսուարներ`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: SITE_NAME,
  },
  icons: {
    icon: '/icons/pwa-icon.svg',
    apple: '/icons/pwa-icon.svg',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="hy" suppressHydrationWarning className="light">
      <body>
        <Providers session={session}>
          {children}
          <AppInstallPrompt />
        </Providers>
      </body>
    </html>
  );
}
