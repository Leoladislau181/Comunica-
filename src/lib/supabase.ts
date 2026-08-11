import { createClient } from '@supabase/supabase-js';

// Essas variáveis devem ser configuradas no arquivo .env ou na hospedagem.
// ATENÇÃO: Nunca coloque chaves secretas (como service_role_key) aqui.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder_anon_key';

if (supabaseUrl === 'https://placeholder.supabase.co') {
  console.warn('⚠️ Credenciais do Supabase não encontradas. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
