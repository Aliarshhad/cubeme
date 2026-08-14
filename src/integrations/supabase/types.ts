export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string;
          created_at: string;
          description: string;
          id: string;
          meta: Json | null;
          user_id: string;
        };
        Insert: {
          action: string;
          created_at?: string;
          description: string;
          id?: string;
          meta?: Json | null;
          user_id: string;
        };
        Update: {
          action?: string;
          created_at?: string;
          description?: string;
          id?: string;
          meta?: Json | null;
          user_id?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          color: string;
          created_at: string;
          id: string;
          name: string;
          sort_order: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          color?: string;
          created_at?: string;
          id?: string;
          name: string;
          sort_order?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          color?: string;
          created_at?: string;
          id?: string;
          name?: string;
          sort_order?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      debts: {
        Row: {
          amount: number;
          created_at: string;
          currency: string | null;
          direction: string;
          expected_return_on: string | null;
          fx_rate: number;
          id: string;
          note: string | null;
          occurred_on: string;
          original_amount: number | null;
          person: string;
          purpose: string | null;
          returned_on: string | null;
          settled_at: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          currency?: string | null;
          direction: string;
          expected_return_on?: string | null;
          fx_rate?: number;
          id?: string;
          note?: string | null;
          occurred_on?: string;
          original_amount?: number | null;
          person: string;
          purpose?: string | null;
          returned_on?: string | null;
          settled_at?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          currency?: string | null;
          direction?: string;
          expected_return_on?: string | null;
          fx_rate?: number;
          id?: string;
          note?: string | null;
          occurred_on?: string;
          original_amount?: number | null;
          person?: string;
          purpose?: string | null;
          returned_on?: string | null;
          settled_at?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      expenses: {
        Row: {
          amount: number;
          category_id: string | null;
          created_at: string;
          currency: string | null;
          fx_rate: number;
          id: string;
          need_want: string | null;
          note: string | null;
          original_amount: number | null;
          receipt_id: string | null;
          spent_on: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          category_id?: string | null;
          created_at?: string;
          currency?: string | null;
          fx_rate?: number;
          id?: string;
          need_want?: string | null;
          note?: string | null;
          original_amount?: number | null;
          receipt_id?: string | null;
          spent_on?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          category_id?: string | null;
          created_at?: string;
          currency?: string | null;
          fx_rate?: number;
          id?: string;
          need_want?: string | null;
          note?: string | null;
          original_amount?: number | null;
          receipt_id?: string | null;
          spent_on?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expenses_receipt_id_fkey";
            columns: ["receipt_id"];
            isOneToOne: false;
            referencedRelation: "receipts";
            referencedColumns: ["id"];
          },
        ];
      };
      fx_rates: {
        Row: {
          base: string;
          code: string;
          created_at: string;
          fetched_at: string | null;
          id: string;
          manual: boolean;
          rate: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          base: string;
          code: string;
          created_at?: string;
          fetched_at?: string | null;
          id?: string;
          manual?: boolean;
          rate: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          base?: string;
          code?: string;
          created_at?: string;
          fetched_at?: string | null;
          id?: string;
          manual?: boolean;
          rate?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      monthly_budgets: {
        Row: {
          amount: number;
          created_at: string;
          id: string;
          month: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          amount?: number;
          created_at?: string;
          id?: string;
          month: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          id?: string;
          month?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          currency: string;
          display_name: string | null;
          id: string;
          reminder_enabled: boolean;
          reminder_time: string;
          theme: string;
          tour_completed_at: string | null;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          currency?: string;
          display_name?: string | null;
          id: string;
          reminder_enabled?: boolean;
          reminder_time?: string;
          theme?: string;
          tour_completed_at?: string | null;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          currency?: string;
          display_name?: string | null;
          id?: string;
          reminder_enabled?: boolean;
          reminder_time?: string;
          theme?: string;
          tour_completed_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          auth: string;
          created_at: string;
          enabled: boolean;
          endpoint: string;
          id: string;
          last_sent_on: string | null;
          p256dh: string;
          reminder_time: string;
          tz_offset_minutes: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          auth: string;
          created_at?: string;
          enabled?: boolean;
          endpoint: string;
          id?: string;
          last_sent_on?: string | null;
          p256dh: string;
          reminder_time?: string;
          tz_offset_minutes?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          auth?: string;
          created_at?: string;
          enabled?: boolean;
          endpoint?: string;
          id?: string;
          last_sent_on?: string | null;
          p256dh?: string;
          reminder_time?: string;
          tz_offset_minutes?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      receipt_items: {
        Row: {
          created_at: string;
          id: string;
          line_total: number | null;
          name: string;
          need_want: string | null;
          quantity: number;
          reason: string | null;
          receipt_id: string;
          sort_order: number;
          unit_price: number | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          line_total?: number | null;
          name: string;
          need_want?: string | null;
          quantity?: number;
          reason?: string | null;
          receipt_id: string;
          sort_order?: number;
          unit_price?: number | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          line_total?: number | null;
          name?: string;
          need_want?: string | null;
          quantity?: number;
          reason?: string | null;
          receipt_id?: string;
          sort_order?: number;
          unit_price?: number | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "receipt_items_receipt_id_fkey";
            columns: ["receipt_id"];
            isOneToOne: false;
            referencedRelation: "receipts";
            referencedColumns: ["id"];
          },
        ];
      };
      receipts: {
        Row: {
          category_id: string | null;
          created_at: string;
          currency: string | null;
          id: string;
          image_path: string | null;
          merchant: string | null;
          raw: Json | null;
          receipt_date: string | null;
          total: number | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          category_id?: string | null;
          created_at?: string;
          currency?: string | null;
          id?: string;
          image_path?: string | null;
          merchant?: string | null;
          raw?: Json | null;
          receipt_date?: string | null;
          total?: number | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          category_id?: string | null;
          created_at?: string;
          currency?: string | null;
          id?: string;
          image_path?: string | null;
          merchant?: string | null;
          raw?: Json | null;
          receipt_date?: string | null;
          total?: number | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "receipts_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      recurring_applied: {
        Row: {
          created_at: string;
          expense_id: string | null;
          id: string;
          month: string;
          recurring_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          expense_id?: string | null;
          id?: string;
          month: string;
          recurring_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          expense_id?: string | null;
          id?: string;
          month?: string;
          recurring_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "recurring_applied_expense_id_fkey";
            columns: ["expense_id"];
            isOneToOne: false;
            referencedRelation: "expenses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recurring_applied_recurring_id_fkey";
            columns: ["recurring_id"];
            isOneToOne: false;
            referencedRelation: "recurring_expenses";
            referencedColumns: ["id"];
          },
        ];
      };
      recurring_expenses: {
        Row: {
          active: boolean;
          amount: number;
          category_id: string | null;
          created_at: string;
          day_of_month: number;
          id: string;
          label: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          active?: boolean;
          amount: number;
          category_id?: string | null;
          created_at?: string;
          day_of_month?: number;
          id?: string;
          label: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          active?: boolean;
          amount?: number;
          category_id?: string | null;
          created_at?: string;
          day_of_month?: number;
          id?: string;
          label?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "recurring_expenses_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
