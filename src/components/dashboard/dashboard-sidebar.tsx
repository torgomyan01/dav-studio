'use client';

import Link from 'next/link';
import type { Session } from 'next-auth';
import { useState } from 'react';

import { SignOutButton } from '@/components/auth/sign-out-button';
import {
  type DashboardMenuKey,
  getVisibleDashboardMenuItems,
} from '@/lib/dashboard-permissions';

export function DashboardSidebar({
  session,
  active,
}: {
  session: Session;
  active: DashboardMenuKey;
}) {
  const [open, setOpen] = useState(false);
  const roleLabel: Record<string, string> = {
    ADMIN: 'Ադմին',
    MANAGER: 'Մենեջեր',
    WORKER: 'Աշխատող',
  };

  const menuItems = getVisibleDashboardMenuItems(session.user.role);
  const activeItem = menuItems.find((item) => item.key === active) ?? menuItems[0];

  return (
    <>
      <div className="lg:hidden">
        <div className="fixed inset-x-0 top-0 z-50 border-b border-neutral-200 bg-white/95 px-3 py-3 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-800 shadow-sm"
              aria-label="Բացել մենյուն"
            >
              <span className="fa-solid fa-bars" aria-hidden />
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-neutral-900">Ohanyan Studio</p>
              <p className="truncate text-xs text-neutral-500">{activeItem.title}</p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-green/10 text-green">
              <span className={activeItem.iconClass} aria-hidden />
            </span>
          </div>
        </div>
        <div className="h-16" />
      </div>

      {open && (
        <button
          type="button"
          aria-label="Փակել մենյուն"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 bg-neutral-950/55 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-60 w-[86vw] max-w-80 overflow-y-auto rounded-r-3xl border-r border-neutral-200 bg-white p-4 shadow-2xl transition-transform duration-200 lg:fixed lg:left-0 lg:top-0 lg:z-40 lg:h-screen lg:w-72 lg:max-w-none lg:translate-x-0 lg:rounded-none lg:rounded-r-3xl lg:border-y-0 lg:border-l-0 lg:px-5 lg:py-6 lg:shadow-xl ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
      <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
        <p className="text-sm font-semibold text-neutral-900">Մենյու</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 text-neutral-600"
          aria-label="Փակել մենյուն"
        >
          <span className="fa-solid fa-xmark" aria-hidden />
        </button>
      </div>

      <div className="mb-4 rounded-xl border border-green/15 bg-linear-to-br from-green/10 to-green/5 p-3">
        <h1 className="text-lg font-semibold text-neutral-900">
          Ohanyan Studio
        </h1>
        <p className="mt-1 text-xs text-neutral-600">
          {session.user.name ?? '—'} · {session.user.phone || '—'}
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          {roleLabel[session.user.role] ?? session.user.role}
        </p>
      </div>

      <nav className="space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`group block w-full rounded-xl border px-3 py-3 text-left transition ${
              active === item.key
                ? 'border-green bg-green/10 shadow-sm'
                : 'border-transparent bg-neutral-50 hover:border-neutral-200 hover:bg-neutral-100'
            }`}
          >
            <span className="flex items-center gap-2 text-sm font-medium text-neutral-900">
              <span
                className={`inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs transition ${
                  active === item.key
                    ? 'bg-green text-cream'
                    : 'bg-white text-neutral-500 group-hover:bg-neutral-200'
                }`}
                aria-hidden
              >
                <span className={item.iconClass} />
              </span>
              {item.title}
            </span>
            <span className="mt-1 block text-xs text-neutral-500">
              {item.description}
            </span>
          </Link>
        ))}
      </nav>

      <div className="mt-5 border-t border-neutral-200 pt-4">
        <div className="w-full [&>button]:w-full">
          <SignOutButton />
        </div>
      </div>
    </aside>
    </>
  );
}
