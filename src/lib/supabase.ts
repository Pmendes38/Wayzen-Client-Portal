import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL ou Anon Key não configuradas. Verifique o arquivo .env');
}

/**
 * Cliente Supabase para uso no frontend
 * Este cliente usa a anon key e respeita as políticas RLS (Row Level Security)
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Tipos para melhor TypeScript
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: number;
          email: string;
          name: string;
          role: 'admin' | 'consultant' | 'client';
          client_id: number | null;
          phone: string | null;
          avatar_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      clients: {
        Row: {
          id: number;
          company_name: string;
          trade_name: string | null;
          cnpj: string | null;
          segment: string | null;
          contact_name: string;
          contact_email: string;
          contact_phone: string | null;
          status: 'active' | 'inactive' | 'suspended';
          monthly_fee: number;
          contract_start: string | null;
          contract_end: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      tickets: {
        Row: {
          id: number;
          client_id: number;
          user_id: number;
          title: string;
          description: string;
          status: 'open' | 'in_progress' | 'resolved' | 'closed';
          priority: 'low' | 'medium' | 'high' | 'urgent';
          category: string | null;
          assigned_user_id: number | null;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      sprints: {
        Row: {
          id: number;
          client_id: number;
          week_number: number;
          start_date: string;
          end_date: string;
          status: 'planned' | 'in_progress' | 'completed';
          goals: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      sprint_tasks: {
        Row: {
          id: number;
          sprint_id: number;
          title: string;
          description: string | null;
          is_completed: boolean;
          task_order: number;
          created_at: string;
          updated_at: string;
        };
      };
      project_updates: {
        Row: {
          id: number;
          client_id: number;
          title: string;
          content: string;
          type: 'update' | 'milestone' | 'alert';
          created_by_user_id: number;
          created_at: string;
        };
      };
      shared_documents: {
        Row: {
          id: number;
          client_id: number;
          title: string;
          description: string | null;
          file_url: string;
          file_name: string;
          file_size: number;
          mime_type: string;
          category: string | null;
          uploaded_by_user_id: number;
          created_at: string;
        };
      };
      shared_reports: {
        Row: {
          id: number;
          client_id: number;
          title: string;
          type: 'weekly' | 'monthly' | 'quarterly' | 'custom';
          period_start: string;
          period_end: string;
          content: string;
          metrics: any;
          created_by_user_id: number;
          created_at: string;
        };
      };
      notifications: {
        Row: {
          id: number;
          user_id: number;
          type: string;
          title: string;
          message: string;
          is_read: boolean;
          created_at: string;
        };
      };
      ticket_messages: {
        Row: {
          id: number;
          ticket_id: number;
          user_id: number;
          message: string;
          is_internal: boolean;
          created_at: string;
        };
      };
    };
  };
};
