import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Credenciais do Supabase não encontradas. Verifique o arquivo .env'
  );
}

/**
 * Cliente Supabase com service_role key
 * Use este cliente no backend para operações que requerem permissões elevadas
 * NUNCA exponha este cliente ou a service_role key no frontend
 */
export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Cliente Supabase com anon key (para uso futuro no frontend)
 * Este cliente respeita as políticas RLS (Row Level Security)
 */
export const createAnonClient = () => {
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!anonKey) {
    throw new Error('SUPABASE_ANON_KEY não encontrada no .env');
  }
  return createClient(supabaseUrl, anonKey);
};

// Tipos auxiliares para operações comuns
export type DbResult<T> = {
  data: T | null;
  error: Error | null;
};

export type DbResultArray<T> = {
  data: T[] | null;
  error: Error | null;
};
