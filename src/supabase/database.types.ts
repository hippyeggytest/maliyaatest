export type Json =
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
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
          is_admin: boolean
          school_id: number | null
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
          updated_at?: string
          is_admin?: boolean
          school_id?: number | null
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          updated_at?: string
          is_admin?: boolean
          school_id?: number | null
        }
      }
      subscriptions: {
        Row: {
          id: number
          school_id: number
          plan: string
          status: 'active' | 'inactive' | 'cancelled'
          start_date: string
          end_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          school_id: number
          plan: string
          status?: 'active' | 'inactive' | 'cancelled'
          start_date: string
          end_date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          school_id?: number
          plan?: string
          status?: 'active' | 'inactive' | 'cancelled'
          start_date?: string
          end_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      fees: {
        Row: {
          id: number
          school_id: number
          name: string
          amount: number
          description: string | null
          created_at: string
        }
        Insert: {
          id?: number
          school_id: number
          name: string
          amount: number
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          school_id?: number
          name?: string
          amount?: number
          description?: string | null
          created_at?: string
        }
      }
      students: {
        Row: {
          id: number
          school_id: number
          name: string
          grade: string | null
          parent_name: string | null
          contact_number: string | null
          created_at: string
        }
        Insert: {
          id?: number
          school_id: number
          name: string
          grade?: string | null
          parent_name?: string | null
          contact_number?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          school_id?: number
          name?: string
          grade?: string | null
          parent_name?: string | null
          contact_number?: string | null
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: number
          school_id: number
          student_id: number
          fee_id: number
          amount: number
          payment_date: string
          payment_method: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: number
          school_id: number
          student_id: number
          fee_id: number
          amount: number
          payment_date?: string
          payment_method?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: number
          school_id?: number
          student_id?: number
          fee_id?: number
          amount?: number
          payment_date?: string
          payment_method?: string | null
          status?: string
          created_at?: string
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
 