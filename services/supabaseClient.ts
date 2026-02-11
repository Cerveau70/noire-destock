
import { createClient } from '@supabase/supabase-js';

// Récupération des clés depuis l'environnement (Support React Web et Expo Mobile)
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://jamupozhckfdyynejqfp.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_KEY || 'sb_publishable_RzpDNGjo1KxACAjCApM06g_FYYkfKH7';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase Keys are missing! Check your .env file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
