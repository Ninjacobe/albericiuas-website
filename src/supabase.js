import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const hasSupabaseConfig = Boolean(url && key)
export const supabaseConfigError = 'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Add both variables in Cloudflare Pages project settings.'

export const supabase = hasSupabaseConfig ? createClient(url, key) : null
