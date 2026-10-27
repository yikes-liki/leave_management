import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

export const isSupabaseConfigured = Boolean(url && key)

// Keep the bundle loadable when env vars are missing so the UI can show a clear
// "not configured" screen instead of a blank page.
export const supabase = createClient(
  url ?? 'http://localhost:54321',
  key ?? 'missing-publishable-key',
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } },
)
