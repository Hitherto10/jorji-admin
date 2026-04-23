import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://xtmyggnhvnyywjqdsvht.supabase.co'
const SUPABASE_SERVICE_KEY = 'sb_publishable_RUbAeeOUf5neroUCcuy6Qw_bJA8vpSW'

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
