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
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          plan: "free" | "starter" | "pro" | "enterprise";
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          subscription_status: "trialing" | "active" | "past_due" | "canceled" | "unpaid";
          trial_ends_at: string | null;
          max_members: number;
          max_integrations: number;
          settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          plan?: "free" | "starter" | "pro" | "enterprise";
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_status?: "trialing" | "active" | "past_due" | "canceled" | "unpaid";
          trial_ends_at?: string | null;
          max_members?: number;
          max_integrations?: number;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          logo_url?: string | null;
          plan?: "free" | "starter" | "pro" | "enterprise";
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_status?: "trialing" | "active" | "past_due" | "canceled" | "unpaid";
          trial_ends_at?: string | null;
          max_members?: number;
          max_integrations?: number;
          settings?: Json;
        };
      };
      org_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: "owner" | "admin" | "manager" | "viewer";
          invited_at: string;
          accepted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role?: "owner" | "admin" | "manager" | "viewer";
          invited_at?: string;
          accepted_at?: string | null;
          created_at?: string;
        };
        Update: {
          role?: "owner" | "admin" | "manager" | "viewer";
          accepted_at?: string | null;
        };
      };
      plans: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price_monthly: number;
          price_yearly: number;
          stripe_price_monthly_id: string | null;
          stripe_price_yearly_id: string | null;
          max_members: number;
          max_integrations: number;
          features: Json;
          active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          description?: string | null;
          price_monthly?: number;
          price_yearly?: number;
          stripe_price_monthly_id?: string | null;
          stripe_price_yearly_id?: string | null;
          max_members?: number;
          max_integrations?: number;
          features?: Json;
          active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          price_monthly?: number;
          price_yearly?: number;
          stripe_price_monthly_id?: string | null;
          stripe_price_yearly_id?: string | null;
          max_members?: number;
          max_integrations?: number;
          features?: Json;
          active?: boolean;
          sort_order?: number;
        };
      };
      invoices: {
        Row: {
          id: string;
          organization_id: string;
          stripe_invoice_id: string | null;
          amount: number;
          currency: string;
          status: "draft" | "open" | "paid" | "void" | "uncollectible";
          invoice_url: string | null;
          period_start: string | null;
          period_end: string | null;
          paid_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          stripe_invoice_id?: string | null;
          amount: number;
          currency?: string;
          status?: "draft" | "open" | "paid" | "void" | "uncollectible";
          invoice_url?: string | null;
          period_start?: string | null;
          period_end?: string | null;
          paid_at?: string | null;
          created_at?: string;
        };
        Update: {
          stripe_invoice_id?: string | null;
          amount?: number;
          status?: "draft" | "open" | "paid" | "void" | "uncollectible";
          invoice_url?: string | null;
          paid_at?: string | null;
        };
      };
      profiles: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          avatar_url: string | null;
          role: "owner" | "admin" | "manager" | "viewer";
          organization_id: string | null;
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
          role?: "owner" | "admin" | "manager" | "viewer";
          organization_id?: string | null;
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
          role?: "owner" | "admin" | "manager" | "viewer";
          organization_id?: string | null;
          active?: boolean;
          updated_at?: string;
        };
      };
      squads: {
        Row: {
          id: string;
          name: string;
          organization_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          organization_id: string;
          created_at?: string;
        };
        Update: {
          name?: string;
          organization_id?: string;
        };
      };
      people: {
        Row: {
          id: string;
          name: string;
          avatar_url: string | null;
          role: "sdr" | "closer";
          squad_id: string | null;
          organization_id: string;
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
          organization_id: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          avatar_url?: string | null;
          role?: "sdr" | "closer";
          squad_id?: string | null;
          organization_id?: string;
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
          organization_id: string;
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
          organization_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          type?: "crm" | "ads";
          status?: "connected" | "syncing" | "error" | "disconnected";
          last_sync?: string | null;
          config?: Json;
          organization_id?: string;
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
          organization_id: string;
        };
        Insert: {
          id?: string;
          step_key: string;
          step_label: string;
          crm_field?: string | null;
          crm_value?: string | null;
          sort_order?: number;
          organization_id: string;
        };
        Update: {
          step_key?: string;
          step_label?: string;
          crm_field?: string | null;
          crm_value?: string | null;
          sort_order?: number;
          organization_id?: string;
        };
      };
      tags: {
        Row: {
          id: string;
          original: string;
          alias: string;
          organization_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          original: string;
          alias: string;
          organization_id: string;
          created_at?: string;
        };
        Update: {
          original?: string;
          alias?: string;
          organization_id?: string;
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
          organization_id: string;
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
          organization_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          person_id?: string | null;
          type?: "revenue" | "booked" | "leads" | "received" | "won";
          target?: number;
          period_start?: string;
          period_end?: string;
          organization_id?: string;
        };
      };
      setup_checklist: {
        Row: {
          id: string;
          key: string;
          label: string;
          completed: boolean;
          route: string;
          organization_id: string;
        };
        Insert: {
          id?: string;
          key: string;
          label: string;
          completed?: boolean;
          route: string;
          organization_id: string;
        };
        Update: {
          label?: string;
          completed?: boolean;
          route?: string;
          organization_id?: string;
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
          organization_id: string;
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
          organization_id: string;
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
          organization_id?: string;
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
          organization_id: string;
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
          organization_id: string;
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
          organization_id?: string;
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
          organization_id: string;
          synced_at: string;
          created_at: string;
          level: "campaign" | "ad_set" | "ad" | null;
          parent_external_id: string | null;
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
          organization_id: string;
          synced_at?: string;
          created_at?: string;
          level?: "campaign" | "ad_set" | "ad" | null;
          parent_external_id?: string | null;
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
          organization_id?: string;
          synced_at?: string;
          level?: "campaign" | "ad_set" | "ad" | null;
          parent_external_id?: string | null;
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
          organization_id: string;
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
          organization_id: string;
          created_at?: string;
        };
        Update: {
          person_id?: string | null;
          evidence_id?: string | null;
          call_type?: "r1" | "r2" | "follow_up" | null;
          answered?: boolean;
          duration_seconds?: number;
          called_at?: string;
          organization_id?: string;
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
          organization_id: string;
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
          organization_id: string;
          created_at?: string;
        };
        Update: {
          type?: "warning" | "critical" | "info";
          message?: string;
          link?: string | null;
          dismissible?: boolean;
          dismissed_by?: string[];
          expires_at?: string | null;
          organization_id?: string;
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
          organization_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          entity_type?: string | null;
          entity_id?: string | null;
          details?: Json | null;
          organization_id: string;
          created_at?: string;
        };
        Update: {
          action?: string;
          entity_type?: string | null;
          entity_id?: string | null;
          details?: Json | null;
          organization_id?: string;
        };
      };
    };
    Views: {
      v_funnel_summary: {
        Row: {
          organization_id: string;
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
          organization_id: string;
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
          organization_id: string;
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
          organization_id: string;
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
          organization_id: string;
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
          organization_id: string;
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
