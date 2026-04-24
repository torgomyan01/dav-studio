'use client';

import type { RepairStatus } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { updateRepairStatus } from '@/app/actions/repairs';

export function RepairStatusButton({ orderId, status }: { orderId: string; status: RepairStatus }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextLabel: Record<RepairStatus, string | null> = {
    IN_PROGRESS: 'Փոխել՝ Պատրաստ վերցնելու',
    READY_FOR_PICKUP: 'Փոխել՝ Ավարտված',
    COMPLETED: null,
  };

  async function onClick() {
    setError(null);
    setPending(true);
    try {
      const res = await updateRepairStatus(orderId);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  if (!nextLabel[status]) {
    return <span className="text-xs text-emerald-700">Ավարտված</span>;
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-800 hover:bg-neutral-100 disabled:opacity-60"
      >
        {pending ? 'Թարմացում…' : nextLabel[status]}
      </button>
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
