'use client';

import { useMemo, useState } from 'react';

import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartOptions,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
);

type Metrics = {
  repairsCount: number;
  completedRepairs: number;
  inProgressRepairs: number;
  readyRepairs: number;
  expensesTotal: number;
  netProfitTotal: number;
  averageProfit: number;
  accessoriesCount: number;
  accessoriesQuantity: number;
  accessoriesValue: number;
  debtsCount: number;
  debtOutstanding: number;
  debtCollected: number;
  overdueDebts: number;
};

type TrendRow = {
  label: string;
  repairs: number;
  expenses: number;
  profit: number;
};

type TopDevice = { name: string; count: number };
type TopAccessory = { name: string; quantity: number; value: number };
type PeriodKey = 'daily' | 'weekly' | 'monthly' | 'yearly';

export function AnalyticsCharts({
  allTime,
  daily,
  weekly,
  monthly,
  yearly,
  topDevices,
  topAccessories,
  dailyTrend,
  weeklyTrend,
  monthlyTrend,
  yearlyTrend,
}: {
  allTime: Metrics;
  daily: Metrics;
  weekly: Metrics;
  monthly: Metrics;
  yearly: Metrics;
  topDevices: TopDevice[];
  topAccessories: TopAccessory[];
  dailyTrend: TrendRow[];
  weeklyTrend: TrendRow[];
  monthlyTrend: TrendRow[];
  yearlyTrend: TrendRow[];
}) {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>('daily');

  const periodMap = useMemo(
    () => ({
      daily: {
        label: 'Օրական',
        metrics: daily,
        trend: dailyTrend,
      },
      weekly: {
        label: 'Շաբաթական',
        metrics: weekly,
        trend: weeklyTrend,
      },
      monthly: {
        label: 'Ամսական',
        metrics: monthly,
        trend: monthlyTrend,
      },
      yearly: {
        label: 'Տարեկան',
        metrics: yearly,
        trend: yearlyTrend,
      },
    }),
    [daily, weekly, monthly, yearly, dailyTrend, weeklyTrend, monthlyTrend, yearlyTrend],
  );

  const selected = periodMap[selectedPeriod];

  const commonPlugins = {
    legend: {
      labels: {
        color: '#1f2937',
      },
    },
    tooltip: {
      backgroundColor: 'rgba(17,24,39,0.95)',
    },
  };

  const cartesianScales = {
    x: {
      ticks: { color: '#6b7280' },
      grid: { color: 'rgba(107,114,128,0.15)' },
    },
    y: {
      ticks: { color: '#6b7280' },
      grid: { color: 'rgba(107,114,128,0.15)' },
    },
  };

  const barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: commonPlugins,
    scales: cartesianScales,
  };

  const lineOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: commonPlugins,
    scales: cartesianScales,
  };

  const doughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: commonPlugins,
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Բոլոր պատվերներ" value={String(allTime.repairsCount)} />
        <MetricCard title="Բոլոր մաքուր շահույթ" value={formatMoney(allTime.netProfitTotal)} />
        <MetricCard title="Բոլոր ծախսեր" value={formatMoney(allTime.expensesTotal)} />
        <MetricCard title="Պահեստի ընդհանուր արժեք" value={formatMoney(allTime.accessoriesValue)} />
        <MetricCard title="Բոլոր պարտքեր" value={String(allTime.debtsCount)} />
        <MetricCard title="Ընդհանուր չմարված պարտք" value={formatMoney(allTime.debtOutstanding)} />
        <MetricCard title="Ընդհանուր մարված պարտք" value={formatMoney(allTime.debtCollected)} />
        <MetricCard title="Ժամկետանց պարտքեր" value={String(allTime.overdueDebts)} />
      </section>

      <section className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
        <div className="grid gap-3 sm:flex sm:items-center sm:justify-between">
          <h3 className="text-sm font-semibold text-neutral-900">Ժամանակային կտրվածքի ընտրություն</h3>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as PeriodKey)}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 outline-none ring-green transition focus:border-green focus:ring-2 sm:w-auto"
          >
            <option value="daily">Օրական</option>
            <option value="weekly">Շաբաթական</option>
            <option value="monthly">Ամսական</option>
            <option value="yearly">Տարեկան</option>
          </select>
        </div>
        <p className="mt-2 text-xs text-neutral-500">
          Ընտրված է՝ <span className="font-medium text-neutral-700">{selected.label}</span>
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <ChartCard title={`${selected.label} ստատուսների բաշխում`}>
          <Doughnut
            data={{
              labels: ['Վերանորոգման փուլում', 'Պատրաստ է վերցնելու', 'Ավարտված'],
              datasets: [
                {
                  label: 'Պատվերներ',
                  data: [
                    selected.metrics.inProgressRepairs,
                    selected.metrics.readyRepairs,
                    selected.metrics.completedRepairs,
                  ],
                  backgroundColor: ['#f59e0b', '#3b82f6', '#10b981'],
                  borderWidth: 1,
                },
              ],
            }}
            options={doughnutOptions}
          />
        </ChartCard>

        <ChartCard title={`${selected.label} շահույթ և ծախս`}>
          <Bar
            data={{
              labels: [selected.label],
              datasets: [
                {
                  label: 'Մաքուր շահույթ',
                  data: [selected.metrics.netProfitTotal],
                  backgroundColor: '#10b981',
                },
                {
                  label: 'Ծախս',
                  data: [selected.metrics.expensesTotal],
                  backgroundColor: '#ef4444',
                },
              ],
            }}
            options={barOptions}
          />
        </ChartCard>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard title={`${selected.label} պատվերներ`} value={String(selected.metrics.repairsCount)} />
        <MetricCard title={`${selected.label} մաքուր շահույթ`} value={formatMoney(selected.metrics.netProfitTotal)} />
        <MetricCard title={`${selected.label} ծախս`} value={formatMoney(selected.metrics.expensesTotal)} />
        <MetricCard title={`${selected.label} միջին շահույթ`} value={formatMoney(selected.metrics.averageProfit)} />
        <MetricCard
          title={`${selected.label} ակսեսուարների արժեք`}
          value={formatMoney(selected.metrics.accessoriesValue)}
        />
        <MetricCard title={`${selected.label} նոր պարտքեր`} value={String(selected.metrics.debtsCount)} />
        <MetricCard title={`${selected.label} մարված պարտք`} value={formatMoney(selected.metrics.debtCollected)} />
        <MetricCard
          title={`${selected.label} չմարված պարտք`}
          value={formatMoney(selected.metrics.debtOutstanding)}
        />
        <MetricCard title={`${selected.label} ժամկետանց պարտքեր`} value={String(selected.metrics.overdueDebts)} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Ամենաշատ վերանորոգվող տեխնիկա">
          <Bar
            data={{
              labels: topDevices.map((x) => x.name),
              datasets: [
                {
                  label: 'Քանակ',
                  data: topDevices.map((x) => x.count),
                  backgroundColor: '#1e4a2f',
                },
              ],
            }}
            options={barOptions}
          />
        </ChartCard>

        <ChartCard title="Ամենաշատ ավելացված ակսեսուարներ">
          <Bar
            data={{
              labels: topAccessories.map((x) => x.name),
              datasets: [
                {
                  label: 'Քանակ',
                  data: topAccessories.map((x) => x.quantity),
                  backgroundColor: '#2563eb',
                },
              ],
            }}
            options={barOptions}
          />
        </ChartCard>
      </section>

      <section>
        <TrendChart
          title={`${selected.label} դինամիկա`}
          rows={selected.trend}
          options={lineOptions}
        />
      </section>
    </div>
  );
}

function TrendChart({
  title,
  rows,
  options,
}: {
  title: string;
  rows: TrendRow[];
  options: ChartOptions<'line'>;
}) {
  return (
    <ChartCard title={title}>
      <Line
        data={{
          labels: rows.map((r) => r.label),
          datasets: [
            {
              label: 'Շահույթ',
              data: rows.map((r) => r.profit),
              borderColor: '#10b981',
              backgroundColor: 'rgba(16,185,129,0.2)',
              tension: 0.25,
              fill: true,
            },
            {
              label: 'Ծախս',
              data: rows.map((r) => r.expenses),
              borderColor: '#ef4444',
              backgroundColor: 'rgba(239,68,68,0.15)',
              tension: 0.25,
              fill: true,
            },
            {
              label: 'Պատվերներ',
              data: rows.map((r) => r.repairs),
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59,130,246,0.15)',
              tension: 0.25,
              fill: false,
            },
          ],
        }}
        options={options}
      />
    </ChartCard>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-neutral-200 p-3 sm:p-4">
      <h3 className="mb-3 text-sm font-semibold text-neutral-900">{title}</h3>
      <div className="h-64 sm:h-72">{children}</div>
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
      <p className="text-xs text-neutral-500">{title}</p>
      <p className="mt-2 text-lg font-semibold text-neutral-900">{value}</p>
    </div>
  );
}

function formatMoney(v: number) {
  return `${v.toLocaleString('hy-AM', { maximumFractionDigits: 2 })} դրամ`;
}
