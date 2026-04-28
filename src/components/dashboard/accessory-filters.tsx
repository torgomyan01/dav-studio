'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

import { routes } from '@/utils/consts';

type AccessorySort = 'createdAt' | 'name' | 'costPrice' | 'quantity';
type AccessoryDirection = 'asc' | 'desc';

export function AccessoryFilters({
  q,
  selectedName,
  sort,
  dir,
  nameOptions,
}: {
  q: string;
  selectedName: string;
  sort: AccessorySort;
  dir: AccessoryDirection;
  nameOptions: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(q);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setSearch(q);
  }, [q]);

  useEffect(() => {
    if (search.trim() === q) return;

    const timer = window.setTimeout(() => {
      updateQuery({ q: search });
    }, 150);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function updateQuery(next: Partial<{ q: string; name: string; sort: string; dir: string }>) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(next)) {
      const normalized = value?.trim() ?? '';
      if (normalized && !(key === 'sort' && normalized === 'createdAt') && !(key === 'dir' && normalized === 'desc')) {
        params.set(key, normalized);
      } else {
        params.delete(key);
      }
    }

    params.delete('page');
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `${routes.dashboardAccessories}?${qs}` : routes.dashboardAccessories);
    });
  }

  return (
    <form
      action={routes.dashboardAccessories}
      onSubmit={(e) => e.preventDefault()}
      className="grid gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 lg:grid-cols-12"
    >
      <label className="block lg:col-span-4">
        <span className="mb-1.5 block text-sm font-medium text-neutral-700">Արագ որոնում</span>
        <input
          name="q"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyUp={(e) => setSearch(e.currentTarget.value)}
          placeholder="Գրեք ապրանքի անվանումը..."
          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none ring-green transition focus:border-green focus:ring-2"
        />
        <span className="mt-1 block text-xs text-neutral-500">
          {isPending ? 'Որոնվում է…' : 'Գրելուց հետո արդյունքը թարմանում է ավտոմատ։'}
        </span>
      </label>

      <label className="block lg:col-span-3">
        <span className="mb-1.5 block text-sm font-medium text-neutral-700">Ըստ անվանումի</span>
        <select
          name="name"
          value={selectedName}
          onChange={(e) => updateQuery({ name: e.target.value })}
          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none ring-green transition focus:border-green focus:ring-2"
        >
          <option value="">Բոլոր անվանումները</option>
          {nameOptions.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>

      <label className="block lg:col-span-2">
        <span className="mb-1.5 block text-sm font-medium text-neutral-700">Սորտավորել</span>
        <select
          name="sort"
          value={sort}
          onChange={(e) => updateQuery({ sort: e.target.value })}
          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none ring-green transition focus:border-green focus:ring-2"
        >
          <option value="createdAt">Ավելացման ամսաթիվ</option>
          <option value="name">Անվանում</option>
          <option value="costPrice">Ինքնարժեք</option>
          <option value="quantity">Քանակ</option>
        </select>
      </label>

      <label className="block lg:col-span-1">
        <span className="mb-1.5 block text-sm font-medium text-neutral-700">Ուղղություն</span>
        <select
          name="dir"
          value={dir}
          onChange={(e) => updateQuery({ dir: e.target.value })}
          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none ring-green transition focus:border-green focus:ring-2"
        >
          <option value="desc">Նվազող</option>
          <option value="asc">Աճող</option>
        </select>
      </label>

      <div className="grid gap-2 sm:flex sm:items-end lg:col-span-2">
        <Link
          href={routes.dashboardAccessories}
          className="rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-center text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100"
        >
          Մաքրել
        </Link>
      </div>
    </form>
  );
}
