export  type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      schools: {
        Row: {
          id: number
          name: string
          logo: string | null
          address: string
          phone: string
          email: string
          status: string
          subscription_start: string
          subscription_end: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: number
          name: string
          logo?: string | null
          address: string
          phone: string
          email: string
          status?: string
          subscription_start: string
          subscription_end: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: number
          name?: string
          logo?: string | null
          address?: string
          phone?: string
          email?: string
          status?: string
          subscription_start?: string
          subscription_end?: string
          created_at?: string
          updated_at?: string | null
        }
      }
      users: {
        Row: {
          id: number
          username: string
          password: string
          name: string
          role: string
          email: string
          school_id: number | null
          grade: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: number
          username: string
          password: string
          name: string
          role: string
          email: string
          school_id?: number | null
          grade?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: number
          username?: string
          password?: string
          name?: string
          role?: string
          email?: string
          school_id?: number | null
          grade?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
      subscriptions: {
        Row: {
          id: number
          school_id: number
          amount: number
          payment_method: string
          start_date: string
          end_date: string
          notes: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: number
          school_id: number
          amount: number
          payment_method: string
          start_date: string
          end_date: string
          notes?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: number
          school_id?: number
          amount?: number
          payment_method?: string
          start_date?: string
          end_date?: string
          notes?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
 