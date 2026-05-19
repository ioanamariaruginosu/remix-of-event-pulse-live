export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      cards_exchanged: {
        Row: {
          at: string
          event_id: string | null
          from_user: string
          id: string
          reason: string | null
          to_user: string
        }
        Insert: {
          at?: string
          event_id?: string | null
          from_user: string
          id?: string
          reason?: string | null
          to_user: string
        }
        Update: {
          at?: string
          event_id?: string | null
          from_user?: string
          id?: string
          reason?: string | null
          to_user?: string
        }
        Relationships: [
          {
            foreignKeyName: "cards_exchanged_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_attendees: {
        Row: {
          created_at: string
          event_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          city: string | null
          cover_gradient: string | null
          created_at: string
          dates: string | null
          description: string | null
          id: string
          is_live: boolean
          name: string
          owner_id: string
        }
        Insert: {
          city?: string | null
          cover_gradient?: string | null
          created_at?: string
          dates?: string | null
          description?: string | null
          id?: string
          is_live?: boolean
          name: string
          owner_id: string
        }
        Update: {
          city?: string | null
          cover_gradient?: string | null
          created_at?: string
          dates?: string | null
          description?: string | null
          id?: string
          is_live?: boolean
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
      invitations: {
        Row: {
          created_at: string
          email: string
          event_id: string
          id: string
          status: string
          token: string
        }
        Insert: {
          created_at?: string
          email: string
          event_id: string
          id?: string
          status?: string
          token?: string
        }
        Update: {
          created_at?: string
          email?: string
          event_id?: string
          id?: string
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      match_results: {
        Row: {
          created_at: string
          event_id: string | null
          id: string
          match_user_id: string
          reasons: Json
          score: number
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          id?: string
          match_user_id: string
          reasons?: Json
          score: number
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string | null
          id?: string
          match_user_id?: string
          reasons?: Json
          score?: number
          user_id?: string
        }
        Relationships: []
      }
      presence: {
        Row: {
          event_id: string
          room_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          event_id: string
          room_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          event_id?: string
          room_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "presence_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presence_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar: Json | null
          color: string
          created_at: string
          embedding: string | null
          embedding_text: string | null
          gradient: Json | null
          id: string
          initials: string | null
          intent: string | null
          name: string | null
          one_liner: string | null
          socials: Json
          tags: string[]
          updated_at: string
        }
        Insert: {
          avatar?: Json | null
          color?: string
          created_at?: string
          embedding?: string | null
          embedding_text?: string | null
          gradient?: Json | null
          id: string
          initials?: string | null
          intent?: string | null
          name?: string | null
          one_liner?: string | null
          socials?: Json
          tags?: string[]
          updated_at?: string
        }
        Update: {
          avatar?: Json | null
          color?: string
          created_at?: string
          embedding?: string | null
          embedding_text?: string | null
          gradient?: Json | null
          id?: string
          initials?: string | null
          intent?: string | null
          name?: string | null
          one_liner?: string | null
          socials?: Json
          tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          capacity: number
          created_at: string
          event_id: string
          id: string
          kind: string
          name: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          event_id: string
          id?: string
          kind?: string
          name: string
        }
        Update: {
          capacity?: number
          created_at?: string
          event_id?: string
          id?: string
          kind?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          abstract: string | null
          created_at: string
          ends_at: string | null
          event_id: string
          id: string
          room_id: string | null
          speaker: string | null
          speaker_role: string | null
          starts_at: string | null
          time_label: string | null
          title: string
          topics: string[]
          transcript: Json | null
        }
        Insert: {
          abstract?: string | null
          created_at?: string
          ends_at?: string | null
          event_id: string
          id?: string
          room_id?: string | null
          speaker?: string | null
          speaker_role?: string | null
          starts_at?: string | null
          time_label?: string | null
          title: string
          topics?: string[]
          transcript?: Json | null
        }
        Update: {
          abstract?: string | null
          created_at?: string
          ends_at?: string | null
          event_id?: string
          id?: string
          room_id?: string | null
          speaker?: string | null
          speaker_role?: string | null
          starts_at?: string | null
          time_label?: string | null
          title?: string
          topics?: string[]
          transcript?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      taps: {
        Row: {
          at: string
          event_id: string
          id: string
          organizer_id: string
          person_id: string
          room_id: string
        }
        Insert: {
          at?: string
          event_id: string
          id?: string
          organizer_id: string
          person_id: string
          room_id: string
        }
        Update: {
          at?: string
          event_id?: string
          id?: string
          organizer_id?: string
          person_id?: string
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "taps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "taps_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "organizer" | "attendee"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["organizer", "attendee"],
    },
  },
} as const
