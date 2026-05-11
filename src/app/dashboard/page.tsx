import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import { Plus, Scan, FileText } from 'lucide-react'
import type { Database } from '@/lib/supabase'

function getGreeting(): string {
  const phHour = (new Date().getUTCHours() + 8) % 24
  if (phHour < 12) return 'Good morning'
  if (phHour < 18) return 'Good afternoon'
  return 'Good evening'
}

function getTodayPH(): string {
  return new Date().toLocaleDateString('en-PH', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Manila',
  })
}

export default async function DashboardPage() {
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

  const [teacherResult, examsResult, scansResult, gradedResult, flaggedResult] =
    await Promise.all([
      supabase
        .from('teachers')
        .select('name, school_name')
        .eq('id', user.id)
        .single(),
      supabase
        .from('exams')
        .select('id, title, subject, grade_level, quarter, num_items', {
          count: 'exact',
        })
        .eq('teacher_id', user.id)
        .limit(5),
      supabase
        .from('scan_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('teacher_id', user.id),
      supabase
        .from('grading_results')
        .select('id', { count: 'exact', head: true })
        .eq('teacher_id', user.id),
      supabase
        .from('grading_results')
        .select('id', { count: 'exact', head: true })
        .eq('teacher_id', user.id)
        .eq('flagged', true),
    ])

  const teacher = teacherResult.data
  const recentExams = examsResult.data ?? []
  const totalExams = examsResult.count ?? 0
  const totalScans = scansResult.count ?? 0
  const totalGraded = gradedResult.count ?? 0
  const totalFlagged = flaggedResult.count ?? 0

  const greeting = getGreeting()
  const today = getTodayPH()

  return (
    <>
      {/* Greeting header */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
          {greeting}
        </p>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {teacher?.name ?? 'Teacher'} 👋
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {today}
          {teacher?.school_name ? ` · ${teacher.school_name}` : ''}
        </p>
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/exams/new"
          className="bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors duration-150 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Exam
        </Link>
        <Link
          href="/dashboard/scan"
          className="bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm px-4 py-2.5 rounded-xl border border-slate-200 transition-colors duration-150 flex items-center gap-2"
        >
          <Scan className="w-4 h-4" />
          Scan Sheets
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
            Total Exams
          </p>
          <p className="text-3xl font-bold text-slate-900 tabular-nums">{totalExams}</p>
          <p className="text-xs text-slate-500 mt-1">created</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
            Total Scans
          </p>
          <p className="text-3xl font-bold text-slate-900 tabular-nums">{totalScans}</p>
          <p className="text-xs text-slate-500 mt-1">uploaded</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
            Graded
          </p>
          <p className="text-3xl font-bold text-slate-900 tabular-nums">{totalGraded}</p>
          <p className="text-xs text-slate-500 mt-1">sheets processed</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
            Flagged
          </p>
          <p
            className={`text-3xl font-bold tabular-nums ${
              totalFlagged > 0 ? 'text-red-500' : 'text-slate-900'
            }`}
          >
            {totalFlagged}
          </p>
          <p className="text-xs text-slate-500 mt-1">need review</p>
        </div>
      </div>

      {/* Recent exams */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-semibold text-slate-900">Recent Exams</h2>
          {totalExams > 0 && (
            <Link
              href="/dashboard/exams"
              className="text-xs font-semibold text-sky-500 hover:underline"
            >
              View all →
            </Link>
          )}
        </div>

        {recentExams.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <FileText className="w-7 h-7 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-600 mb-1">No exams yet</p>
            <p className="text-xs text-slate-400 mb-4">
              Create your first exam to get started
            </p>
            <Link
              href="/dashboard/exams/new"
              className="bg-sky-500 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-sky-600 transition-colors"
            >
              + New Exam
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-5 py-3">
                    Exam
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-5 py-3">
                    Subject
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-5 py-3">
                    Grade
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-5 py-3">
                    Items
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-5 py-3">
                    Quarter
                  </th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentExams.map(exam => (
                  <tr key={exam.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-medium text-slate-900">
                      {exam.title}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">
                      {exam.subject}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">
                      {exam.grade_level}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-600 tabular-nums">
                      {exam.num_items}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">
                      {exam.quarter}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/dashboard/exams/${exam.id}`}
                        className="text-xs font-semibold text-sky-500 hover:underline"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
