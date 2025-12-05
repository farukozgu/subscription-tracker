import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// If env vars are present, create a real Supabase client. Otherwise export
// a lightweight stub that provides the minimal chainable API used in this
// app so that static builds (prerender) on platforms like Vercel won't fail
// during module evaluation when environment variables are not yet configured.
function makeStub() {
    const store: any[] = [];

    const handler: any = {
        // internal store for mock rows
        _store: store,
        _lastInsert: null,

        from: (_table: string) => handler,

        // select just sets a flag; actual data is returned by the then()/single()
        select: (_sel?: string) => {
            handler._lastSelect = true;
            return handler;
        },

        // insert rows into the in-memory store and remember lastInsert
        insert: (rows?: any[]) => {
            const now = new Date().toISOString();
            const inserted = (rows || []).map((r: any) => {
                const id = (Date.now().toString(36) + Math.random().toString(36).slice(2));
                return {
                    id,
                    name: r.name ?? '',
                    price: typeof r.price === 'number' ? r.price : Number(r.price ?? 0),
                    currency: r.currency ?? 'TRY',
                    billing_period: r.billing_period ?? r.billingPeriod ?? 'monthly',
                    billing_day: r.billing_day ?? r.billingDay ?? 1,
                    category: r.category ?? 'other',
                    created_at: now,
                };
            });

            handler._lastInsert = inserted;
            handler._store.push(...inserted);
            return handler;
        },

        delete: () => handler,
        update: (_vals?: any) => handler,
        eq: () => handler,
        order: () => handler,

        // single returns the last inserted row if present, otherwise first store item
        single: async () => {
            if (handler._lastInsert) return { data: handler._lastInsert[0], error: null };
            return { data: handler._store[0] ?? null, error: null };
        },

        // then makes the chain awaitable. If select was used, return the full store.
        then: (onfulfilled: any) => {
            const res = { data: handler._store.length ? [...handler._store].reverse() : null, error: null };
            return Promise.resolve(res).then(onfulfilled);
        },
    };

    return handler as unknown as SupabaseClient;
}

export const supabase: SupabaseClient =
    supabaseUrl && supabaseAnonKey
        ? createClient(supabaseUrl, supabaseAnonKey)
        : makeStub();