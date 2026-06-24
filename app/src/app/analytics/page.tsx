'use client';

import { useCallback, useEffect, useState } from 'react';

// ---- Types mirroring the /api/analytics response shapes ----
interface DiagnosisByWalletType { wallet_type: string; diagnosis_type: string; count: number }
interface DiagnosisByValueRange { value_range: string; diagnosis_type: string; count: number }
interface PathAttemptStats {
  avg_attempts_before_accept: number;
  total_sessions_with_diagnosis: number;
  sessions_accepted_first_try: number;
  sessions_with_multiple_attempts: number;
}
interface DropOffPoint { question_id: string; drop_off_count: number; total_reached: number; drop_off_rate: number }
interface EngagementStats {
  total_diagnoses: number;
  clicked_learn_count: number;
  clicked_hwr_count: number;
  learn_click_rate: number;
  hwr_click_rate: number;
}
interface DiagnosisTrend { date: string; diagnosis_type: string; count: number }
interface RepeatVisitorStats { total_unique_visitors: number; repeat_visitors: number; repeat_rate: number }
interface ClusterStat {
  wallet: string;
  generation_period: string;
  diagnosis: string;
  count: number;
  first_seen: string;
  last_seen: string;
}

interface AllAnalytics {
  diagnosisByWalletType: DiagnosisByWalletType[];
  diagnosisByValueRange: DiagnosisByValueRange[];
  pathAttemptStats: PathAttemptStats;
  dropOffPoints: DropOffPoint[];
  engagementStats: EngagementStats;
  diagnosisTrends: DiagnosisTrend[];
  repeatVisitorStats: RepeatVisitorStats;
}

// ---- Formatting helpers ----
const prettify = (s: string) =>
  s
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bUsd\b/i, 'USD');

const pct = (n: number) => `${(n * 100).toFixed(n > 0 && n < 0.01 ? 1 : 0)}%`;
const num = (n: number) => n.toLocaleString();

// Categorical palette built from the brand tokens.
const PALETTE = ['#6c5ce7', '#74b9ff', '#a29bfe', '#0984e3', '#00cec9', '#fd79a8', '#fdcb6e', '#e17055'];

// ---- Small presentational pieces ----
function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-[var(--foreground)]">{value}</p>
      {sub && <p className="mt-1 text-sm text-[var(--text-muted)]">{sub}</p>}
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">{title}</h2>
        {hint && <p className="mt-1 text-sm text-[var(--text-muted)]">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

// Horizontal bar row used across charts.
function BarRow({
  label,
  value,
  max,
  color = 'var(--primary)',
  valueLabel,
}: {
  label: string;
  value: number;
  max: number;
  color?: string;
  valueLabel?: string;
}) {
  const width = max > 0 ? Math.max((value / max) * 100, value > 0 ? 2 : 0) : 0;
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="w-44 flex-shrink-0 truncate text-sm text-[var(--foreground)]" title={label}>
        {label}
      </span>
      <div className="relative h-6 flex-1 overflow-hidden rounded-md bg-[var(--background)]">
        <div
          className="absolute inset-y-0 left-0 rounded-md transition-[width] duration-500"
          style={{ width: `${width}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-16 flex-shrink-0 text-right text-sm tabular-nums text-[var(--text-muted)]">
        {valueLabel ?? num(value)}
      </span>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="py-6 text-center text-sm text-[var(--text-muted)]">{message}</p>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AllAnalytics | null>(null);
  const [clusters, setClusters] = useState<ClusterStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // days=3650 ≈ all-time for trends-derived views
      const [allRes, clusterRes] = await Promise.all([
        fetch('/api/analytics?type=all&days=3650'),
        fetch('/api/analytics?type=clusters'),
      ]);
      if (!allRes.ok) throw new Error(`Analytics request failed (${allRes.status})`);
      const all: AllAnalytics = await allRes.json();
      setData(all);
      if (clusterRes.ok) {
        const c = await clusterRes.json();
        setClusters(c.clusters ?? []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-[var(--text-muted)]">Loading analytics…</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-red-500">{error ?? 'No analytics available.'}</p>
        <button
          type="button"
          onClick={load}
          className="rounded-xl border-2 border-[var(--primary)] px-5 py-2 font-medium text-[var(--primary)] transition-colors hover:bg-[var(--primary)]/10"
        >
          Retry
        </button>
      </div>
    );
  }

  const { engagementStats, repeatVisitorStats, pathAttemptStats, diagnosisTrends, dropOffPoints } = data;

  // Derive all-time diagnosis distribution from trends.
  const byTypeMap = new Map<string, number>();
  for (const t of diagnosisTrends) {
    byTypeMap.set(t.diagnosis_type, (byTypeMap.get(t.diagnosis_type) ?? 0) + t.count);
  }
  const byType = Array.from(byTypeMap.entries())
    .map(([diagnosis_type, count]) => ({ diagnosis_type, count }))
    .sort((a, b) => b.count - a.count);
  const byTypeMax = byType.reduce((m, d) => Math.max(m, d.count), 0);

  // Derive per-day totals for the over-time view.
  const byDayMap = new Map<string, number>();
  for (const t of diagnosisTrends) {
    byDayMap.set(t.date, (byDayMap.get(t.date) ?? 0) + t.count);
  }
  const byDay = Array.from(byDayMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
  const byDayMax = byDay.reduce((m, d) => Math.max(m, d.count), 0);

  // Group "diagnosis by wallet type" into wallet -> rows.
  const walletGroups = new Map<string, DiagnosisByWalletType[]>();
  for (const row of data.diagnosisByWalletType) {
    const arr = walletGroups.get(row.wallet_type) ?? [];
    arr.push(row);
    walletGroups.set(row.wallet_type, arr);
  }

  const valueGroups = new Map<string, DiagnosisByValueRange[]>();
  for (const row of data.diagnosisByValueRange) {
    const arr = valueGroups.get(row.value_range) ?? [];
    arr.push(row);
    valueGroups.set(row.value_range, arr);
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">Analytics</h1>
          <p className="mt-1 text-[var(--text-muted)]">
            Anonymous, aggregate usage data. No personally identifying information is stored.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="flex-shrink-0 rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:border-[var(--primary)]"
        >
          Refresh
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Diagnoses" value={num(engagementStats.total_diagnoses)} />
        <StatCard label="Unique visitors" value={num(repeatVisitorStats.total_unique_visitors)} />
        <StatCard
          label="Repeat rate"
          value={pct(repeatVisitorStats.repeat_rate)}
          sub={`${num(repeatVisitorStats.repeat_visitors)} returned`}
        />
        <StatCard
          label="Avg attempts"
          value={pathAttemptStats.avg_attempts_before_accept.toFixed(1)}
          sub="before accepting"
        />
        <StatCard label="Learn clicks" value={pct(engagementStats.learn_click_rate)} sub={`${num(engagementStats.clicked_learn_count)} total`} />
        <StatCard label="Recovery clicks" value={pct(engagementStats.hwr_click_rate)} sub={`${num(engagementStats.clicked_hwr_count)} total`} />
      </div>

      {/* Diagnosis distribution */}
      <Section title="Diagnoses by type" hint="All recorded diagnoses, most common first.">
        {byType.length === 0 ? (
          <EmptyState message="No diagnoses recorded yet." />
        ) : (
          <div>
            {byType.map((d, i) => (
              <BarRow
                key={d.diagnosis_type}
                label={prettify(d.diagnosis_type)}
                value={d.count}
                max={byTypeMax}
                color={PALETTE[i % PALETTE.length]}
              />
            ))}
          </div>
        )}
      </Section>

      {/* Over time */}
      <Section title="Diagnoses over time" hint="Total diagnoses recorded per day.">
        {byDay.length === 0 ? (
          <EmptyState message="No activity yet." />
        ) : (
          <div className="flex h-40 items-end gap-1 overflow-x-auto">
            {byDay.map((d) => (
              <div key={d.date} className="flex min-w-[10px] flex-1 flex-col items-center justify-end gap-1" title={`${d.date}: ${d.count}`}>
                <div
                  className="w-full rounded-t bg-[var(--primary)] transition-[height] duration-500"
                  style={{ height: `${byDayMax > 0 ? Math.max((d.count / byDayMax) * 100, 3) : 0}%` }}
                />
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Drop-off */}
      <Section title="Drop-off points" hint="Where people leave without reaching a diagnosis. Higher rate = bigger leak.">
        {dropOffPoints.length === 0 ? (
          <EmptyState message="No path data yet." />
        ) : (
          <div>
            {dropOffPoints.map((d) => (
              <BarRow
                key={d.question_id}
                label={prettify(d.question_id)}
                value={d.drop_off_rate}
                max={1}
                color="#e17055"
                valueLabel={`${pct(d.drop_off_rate)} (${num(d.drop_off_count)}/${num(d.total_reached)})`}
              />
            ))}
          </div>
        )}
      </Section>

      {/* By wallet type + by value range, side by side on large screens */}
      <div className="grid gap-8 lg:grid-cols-2">
        <Section title="Accepted diagnosis by wallet type">
          {walletGroups.size === 0 ? (
            <EmptyState message="No accepted diagnoses yet." />
          ) : (
            <div className="space-y-5">
              {Array.from(walletGroups.entries()).map(([wallet, rows]) => {
                const max = rows.reduce((m, r) => Math.max(m, r.count), 0);
                return (
                  <div key={wallet}>
                    <p className="mb-1 text-sm font-semibold text-[var(--foreground)]">{prettify(wallet)}</p>
                    {rows.map((r, i) => (
                      <BarRow key={r.diagnosis_type} label={prettify(r.diagnosis_type)} value={r.count} max={max} color={PALETTE[i % PALETTE.length]} />
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        <Section title="Accepted diagnosis by amount lost">
          {valueGroups.size === 0 ? (
            <EmptyState message="No accepted diagnoses yet." />
          ) : (
            <div className="space-y-5">
              {Array.from(valueGroups.entries()).map(([range, rows]) => {
                const max = rows.reduce((m, r) => Math.max(m, r.count), 0);
                return (
                  <div key={range}>
                    <p className="mb-1 text-sm font-semibold text-[var(--foreground)]">{prettify(range)}</p>
                    {rows.map((r, i) => (
                      <BarRow key={r.diagnosis_type} label={prettify(r.diagnosis_type)} value={r.count} max={max} color={PALETTE[i % PALETTE.length]} />
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      </div>

      {/* Clusters */}
      <Section title="Clusters" hint="Repeated wallet + key-generation-period + diagnosis combinations — possible coordinated incidents.">
        {clusters.length === 0 ? (
          <EmptyState message="No clusters detected yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--text-muted)]">
                  <th className="py-2 pr-4 font-medium">Wallet</th>
                  <th className="py-2 pr-4 font-medium">Generated</th>
                  <th className="py-2 pr-4 font-medium">Diagnosis</th>
                  <th className="py-2 pr-4 text-right font-medium">Count</th>
                  <th className="py-2 pr-4 font-medium">First seen</th>
                  <th className="py-2 font-medium">Last seen</th>
                </tr>
              </thead>
              <tbody>
                {clusters.map((c, i) => (
                  <tr key={i} className="border-b border-[var(--border)]/50 text-[var(--text-muted)]">
                    <td className="py-2 pr-4 text-[var(--foreground)]">{prettify(c.wallet)}</td>
                    <td className="py-2 pr-4">{c.generation_period}</td>
                    <td className="py-2 pr-4">{prettify(c.diagnosis)}</td>
                    <td className="py-2 pr-4 text-right tabular-nums text-[var(--foreground)]">{num(c.count)}</td>
                    <td className="py-2 pr-4">{c.first_seen?.slice(0, 10)}</td>
                    <td className="py-2">{c.last_seen?.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
