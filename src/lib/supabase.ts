import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
    // Mantem o fluxo simples para login por senha no portal.
    detectSessionInUrl: false,
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
          name: string;
          week_number: number;
          start_date: string | null;
          end_date: string | null;
          status: 'planned' | 'in_progress' | 'completed';
          notes: string | null;
          created_at: string;
        };
      };
      sprint_tasks: {
        Row: {
          id: number;
          sprint_id: number;
          backlog_item_id: number | null;
          title: string;
          description: string | null;
          context_notes: string | null;
          subtasks: any;
          attachments: any;
          start_date: string | null;
          end_date: string | null;
          due_date: string | null;
          completed_at: string | null;
          is_completed: boolean;
          week_number: number;
          task_order: number;
          created_at: string;
        };
      };
      sprint_backlog: {
        Row: {
          id: number;
          client_id: number;
          sprint_id: number | null;
          title: string;
          details: string | null;
          context_notes: string | null;
          subtasks: any;
          attachments: any;
          status: 'planned' | 'in_progress' | 'done';
          occurred_on: string | null;
          due_date: string | null;
          completed_at: string | null;
          created_by_user_id: number;
          created_at: string;
        };
      };
      project_calendar_events: {
        Row: {
          id: number;
          client_id: number;
          title: string;
          start_at: string;
          end_at: string;
          type: 'sprint_delivery' | 'meeting' | 'transcript' | 'general' | 'task_due' | 'task_completed';
          description: string | null;
          participant_ids: number[];
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
          category: string;
          event_type: string;
          title: string;
          message: string;
          is_read: boolean;
          read_at: string | null;
          occurred_at: string;
          link_to: string | null;
          source_entity_type: string | null;
          source_entity_id: number | null;
          metadata: any;
          created_at: string;
        };
      };
      chat_rooms: {
        Row: {
          id: number;
          client_id: number;
          room_type: 'general' | 'internal' | 'direct' | 'group';
          name: string;
          direct_user_a_id: number | null;
          direct_user_b_id: number | null;
          created_by_user_id: number;
          created_at: string;
        };
      };
      chat_room_participants: {
        Row: {
          room_id: number;
          user_id: number;
          added_by_user_id: number | null;
          is_admin: boolean;
          last_read_at: string | null;
          joined_at: string;
        };
      };
      chat_messages: {
        Row: {
          id: number;
          room_id: number;
          user_id: number;
          message: string;
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
