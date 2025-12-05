'use client';

import {
    useState,
    FormEvent,
    ChangeEvent,
} from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Subscription } from '@/types/subscription';
import {
    mapRowToSubscription,
    type SubscriptionRow,
} from '@/lib/subscriptionMapper';
import { motion } from "motion/react"

type SubscriptionFormState = {
    name: string;
    price: string;
    currency: Subscription['currency'];
    billingPeriod: 'monthly' | 'yearly';
    billingDay: string;
    category:
    | 'video'
    | 'music'
    | 'gaming'
    | 'productivity'
    | 'other';
};

type SubscriptionFormModalProps = {
    open: boolean;
    onClose: () => void;
    onAdd: (subscription: Subscription) => void;
};

export function SubscriptionFormModal({
    open,
    onClose,
    onAdd,
}: SubscriptionFormModalProps) {
    const [form, setForm] = useState<SubscriptionFormState>({
        name: '',
        price: '',
        currency: 'TRY',
        billingPeriod: 'monthly',
        billingDay: '1',
        category: 'video',
    });

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!open) return null;

    function handleChange(
        e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        if (!form.name.trim()) {
            setError('Please enter a service name.');
            setSubmitting(false);
            return;
        }

        const price = Number(form.price);
        const billingDay = Number(form.billingDay);

        if (Number.isNaN(price) || price <= 0) {
            setError('Please enter a valid price.');
            setSubmitting(false);
            return;
        }

        if (
            Number.isNaN(billingDay) ||
            billingDay < 1 ||
            billingDay > 31
        ) {
            setError('The payment date must be between the 1st and the 31st.');
            setSubmitting(false);
            return;
        }

        try {
            const { data, error: insertError } = await supabase
                .from('subscriptions')
                .insert([
                    {
                        name: form.name.trim(),
                        price,
                        currency: form.currency,
                        billing_period: form.billingPeriod,
                        billing_day: billingDay,
                        category: form.category,
                    },
                ])
                .select('*')
                .single();

            if (insertError) {
                console.error('Supabase insert error:', insertError);
                setError('An error occurred while adding the subscription. Please try again.');
                return;
            }

            const mapped = mapRowToSubscription(
                data as SubscriptionRow
            );

            onAdd(mapped);

            // Form reset
            setForm({
                name: '',
                price: '',
                currency: 'TRY',
                billingPeriod: 'monthly',
                billingDay: '1',
                category: 'video',
            });

            onClose();
        } catch (err) {
            console.error('Unexpected insert error:', err);
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            {/* Modal box */}
            <motion.div
                className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-xl"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
            >
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
                        Add Subscription
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-sm text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                        ✕
                    </button>
                </div>

                {error && (
                    <p className="mb-3 text-sm text-red-300">{error}</p>
                )}

                <form
                    onSubmit={handleSubmit}
                    className="grid gap-4 md:grid-cols-2"
                >
                    <div className="md:col-span-2">
                        <label className="mb-1 block text-sm text-slate-200">
                            Service Name
                        </label>
                        <input
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-sky-500"
                            placeholder="Netflix, Spotify..."
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm text-slate-200">
                            Price
                        </label>
                        <input
                            name="price"
                            value={form.price}
                            onChange={handleChange}
                            type="number"
                            step="0.01"
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-sky-500"
                            placeholder="119.99"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm text-slate-200">
                            Currency
                        </label>
                        <select
                            name="currency"
                            value={form.currency}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-sky-500"
                        >
                            <option value="TRY">TRY (₺)</option>
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm text-slate-200">
                            Billing Period
                        </label>
                        <select
                            name="billingPeriod"
                            value={form.billingPeriod}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-sky-500"
                        >
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm text-slate-200">
                            Payment Day of Month
                        </label>
                        <input
                            name="billingDay"
                            value={form.billingDay}
                            onChange={handleChange}
                            type="number"
                            min={1}
                            max={31}
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-sky-500"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm text-slate-200">
                            Category
                        </label>
                        <select
                            name="category"
                            value={form.category}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-sky-500"
                        >
                            <option value="video">Video</option>
                            <option value="music">Music</option>
                            <option value="gaming">Gaming</option>
                            <option value="productivity">Productivity</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div className="mt-2 flex gap-2 md:col-span-2">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="inline-flex flex-1 items-center justify-center cursor-pointer rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {submitting ? 'Saving...' : 'Save'}
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex flex-1 items-center justify-center cursor-pointer rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
