'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Save, Plus, Minus } from 'lucide-react'
import { createClient } from '@/lib/supabase'

const GRADE_LEVELS = [
  'Grade 7',
  'Grade 8',
  'Grade 9',
  'Grade 10',
  'Grade 11',
  'Grade 12',
]
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4']
const SCHOOL_YEARS = ['S.Y. 2024-2025', 'S.Y. 2025-2026']
const QUICK_ITEMS = [15, 20, 25, 30, 40, 50]
const CHOICE_OPTIONS = [3, 4, 5]

function getChoiceLabels(numChoices: number): string[] {
  return ['A', 'B', 'C', 'D', 'E'].slice(0, numChoices)
}

export default function NewExamPage() {
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [gradeLevel, setGradeLevel] = useState('Grade 7')
  const [quarter, setQuarter] = useState('Q1')
  const [schoolYear, setSchoolYear] = useState('S.Y. 2025-2026')
  const [numItems, setNumItems] = useState(30)
  const [numChoices, setNumChoices] = useState(4)
  const [hasEssay, setHasEssay] = useState(false)
  const [essayQuestion, setEssayQuestion] = useState('')
  const [essayLines, setEssayLines] = useState(8)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const choices = getChoiceLabels(numChoices)

  function setAnswer(qNum: number, choice: string) {
    setAnswers(prev => ({ ...prev, [qNum]: choice }))
  }

  function adjustItems(delta: number) {
    setNumItems(n => Math.min(100, Math.max(5, n + delta)))
  }

  async function handleSave() {
    if (!title.trim()) {
      setError('Exam title is required.')
      return
    }
    if (!subject.trim()) {
      setError('Subject is required.')
      return
    }

    setSaving(true)
    setError('')

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: exam, error: examError } = await supabase
        .from('exams')
        .insert({
          teacher_id: user.id,
          title: title.trim(),
          subject: subject.trim(),
          grade_level: gradeLevel,
          quarter,
          school_year: schoolYear,
          num_items: numItems,
          num_choices: numChoices,
          has_essay: hasEssay,
          essay_question: hasEssay ? essayQuestion.trim() || null : null,
          essay_lines: hasEssay ? essayLines : null,
        })
        .select('id')
        .single()

      if (examError || !exam) {
        setError('Failed to save exam. Please try again.')
        setSaving(false)
        return
      }

      const answerKeys = Array.from({ length: numItems }, (_, i) => ({
        exam_id: exam.id,
        question_number: i + 1,
        correct_answer: answers[i + 1] ?? null,
        points: 1,
      }))

      const { error: keysError } = await supabase
        .from('answer_keys')
        .insert(answerKeys)

      if (keysError) {
        setError('Exam saved but answer keys failed. Please edit and retry.')
        setSaving(false)
        return
      }

      router.push(`/dashboard/exams/${exam.id}/sheet`)
    } catch {
      setError('An unexpected error occurred.')
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/exams"
          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-white border border-transparent hover:border-slate-200 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create New Exam</h1>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Exam details */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-4">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Exam Details</h2>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
              Exam Title
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition duration-150"
              placeholder="e.g. 3rd Quarter Examination"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
              Subject
            </label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition duration-150"
              placeholder="e.g. Mathematics"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
                Grade Level
              </label>
              <select
                value={gradeLevel}
                onChange={e => setGradeLevel(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition duration-150"
              >
                {GRADE_LEVELS.map(g => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
                Quarter
              </label>
              <select
                value={quarter}
                onChange={e => setQuarter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition duration-150"
              >
                {QUARTERS.map(q => (
                  <option key={q}>{q}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
                School Year
              </label>
              <select
                value={schoolYear}
                onChange={e => setSchoolYear(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition duration-150"
              >
                {SCHOOL_YEARS.map(sy => (
                  <option key={sy}>{sy}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Number of items */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-4">
        <h2 className="text-base font-semibold text-slate-900 mb-1">Number of Items</h2>
        <p className="text-xs text-slate-400 mb-4">Quick select or use +/− to set a custom number</p>

        <div className="flex flex-wrap gap-2 mb-4">
          {QUICK_ITEMS.map(n => (
            <button
              key={n}
              onClick={() => setNumItems(n)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                numItems === n
                  ? 'bg-sky-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => adjustItems(-1)}
            className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
          <input
            type="number"
            value={numItems}
            onChange={e =>
              setNumItems(Math.min(100, Math.max(5, Number(e.target.value) || 5)))
            }
            className="w-20 text-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          />
          <button
            onClick={() => adjustItems(1)}
            className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Number of choices */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-4">
        <h2 className="text-base font-semibold text-slate-900 mb-1">Number of Choices</h2>
        <p className="text-xs text-slate-400 mb-4">How many options per question?</p>

        <div className="flex gap-2">
          {CHOICE_OPTIONS.map(n => (
            <button
              key={n}
              onClick={() => setNumChoices(n)}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-colors ${
                numChoices === n
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-sky-300'
              }`}
            >
              {n} choices
            </button>
          ))}
        </div>
      </div>

      {/* Answer key */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-4">
        <h2 className="text-base font-semibold text-slate-900 mb-1">Answer Key</h2>
        <p className="text-xs text-slate-400 mb-4">
          Click a letter to set the correct answer for each item
        </p>

        <div className="grid grid-cols-2 gap-x-8 gap-y-1">
          {Array.from({ length: numItems }, (_, i) => {
            const qNum = i + 1
            const selected = answers[qNum]
            return (
              <div key={qNum} className="flex items-center gap-2 py-1">
                <span className="text-xs font-semibold text-slate-400 w-6 text-right flex-shrink-0">
                  {qNum}
                </span>
                <div className="flex gap-1">
                  {choices.map(choice => (
                    <button
                      key={choice}
                      onClick={() => setAnswer(qNum, choice)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                        selected === choice
                          ? 'bg-sky-500 text-white'
                          : 'bg-slate-100 text-slate-500 hover:bg-sky-100 hover:text-sky-600'
                      }`}
                    >
                      {choice}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Essay section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Essay Section</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Optional — add an essay question at the end of the sheet
            </p>
          </div>
          <button
            onClick={() => setHasEssay(v => !v)}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${
              hasEssay ? 'bg-sky-500' : 'bg-slate-200'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                hasEssay ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>

        {hasEssay && (
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
                Essay Prompt
              </label>
              <textarea
                value={essayQuestion}
                onChange={e => setEssayQuestion(e.target.value)}
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition duration-150 resize-none"
                placeholder="Enter the essay question or prompt..."
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
                Writing Lines: {essayLines}
              </label>
              <input
                type="range"
                min={4}
                max={20}
                value={essayLines}
                onChange={e => setEssayLines(Number(e.target.value))}
                className="w-full accent-sky-500"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>4 lines</span>
                <span>20 lines</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Save */}
      <div className="flex justify-end pb-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition-colors duration-150 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save & View Sheet'}
        </button>
      </div>
    </div>
  )
}
