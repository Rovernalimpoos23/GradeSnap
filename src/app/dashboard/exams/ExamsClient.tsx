'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Search, FileText, Eye, Scan, BarChart2 } from 'lucide-react'

type Exam = {
  id: string
  title: string
  subject: string
  grade_level: string
  quarter: string
  num_items: number
  created_at: string
}

export default function ExamsClient({ exams }: { exams: Exam[] }) {
  const [query, setQuery] = useState('')

  const filtered = exams.filter(
    e =>
      e.title.toLowerCase().includes(query.toLowerCase()) ||
      e.subject.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <>
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          placeholder="Search exams by title or subject..."
        />
      </div>

      {filtered.length === 0 ? (
        exams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-600 mb-1">No exams yet</p>
            <p className="text-xs text-slate-400 mb-5">
              Create your first exam to get started
            </p>
            <Link
              href="/dashboard/exams/new"
              className="bg-sky-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-sky-600 transition-colors"
            >
              + Create your first exam
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-600 mb-1">No results found</p>
            <p className="text-xs text-slate-400">Try a different search term</p>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(exam => (
            <div
              key={exam.id}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow duration-200"
            >
              <div className="mb-3">
                <h3 className="text-base font-semibold text-slate-900 truncate">{exam.title}</h3>
                <p className="text-sm text-slate-500 mt-0.5">{exam.subject}</p>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-600">
                  {exam.grade_level}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                  {exam.quarter}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                  {exam.num_items} items
                </span>
              </div>

              <p className="text-xs text-slate-400 mb-4">
                Created{' '}
                {new Date(exam.created_at).toLocaleDateString('en-PH', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>

              <div className="flex gap-2">
                <Link
                  href={`/dashboard/exams/${exam.id}/sheet`}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs px-2 py-2 rounded-xl border border-slate-200 transition-colors duration-150"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Sheet
                </Link>
                <Link
                  href={`/dashboard/scan?exam=${exam.id}`}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs px-2 py-2 rounded-xl border border-slate-200 transition-colors duration-150"
                >
                  <Scan className="w-3.5 h-3.5" />
                  Scan
                </Link>
                <Link
                  href={`/dashboard/results/${exam.id}`}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs px-2 py-2 rounded-xl border border-slate-200 transition-colors duration-150"
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  Results
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
