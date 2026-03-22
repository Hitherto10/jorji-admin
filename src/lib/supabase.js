import { createClient } from '@supabase/supabase-js'

// Paste your Supabase URL and SERVICE ROLE key here
// This is an internal tool — service role key is fine here
const SUPABASE_URL = ' '
const SUPABASE_SERVICE_KEY = ' '

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
