import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// If env vars are present, create a real Supabase client. Otherwise export
// a lightweight stub that provides the minimal chainable API used in this
// app so that static builds (prerender) on platforms like Vercel won't fail
// during module evaluation when environment variables are not yet configured.
function makeStub() {
    const handler: any = {
        from: (_table: string) => handler,
        select: (_sel?: string) => handler,
        insert: (_rows?: any) => handler,
        delete: () => handler,
        update: (_vals?: any) => handler,
        eq: () => handler,
        order: () => handler,
        // Terminal executor methods return a resolved promise with null data.
        single: async () => ({ data: null, error: null }),
        then: async (onfulfilled: any) => onfulfilled({ data: null, error: null }),
    };

    return handler as unknown as SupabaseClient;
}

export const supabase: SupabaseClient =
    supabaseUrl && supabaseAnonKey
        ? createClient(supabaseUrl, supabaseAnonKey)
        : makeStub();