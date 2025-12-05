export type BillingPeriod = 'monthly' | 'yearly';

export type SubscriptionCategory =
    | 'video'
    | 'music'
    | 'gaming'
    | 'productivity'
    | 'other';

export interface Subscription {
    id: string;
    name: string;
    price: number;
    currency: 'TRY' | 'USD' | 'EUR';
    billingPeriod: BillingPeriod;
    billingDay: number;
    category: SubscriptionCategory;
    createdAt?: string;
}
