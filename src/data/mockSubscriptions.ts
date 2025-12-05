import type { Subscription } from '@/types/subscription';

export const mockSubscriptions: Subscription[] = [
    {
        id: '1',
        name: 'Netflix',
        price: 119.99,
        currency: 'TRY',
        billingPeriod: 'monthly',
        billingDay: 15,
        category: 'video',
    },
    {
        id: '2',
        name: 'Spotify',
        price: 59.99,
        currency: 'TRY',
        billingPeriod: 'monthly',
        billingDay: 3,
        category: 'music',
    },
    {
        id: '3',
        name: 'PlayStation Plus',
        price: 599.99,
        currency: 'TRY',
        billingPeriod: 'yearly',
        billingDay: 20,
        category: 'gaming',
    },
];
