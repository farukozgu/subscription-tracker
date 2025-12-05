import type {
    Subscription,
    SubscriptionCategory,
    BillingPeriod,
} from '@/types/subscription';

export type SubscriptionRow = {
    id: string;
    name: string;
    price: number | string;
    currency: string;
    billing_period: BillingPeriod;
    billing_day: number;
    category: SubscriptionCategory;
    created_at: string;
};

export function mapRowToSubscription(row: SubscriptionRow): Subscription {
    return {
        id: row.id,
        name: row.name,
        price:
            typeof row.price === 'number' ? row.price : Number(row.price),
        currency: row.currency as Subscription['currency'],
        billingPeriod: row.billing_period,
        billingDay: row.billing_day,
        category: row.category,
        createdAt: row.created_at,
    };
}
