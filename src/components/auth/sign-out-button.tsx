'use client';

import { signOut } from 'next-auth/react';

import { routes } from '@/utils/consts';

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: routes.home })}
      className="inline-flex items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-100"
    >
      <span className="fa-solid fa-sign-out-alt mr-2" aria-hidden />
      Ելք
    </button>
  );
}
