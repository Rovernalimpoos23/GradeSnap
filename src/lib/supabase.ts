import { createBrowserClient } from '@supabase/auth-helpers-nextjs'

export type Database = {
  public: {
    Tables: {
      teachers: {
        Row: {
          id: string
          email: string
          name: string
          school_name: string | null
          school_address: string | null
          school_logo_url: string | null
          plan: 'free' | 'pro'
        }
        Insert: {
          id: string
          email: string
          name: string
          school_name?: string | null
          school_address?: string | null
          school_logo_url?: string | null
          plan?: 'free' | 'pro'
        }
        Update: {
          id?: string
          email?: string
          name?: string
          school_name?: string | null
          school_address?: string | null
          school_logo_url?: string | null
          plan?: 'free' | 'pro'
        }
        Relationships: []
      }
      exams: {
        Row: {
          id: string
          teacher_id: string
          title: string
          subject: string
          grade_level: string
          quarter: string
          school_year: string
          num_items: number
          num_choices: number
          theme_color: string | null
          has_essay: boolean
          essay_question: string | null
          essay_lines: number | null
        }
        Insert: {
          id?: string
          teacher_id: string
          title: string
          subject: string
          grade_level: string
          quarter: string
          school_year: string
          num_items: number
          num_choices: number
          theme_color?: string | null
          has_essay?: boolean
          essay_question?: string | null
          essay_lines?: number | null
        }
        Update: {
          id?: string
          teacher_id?: string
          title?: string
          subject?: string
          grade_level?: string
          quarter?: string
          school_year?: string
          num_items?: number
          num_choices?: number
          theme_color?: string | null
          has_essay?: boolean
          essay_question?: string | null
          essay_lines?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'exams_teacher_id_fkey'
            columns: ['teacher_id']
            isOneToOne: false
            referencedRelation: 'teachers'
            referencedColumns: ['id']
          }
        ]
      }
      scan_submissions: {
        Row: {
          id: string
          exam_id: string
          teacher_id: string
          image_url: string
          status: string
        }
        Insert: {
          id?: string
          exam_id: string
          teacher_id: string
          image_url: string
          status?: string
        }
        Update: {
          id?: string
          exam_id?: string
          teacher_id?: string
          image_url?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: 'scan_submissions_exam_id_fkey'
            columns: ['exam_id']
            isOneToOne: false
            referencedRelation: 'exams'
            referencedColumns: ['id']
          }
        ]
      }
      grading_results: {
        Row: {
          id: string
          scan_id: string
          exam_id: string
          teacher_id: string
          student_name: string
          student_lrn: string | null
          raw_answers: string
          score: number
          total_items: number
          percentage: number
          flagged: boolean
        }
        Insert: {
          id?: string
          scan_id: string
          exam_id: string
          teacher_id: string
          student_name: string
          student_lrn?: string | null
          raw_answers: string
          score: number
          total_items: number
          percentage: number
          flagged?: boolean
        }
        Update: {
          id?: string
          scan_id?: string
          exam_id?: string
          teacher_id?: string
          student_name?: string
          student_lrn?: string | null
          raw_answers?: string
          score?: number
          total_items?: number
          percentage?: number
          flagged?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'grading_results_exam_id_fkey'
            columns: ['exam_id']
            isOneToOne: false
            referencedRelation: 'exams'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function createClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}
