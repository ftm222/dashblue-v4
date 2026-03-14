export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          avatar_url: string | null;
          role: "admin" | "viewer";
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          phone?: string | null;
          avatar_url?: string | null;
          role?: "admin" | "viewer";
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          avatar_url?: string | null;
          role?: "admin" | "viewer";
          active?: boolean;
          updated_at?: string;
        };
      };
      squads: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          name?: string;
        };
      };
      people: {
        Row: {
          id: string;
          name: string;
          avatar_url: string | null;
          role: "sdr" | "closer";
          squad_id: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          avatar_url?: string | null;
          role: "sdr" | "closer";
          squad_id?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          avatar_url?: string | null;
          role?: "sdr" | "closer";
          squad_id?: string | null;
          active?: boolean;
        };
      };
      integrations: {
        Row: {
          id: string;
          name: string;
          type: "crm" | "ads";
          status: "connected" | "syncing" | "error" | "disconnected";
          last_sync: string | null;
          config: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: "crm" | "ads";
          status?: "connected" | "syncing" | "error" | "disconnected";
          last_sync?: string | null;
          config?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          type?: "crm" | "ads";
          status?: "connected" | "syncing" | "error" | "disconnected";
          last_sync?: string | null;
          config?: Json;
        };
      };
      funnel_mappings: {
        Row: {
          id: string;
          step_key: string;
          step_label: string;
          crm_field: string | null;
          crm_value: string | null;
          sort_order: number;
        };
        Insert: {
          id?: string;
          step_key: string;
          step_label: string;
          crm_field?: string | null;
          crm_value?: string | null;
          sort_order?: number;
        };
        Update: {
          step_key?: string;
          step_label?: string;
          crm_field?: string | null;
          crm_value?: string | null;
          sort_order?: number;
        };
      };
      tags: {
        Row: {
          id: string;
          original: string;
          alias: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          original: string;
          alias: string;
          created_at?: string;
        };
        Update: {
          original?: string;
          alias?: string;
        };
      };
      goals: {
        Row: {
          id: string;
          person_id: string | null;
          type: "revenue" | "booked" | "leads" | "received" | "won";
          target: number;
          period_start: string;
          period_end: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          person_id?: string | null;
          type: "revenue" | "booked" | "leads" | "received" | "won";
          target: number;
          period_start: string;
          period_end: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          person_id?: string | null;
          type?: "revenue" | "booked" | "leads" | "received" | "won";
          target?: number;
          period_start?: string;
          period_end?: string;
        };
      };
      setup_checklist: {
        Row: {
          id: string;
          key: string;
          label: string;
          completed: boolean;
          route: string;
        };
        Insert: {
          id?: string;
          key: string;
          label: string;
          completed?: boolean;
          route: string;
        };
        Update: {
          label?: string;
          completed?: boolean;
          route?: string;
        };
      };
      evidence: {
        Row: {
          id: string;
          contact_name: string;
          phone: string | null;
          email: string | null;
          crm_url: string | null;
          crm_lead_id: string | null;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          funnel_step: string;
          sdr_id: string | null;
          closer_id: string | null;
          value: number;
          tags: string[];
          badges: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          contact_name: string;
          phone?: string | null;
          email?: string | null;
          crm_url?: string | null;
          crm_lead_id?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          funnel_step: string;
          sdr_id?: string | null;
          closer_id?: string | null;
          value?: number;
          tags?: string[];
          badges?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          contact_name?: string;
          phone?: string | null;
          email?: string | null;
          crm_url?: string | null;
          crm_lead_id?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          funnel_step?: string;
          sdr_id?: string | null;
          closer_id?: string | null;
          value?: number;
          tags?: string[];
          badges?: string[];
        };
      };
      contracts: {
        Row: {
          id: string;
          evidence_id: string | null;
          client_name: string;
          sdr_id: string | null;
          closer_id: string | null;
          squad_id: string | null;
          value: number;
          status: "signed_paid" | "signed_unpaid" | "unsigned";
          signed_at: string | null;
          paid_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          evidence_id?: string | null;
          client_name: string;
          sdr_id?: string | null;
          closer_id?: string | null;
          squad_id?: string | null;
          value?: number;
          status?: "signed_paid" | "signed_unpaid" | "unsigned";
          signed_at?: string | null;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          evidence_id?: string | null;
          client_name?: string;
          sdr_id?: string | null;
          closer_id?: string | null;
          squad_id?: string | null;
          value?: number;
          status?: "signed_paid" | "signed_unpaid" | "unsigned";
          signed_at?: string | null;
          paid_at?: string | null;
        };
      };
      campaigns: {
        Row: {
          id: string;
          integration_id: string | null;
          external_id: string | null;
          name: string;
          source: string | null;
          medium: string | null;
          investment: number;
          impressions: number;
          clicks: number;
          leads: number;
          booked: number;
          received: number;
          won: number;
          revenue: number;
          period_start: string;
          period_end: string;
          synced_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          integration_id?: string | null;
          external_id?: string | null;
          name: string;
          source?: string | null;
          medium?: string | null;
          investment?: number;
          impressions?: number;
          clicks?: number;
          leads?: number;
          booked?: number;
          received?: number;
          won?: number;
          revenue?: number;
          period_start: string;
          period_end: string;
          synced_at?: string;
          created_at?: string;
        };
        Update: {
          integration_id?: string | null;
          external_id?: string | null;
          name?: string;
          source?: string | null;
          medium?: string | null;
          investment?: number;
          impressions?: number;
          clicks?: number;
          leads?: number;
          booked?: number;
          received?: number;
          won?: number;
          revenue?: number;
          period_start?: string;
          period_end?: string;
          synced_at?: string;
        };
      };
      call_logs: {
        Row: {
          id: string;
          person_id: string | null;
          evidence_id: string | null;
          call_type: "r1" | "r2" | "follow_up" | null;
          answered: boolean;
          duration_seconds: number;
          called_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          person_id?: string | null;
          evidence_id?: string | null;
          call_type?: "r1" | "r2" | "follow_up" | null;
          answered?: boolean;
          duration_seconds?: number;
          called_at: string;
          created_at?: string;
        };
        Update: {
          person_id?: string | null;
          evidence_id?: string | null;
          call_type?: "r1" | "r2" | "follow_up" | null;
          answered?: boolean;
          duration_seconds?: number;
          called_at?: string;
        };
      };
      alerts: {
        Row: {
          id: string;
          type: "warning" | "critical" | "info";
          message: string;
          link: string | null;
          dismissible: boolean;
          dismissed_by: string[];
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: "warning" | "critical" | "info";
          message: string;
          link?: string | null;
          dismissible?: boolean;
          dismissed_by?: string[];
          expires_at?: string | null;
          created_at?: string;
        };
        Update: {
          type?: "warning" | "critical" | "info";
          message?: string;
          link?: string | null;
          dismissible?: boolean;
          dismissed_by?: string[];
          expires_at?: string | null;
        };
      };
      logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          entity_type: string | null;
          entity_id: string | null;
          details: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          entity_type?: string | null;
          entity_id?: string | null;
          details?: Json | null;
          created_at?: string;
        };
        Update: {
          action?: string;
          entity_type?: string | null;
          entity_id?: string | null;
          details?: Json | null;
        };
      };
    };
    Views: {
      v_funnel_summary: {
        Row: {
          funnel_step: string;
          step_label: string;
          sort_order: number;
          count: number;
          conversion_from_previous: number | null;
          conversion_from_top: number | null;
          period_month: string;
        };
      };
      v_person_metrics: {
        Row: {
          person_id: string;
          name: string;
          role: "sdr" | "closer";
          squad_id: string | null;
          squad_name: string | null;
          avatar_url: string | null;
          leads: number;
          booked: number;
          received: number;
          negotiation: number;
          won: number;
          revenue: number;
          show_rate: number;
          conversion_rate: number;
          ticket_medio: number;
          period_month: string | null;
        };
      };
      v_call_metrics: {
        Row: {
          person_id: string;
          person_name: string;
          person_role: "sdr" | "closer";
          total_calls: number;
          answered_calls: number;
          missed_calls: number;
          avg_duration_minutes: number | null;
          r1_calls: number;
          r2_calls: number;
          follow_ups: number;
          period_month: string;
        };
      };
      v_squad_metrics: {
        Row: {
          squad_id: string;
          squad_name: string;
          revenue: number;
          contracts: number;
          member_count: number;
          leads: number;
          booked: number;
          received: number;
          show_rate: number;
          conversion_rate: number;
          ticket_medio: number;
          period_month: string | null;
        };
      };
      v_financial_summary: {
        Row: {
          total_contracts: number;
          total_revenue: number;
          signed_contracts: number;
          signed_revenue: number;
          paid_contracts: number;
          paid_revenue: number;
          unsigned_contracts: number;
          signature_gap: number;
          unpaid_contracts: number;
          payment_gap: number;
          total_gap: number;
          period_month: string;
        };
      };
      v_campaign_kpis: {
        Row: {
          total_investment: number;
          total_leads: number;
          total_booked: number;
          total_received: number;
          total_won: number;
          total_revenue: number;
          cpl: number;
          roas: number;
          cac: number;
          period_start: string;
          period_end: string;
        };
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
