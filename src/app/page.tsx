'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Subscription } from '@/types/subscription';
import {
  mapRowToSubscription,
  type SubscriptionRow,
} from '@/lib/subscriptionMapper';
import { SubscriptionFormModal } from '@/components/SubscriptionFormModal';
import { motion } from "motion/react"

// Category labels
function getCategoryLabel(category: Subscription['category']) {
  switch (category) {
    case 'video':
      return 'Video';
    case 'music':
      return 'Music';
    case 'gaming':
      return 'Gaming';
    case 'productivity':
      return 'Productivity';
    default:
      return 'Other';
  }
}

// Category badge styles
const categoryBadgeStyles: Record<Subscription['category'], string> = {
  video:
    'border-purple-500/40 bg-purple-500/10 text-purple-200',
  music:
    'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
  gaming:
    'border-orange-500/40 bg-orange-500/10 text-orange-200',
  productivity:
    'border-sky-500/40 bg-sky-500/10 text-sky-200',
  other:
    'border-slate-500/40 bg-slate-500/10 text-slate-200',
};

// Currency helper type + symbol
type Currency = Subscription['currency'];

function getCurrencySymbol(currency: Currency) {
  if (currency === 'TRY') return '₺';
  if (currency === 'USD') return '$';
  if (currency === 'EUR') return '€';
  return '';
}

export default function Home() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSubscriptions() {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Supabase error:', error);
          setError('An error occurred while loading subscriptions. Please try again.');
          return;
        }

        const mapped =
          (data as SubscriptionRow[] | null)?.map(
            mapRowToSubscription
          ) ?? [];

        setSubscriptions(mapped);
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchSubscriptions();
  }, []);

  // --- Analytics ---

  // Total monthly cost per currency (annuals converted to monthly)
  const monthlyTotals = subscriptions.reduce(
    (acc, sub) => {
      const monthlyValue =
        sub.billingPeriod === 'monthly'
          ? sub.price
          : sub.price / 12;

      acc[sub.currency] += monthlyValue;
      return acc;
    },
    { TRY: 0, USD: 0, EUR: 0 } as Record<Currency, number>
  );

  // Total yearly cost per currency (monthlies * 12)
  const yearlyTotals = subscriptions.reduce(
    (acc, sub) => {
      const yearlyValue =
        sub.billingPeriod === 'monthly'
          ? sub.price * 12
          : sub.price;

      acc[sub.currency] += yearlyValue;
      return acc;
    },
    { TRY: 0, USD: 0, EUR: 0 } as Record<Currency, number>
  );

  const totalSubscriptions = subscriptions.length;

  const monthlyCount = subscriptions.filter(
    (sub) => sub.billingPeriod === 'monthly'
  ).length;

  const yearlyCount = subscriptions.filter(
    (sub) => sub.billingPeriod === 'yearly'
  ).length;

  // Most expensive subscription by monthly equivalent (ignores currency value differences)
  const mostExpensive = subscriptions.reduce<Subscription | null>(
    (max, sub) => {
      if (!max) return sub;

      const maxMonthly =
        max.billingPeriod === 'monthly'
          ? max.price
          : max.price / 12;

      const subMonthly =
        sub.billingPeriod === 'monthly'
          ? sub.price
          : sub.price / 12;

      return subMonthly > maxMonthly ? sub : max;
    },
    null
  );

  const mostExpensiveMonthlyCost =
    mostExpensive &&
    (mostExpensive.billingPeriod === 'monthly'
      ? mostExpensive.price
      : mostExpensive.price / 12);

  function handleAddSubscription(newSub: Subscription) {
    setSubscriptions((prev) => [newSub, ...prev]);
  }

  async function handleDeleteSubscription(id: string) {
    setDeletingId(id);
    setError(null);

    try {
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase delete error:', error);
        setError('An error occurred while deleting the subscription. Please try again.');
        return;
      }

      setSubscriptions((prev) =>
        prev.filter((sub) => sub.id !== id)
      );
    } catch (err) {
      console.error('Unexpected delete error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-950 text-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <motion.header
          className="mb-8 flex flex-col items-start justify-between flex-wrap gap-4 sm:flex-row sm:items-center"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut", delay: 0.2 }}
        >
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/70 px-3 py-1 text-xs text-slate-300">
              <span>Subscription Control Panel</span>
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Subscription Tracker
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-300">
              Track your digital subscriptions, view your monthly and yearly expenses, and keep your finances under control.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 cursor-pointer rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-sky-500 hover:shadow-md"
          >
            <span className="text-base">＋</span>
            <span>Add Subscription</span>
          </button>
        </motion.header>

        {/* New Subscription Modal */}
        <SubscriptionFormModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAdd={handleAddSubscription}
        />

        {/* Monthly Total Spending (per currency) */}
        <motion.section
          className="mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
        >
          <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70 p-4 transition hover:-translate-y-0.5 hover:border-sky-500/60 hover:bg-slate-900">
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-sky-500/10" />
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Monthly Total Spending
            </h2>
            {loading ? (
              <p className="mt-3 text-sm text-slate-500">
                Calculating...
              </p>
            ) : (
              <>
                <div className="mt-3 space-y-1">
                  {(['TRY', 'USD', 'EUR'] as Currency[]).map((cur) =>
                    monthlyTotals[cur] > 0 ? (
                      <p
                        key={cur}
                        className="text-lg font-semibold"
                      >
                        {getCurrencySymbol(cur)}
                        {monthlyTotals[cur].toFixed(2)}{' '}
                        <span className="text-xs text-slate-400">
                          / month ({cur})
                        </span>
                      </p>
                    ) : null
                  )}
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  Annual subscriptions are converted to monthly equivalents.
                </p>
              </>
            )}
          </div>
        </motion.section>

        {/* Analytics Cards */}
        {!loading && subscriptions.length > 0 && (
          <motion.section
            className="mb-8 grid gap-3 md:grid-cols-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
          >
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 transition hover:-translate-y-0.5 hover:border-sky-500/60 hover:bg-slate-900">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Total Subscription
              </h3>
              <p className="mt-2 text-2xl font-bold">
                {totalSubscriptions}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Number of active subscriptions.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 transition hover:-translate-y-0.5 hover:border-sky-500/60 hover:bg-slate-900">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Monthly / Annual Distribution
              </h3>
              <p className="mt-2 text-lg font-semibold">
                {monthlyCount} monthly · {yearlyCount} yearly
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Subscription distribution by payment period.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 transition hover:-translate-y-0.5 hover:border-sky-500/60 hover:bg-slate-900">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Estimated Annual Expense
              </h3>
              <div className="mt-2 space-y-1">
                {(['TRY', 'USD', 'EUR'] as Currency[]).map((cur) =>
                  yearlyTotals[cur] > 0 ? (
                    <p
                      key={cur}
                      className="text-base font-semibold"
                    >
                      {getCurrencySymbol(cur)}
                      {yearlyTotals[cur].toFixed(2)}{' '}
                      <span className="text-[11px] text-slate-400">
                        / year ({cur})
                      </span>
                    </p>
                  ) : null
                )}
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Monthly subscriptions are calculated over 12 months.
              </p>
            </div>

            {mostExpensive && mostExpensiveMonthlyCost && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 transition hover:-translate-y-0.5 hover:border-sky-500/60 hover:bg-slate-900">
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Most Expensive Subscription (Monthly)
                </h3>
                <p className="mt-2 text-base font-semibold">
                  {mostExpensive.name}
                </p>
                <p className="text-sm text-slate-200">
                  {getCurrencySymbol(mostExpensive.currency)}
                  {mostExpensiveMonthlyCost.toFixed(2)} / month
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  {mostExpensive.billingPeriod === 'monthly'
                    ? 'Billed monthly directly.'
                    : 'Annual bill shown as monthly equivalent.'}
                </p>
              </div>
            )}
          </motion.section>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Subscription list */}
        <motion.section
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.4 }}
        >
          <h2 className="mb-3 text-lg font-semibold">
            Subscriptions
          </h2>

          {loading ? (
            <p className="text-sm text-slate-400">
              Subscriptions are loading...
            </p>
          ) : subscriptions.length === 0 ? (
            <p className="text-sm text-slate-400">
              You haven't added any subscriptions yet. You can start by using the{' '}
              <span className="rounded-md bg-slate-800 px-1.5 py-0.5 text-xs">
                Add Subscription
              </span>{' '}
              button in the top right corner.
            </p>
          ) : (
            <div className="space-y-3">
              {subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 p-4 transition hover:-translate-y-0.5 hover:border-sky-500/60 hover:bg-slate-900"
                >
                  <div>
                    <p className="text-base font-medium">
                      {sub.name}
                    </p>
                    <p className="text-sm text-slate-400">
                      Payment date: {sub.billingDay}. day ·{' '}
                      {sub.billingPeriod === 'monthly'
                        ? 'Monthly'
                        : 'Yearly'}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${categoryBadgeStyles[sub.category]
                          }`}
                      >
                        {getCategoryLabel(sub.category)}
                      </span>
                      <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-800/60 px-2.5 py-0.5 text-[11px] font-medium text-slate-200">
                        {sub.billingPeriod === 'monthly'
                          ? 'Monthly plan'
                          : 'Yearly plan'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <p className="text-lg font-semibold">
                        {getCurrencySymbol(sub.currency)}
                        {sub.price.toFixed(2)}
                      </p>
                      {sub.billingPeriod === 'yearly' && (
                        <p className="text-xs text-slate-400">
                          (~{getCurrencySymbol(sub.currency)}
                          {(sub.price / 12).toFixed(2)}/month)
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteSubscription(sub.id)
                      }
                      disabled={deletingId === sub.id}
                      className="text-xs text-white cursor-pointer bg-red-400 px-3 py-1 rounded-full transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deletingId === sub.id
                        ? 'Deleting...'
                        : 'Delete Subscription'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.section>
      </div>
    </main>
  );
}
