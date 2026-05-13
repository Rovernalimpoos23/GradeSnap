import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import type { Database } from '@/lib/supabase'
import ExamsClient from './ExamsClient'

export default async function ExamsPage() {
  const cookieStore = await cookies()

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {},
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: exams } = await supabase
    .from('exams')
    .select('id, title, subject, grade_level, quarter, num_items, created_at')
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Exams</h1>
        <Link
          href="/dashboard/exams/new"
          className="bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors duration-150 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Exam
        </Link>
      </div>

      <ExamsClient exams={exams ?? []} />
    </>
  )
}
