'use client'

import React, { useState, useRef } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  Printer,
  Download,
  ZoomIn,
  ZoomOut,
  School,
  Upload,
  Save,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import type { SheetPDFProps } from './SheetPDF'

const ALL_CHOICES = ['A', 'B', 'C', 'D', 'E']

const PRESET_COLORS = [
  '#3b4dff',
  '#e63946',
  '#2ec4b6',
  '#e76f51',
  '#2d6a4f',
  '#7209b7',
  '#e63700',
  '#1d3557',
]

const GRID_COLS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  7: 'grid-cols-7',
  8: 'grid-cols-8',
  9: 'grid-cols-9',
  10: 'grid-cols-10',
}

type Props = {
  exam: SheetPDFProps['exam']
  teacher: SheetPDFProps['teacher']
  answerKeys: SheetPDFProps['answerKeys']
  qrDataUrl: string
}

export default function SheetClient({ exam, teacher, answerKeys, qrDataUrl }: Props) {
  // School branding
  const [schoolName, setSchoolName] = useState(teacher.school_name ?? '')
  const [schoolAddress, setSchoolAddress] = useState(teacher.school_address ?? '')
  const [logoUrl, setLogoUrl] = useState(teacher.school_logo_url ?? '')

  // Sheet style
  const [themeColor, setThemeColor] = useState(exam.theme_color ?? '#3b4dff')
  const [layout, setLayout] = useState<'portrait' | 'landscape'>('portrait')
  const validChoices = [3, 4, 5].includes(exam.num_choices) ? (exam.num_choices as 3 | 4 | 5) : 4
  const [numChoices, setNumChoices] = useState<3 | 4 | 5>(validChoices)

  // Content toggles
  const [showInstructions, setShowInstructions] = useState(true)
  const [showRegMarks, setShowRegMarks] = useState(true)
  const [showLabels, setShowLabels] = useState(true)
  const [showSample, setShowSample] = useState(true)

  // Footer
  const [footerMotto, setFooterMotto] = useState('')
  const [footerContact, setFooterContact] = useState('')
  const [showPowered, setShowPowered] = useState(true)

  // UI state
  const [zoom, setZoom] = useState(100)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  async function handleLogoUpload(file: File) {
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${exam.teacher_id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(path, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('logos').getPublicUrl(path)
      setLogoUrl(data.publicUrl)
    } catch (err) {
      console.error('Logo upload failed:', err)
    } finally {
      setUploading(false)
    }
  }

  async function handleSaveProfile() {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('teachers')
        .update({
          school_name: schoolName || null,
          school_address: schoolAddress || null,
          school_logo_url: logoUrl || null,
        })
        .eq('id', exam.teacher_id)
      if (error) throw error
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2500)
    } catch (err) {
      console.error('Save profile failed:', err)
    } finally {
      setSaving(false)
    }
  }

  async function handleDownload() {
    setDownloading(true)
    try {
      const [{ pdf }, { default: SheetPDF }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./SheetPDF'),
      ])
      const currentTeacher = {
        name: teacher.name,
        school_name: schoolName || null,
        school_address: schoolAddress || null,
        school_logo_url: logoUrl || null,
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const element = React.createElement(SheetPDF as any, {
        exam,
        teacher: currentTeacher,
        answerKeys,
        qrDataUrl,
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blob = await pdf(element as any).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${exam.title.replace(/[^a-z0-9]/gi, '-')}-sheet.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('PDF generation failed:', err)
    } finally {
      setDownloading(false)
    }
  }

  const choices = ALL_CHOICES.slice(0, numChoices)

  const sheetProps: SheetPaperProps = {
    exam,
    schoolName,
    schoolAddress,
    logoUrl,
    choices,
    themeColor,
    layout,
    showInstructions,
    showRegMarks,
    showLabels,
    showSample,
    footerMotto,
    footerContact,
    showPowered,
    qrDataUrl,
    teacherName: teacher.name,
  }

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          .no-print { display: none !important; }
          body { background: white !important; }
          #sheet-paper {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            border-radius: 0 !important;
            width: 100% !important;
            transform: none !important;
          }
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      `}</style>

      {/* Two-column builder layout — cancels parent p-6 */}
      <div className="no-print flex -m-6 h-screen overflow-hidden">
        {/* ── Left: Customization Panel ─────────────────────── */}
        <aside className="w-80 bg-white border-r border-slate-200 flex flex-col flex-shrink-0 overflow-hidden">
          {/* Panel header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3 flex-shrink-0">
            <Link
              href="/dashboard/exams"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 leading-tight truncate">{exam.title}</p>
              <p className="text-xs text-slate-400">{exam.subject} · {exam.grade_level}</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* 1. School Branding */}
            <section className="px-5 py-5 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
                School Branding
              </p>

              {/* Logo upload */}
              <div className="mb-4">
                <p className="text-xs font-medium text-slate-500 mb-2">School Logo</p>
                <div
                  role="button"
                  tabIndex={0}
                  className="relative h-20 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center cursor-pointer hover:border-sky-400 hover:bg-sky-50 transition-colors overflow-hidden"
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault()
                    const file = e.dataTransfer.files[0]
                    if (file) handleLogoUpload(file)
                  }}
                >
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl} alt="School logo" className="h-full w-full object-contain p-2" />
                  ) : uploading ? (
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs text-slate-400">Uploading…</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5">
                      <Upload className="w-5 h-5 text-slate-300" />
                      <span className="text-xs text-slate-400">Click or drop logo</span>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) handleLogoUpload(file)
                  }}
                />
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">School Name</label>
                  <input
                    value={schoolName}
                    onChange={e => setSchoolName(e.target.value)}
                    placeholder="e.g. Rizal National High School"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Address</label>
                  <input
                    value={schoolAddress}
                    onChange={e => setSchoolAddress(e.target.value)}
                    placeholder="City, Province"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="mt-3 w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Saving…' : saveSuccess ? '✓ Saved!' : 'Save Profile'}
              </button>
            </section>

            {/* 2. Sheet Style */}
            <section className="px-5 py-5 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
                Sheet Style
              </p>

              {/* Theme color */}
              <div className="mb-4">
                <label className="text-xs font-medium text-slate-500 mb-2 block">Theme Color</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setThemeColor(color)}
                      className={`w-7 h-7 rounded-full flex-shrink-0 transition-transform ${
                        themeColor === color
                          ? 'ring-2 ring-offset-2 ring-slate-700 scale-110'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={themeColor}
                    onChange={e => setThemeColor(e.target.value)}
                    className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5 flex-shrink-0"
                  />
                  <input
                    value={themeColor}
                    onChange={e => setThemeColor(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              {/* Layout */}
              <div className="mb-4">
                <label className="text-xs font-medium text-slate-500 mb-2 block">Layout</label>
                <div className="flex gap-1.5">
                  {(['portrait', 'landscape'] as const).map(l => (
                    <button
                      key={l}
                      onClick={() => setLayout(l)}
                      className={`flex-1 py-1.5 rounded-full text-xs font-semibold transition-colors capitalize ${
                        layout === l
                          ? 'bg-sky-500 text-white'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Choices override */}
              <div>
                <label className="text-xs font-medium text-slate-500 mb-2 block">Choices</label>
                <div className="flex gap-1.5">
                  {([3, 4, 5] as const).map(n => (
                    <button
                      key={n}
                      onClick={() => setNumChoices(n)}
                      className={`flex-1 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                        numChoices === n
                          ? 'bg-sky-500 text-white'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {n === 3 ? 'A–C' : n === 4 ? 'A–D' : 'A–E'}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* 3. Content Toggles */}
            <section className="px-5 py-5 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
                Sheet Content
              </p>
              <div className="space-y-3.5">
                {(
                  [
                    { label: 'Instructions box', value: showInstructions, set: setShowInstructions },
                    { label: 'Registration marks', value: showRegMarks, set: setShowRegMarks },
                    { label: 'Bubble labels (A B C…)', value: showLabels, set: setShowLabels },
                    { label: 'Sample filled bubble', value: showSample, set: setShowSample },
                  ] as const
                ).map(({ label, value, set }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">{label}</span>
                    <button
                      onClick={() => (set as (v: boolean) => void)(!value)}
                      className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${
                        value ? 'bg-sky-500' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                          value ? 'translate-x-4' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* 4. Footer */}
            <section className="px-5 py-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
                Footer
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Motto</label>
                  <input
                    value={footerMotto}
                    onChange={e => setFooterMotto(e.target.value)}
                    placeholder="e.g. Excellence in Education"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">
                    Contact / Website
                  </label>
                  <input
                    value={footerContact}
                    onChange={e => setFooterContact(e.target.value)}
                    placeholder="e.g. school@email.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">Powered by GradeSnap</span>
                  <button
                    onClick={() => setShowPowered(p => !p)}
                    className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${
                      showPowered ? 'bg-sky-500' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        showPowered ? 'translate-x-4' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </section>
          </div>
        </aside>

        {/* ── Right: Live Preview ────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setZoom(z => Math.max(50, z - 10))}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold text-slate-600 w-10 text-center tabular-nums">
                {zoom}%
              </span>
              <button
                onClick={() => setZoom(z => Math.min(150, z + 10))}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm px-4 py-2 rounded-xl border border-slate-200 transition-colors flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white font-semibold text-sm px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {downloading ? 'Generating…' : 'Download PDF'}
              </button>
            </div>
          </div>

          {/* Preview scroll area */}
          <div className="flex-1 overflow-auto bg-slate-100 p-8">
            <div
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top center',
                // Reserve space for the scaled sheet so scroll works correctly
                marginBottom: `${(zoom / 100 - 1) * (layout === 'landscape' ? 794 : 1123)}px`,
              }}
            >
              <SheetPaper {...sheetProps} />
            </div>
          </div>
        </div>
      </div>

      {/* Print-only version (hidden in screen, shown when printing) */}
      <div className="hidden print:block">
        <SheetPaper {...sheetProps} />
      </div>

      {/* Save toast */}
      {saveSuccess && (
        <div className="fixed bottom-4 right-4 bg-slate-900 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 z-50 no-print">
          <span className="text-emerald-400">✓</span> Profile saved successfully
        </div>
      )}
    </>
  )
}

// ─── Sheet Paper (shared by preview and print) ──────────────────────────────

type SheetPaperProps = {
  exam: SheetPDFProps['exam']
  schoolName: string
  schoolAddress: string
  logoUrl: string
  choices: string[]
  themeColor: string
  layout: 'portrait' | 'landscape'
  showInstructions: boolean
  showRegMarks: boolean
  showLabels: boolean
  showSample: boolean
  footerMotto: string
  footerContact: string
  showPowered: boolean
  qrDataUrl: string
  teacherName: string
}

function SheetPaper({
  exam,
  schoolName,
  schoolAddress,
  logoUrl,
  choices,
  themeColor,
  layout,
  showInstructions,
  showRegMarks,
  showLabels,
  showSample,
  footerMotto,
  footerContact,
  showPowered,
  qrDataUrl,
  teacherName,
}: SheetPaperProps) {
  const isPortrait = layout === 'portrait'
  const paperWidth = isPortrait ? 794 : 1123
  const paperHeight = isPortrait ? 1123 : 794

  const numColumns = Math.ceil(exam.num_items / 10)
  const columns: number[][] = Array.from({ length: numColumns }, (_, col) => {
    const start = col * 10 + 1
    const end = Math.min(start + 9, exam.num_items)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  })

  const gridClass = GRID_COLS[numColumns] ?? 'grid-cols-5'

  return (
    <div
      id="sheet-paper"
      className="bg-white shadow-xl border border-slate-200 rounded-2xl overflow-hidden relative"
      style={{ width: paperWidth, minHeight: paperHeight, fontFamily: 'Arial, sans-serif' }}
    >
      {/* Registration marks */}
      {showRegMarks && (
        <>
          <div className="absolute top-3 left-3 w-3.5 h-3.5 bg-black rounded-sm" />
          <div className="absolute top-3 right-3 w-3.5 h-3.5 bg-black rounded-sm" />
          <div className="absolute bottom-3 left-3 w-3.5 h-3.5 bg-black rounded-sm" />
          <div className="absolute bottom-3 right-3 w-3.5 h-3.5 bg-black rounded-sm" />
        </>
      )}

      <div className="p-9 pb-14">
        {/* Header: school info left, exam info right */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-2 flex-1">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt="School logo"
                className="w-14 h-14 object-contain flex-shrink-0"
              />
            ) : (
              <div className="w-14 h-14 flex items-center justify-center flex-shrink-0 border border-gray-200 rounded bg-gray-50">
                <School className="w-8 h-8 text-gray-300" />
              </div>
            )}
            <div>
              <p className="font-bold text-sm text-black leading-tight">
                {schoolName || 'School Name'}
              </p>
              {schoolAddress && (
                <p className="text-xs text-gray-500 mt-0.5">{schoolAddress}</p>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0 max-w-xs">
            <p className="font-bold text-sm uppercase tracking-wide text-black leading-tight">
              {exam.title}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {exam.subject} · {exam.grade_level} · {exam.quarter} · {exam.school_year}
            </p>
          </div>
        </div>

        {/* Accent bar */}
        <div className="h-1.5 rounded-full mb-3" style={{ backgroundColor: themeColor }} />

        {/* Info fields: Name, LRN, Section, Date */}
        <div className="flex gap-3 mb-3">
          {[
            { label: 'Student Name', cls: 'flex-1' },
            { label: 'LRN', cls: 'w-32' },
            { label: 'Section', cls: 'flex-1' },
            { label: 'Date', cls: 'w-24' },
          ].map(({ label, cls }) => (
            <div key={label} className={cls}>
              <span
                className="block text-xs font-bold uppercase tracking-wide mb-1"
                style={{ color: themeColor }}
              >
                {label}
              </span>
              <div className="border-b border-gray-400 h-5" />
            </div>
          ))}
        </div>

        {/* QR + Instructions row */}
        <div className="flex gap-3 mb-4 items-start">
          {qrDataUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrDataUrl}
              alt="QR code"
              className="flex-shrink-0"
              style={{ width: 52, height: 52 }}
            />
          )}
          {showInstructions && (
            <div className="flex-1 bg-amber-50 border border-amber-200 rounded px-3 py-2">
              <p className="text-xs text-gray-700 leading-relaxed">
                <span className="font-bold">INSTRUCTIONS: </span>
                Use a black ballpen or pencil. Shade the bubble completely corresponding to the
                letter of your answer. Erasures are NOT allowed. Do not make any stray marks.
              </p>
            </div>
          )}
        </div>

        {/* Bubble Grid */}
        <p className="text-xs font-bold uppercase tracking-wide text-black mb-2">
          Multiple Choice
        </p>

        <div className={`grid ${gridClass} gap-x-4 mb-4`}>
          {columns.map((colItems, colIdx) => (
            <div key={colIdx}>
              {/* Sample row — first column only */}
              {showSample && colIdx === 0 && (
                <div className="flex items-center gap-0.5 py-0.5 mb-1 opacity-60">
                  <span className="text-[10px] text-gray-400 w-4 text-right mr-1 flex-shrink-0 italic">
                    ex
                  </span>
                  {choices.map((c, i) => (
                    <div
                      key={c}
                      className={`w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center flex-shrink-0 ${
                        i === 0
                          ? 'bg-gray-900 border-gray-900'
                          : 'border-gray-400'
                      }`}
                    >
                      {showLabels && (
                        <span
                          className={`font-bold text-[9px] leading-none ${
                            i === 0 ? 'text-white' : 'text-gray-500'
                          }`}
                        >
                          {c}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Bubble rows */}
              {colItems.map(n => (
                <div key={n} className="flex items-center gap-0.5 py-0.5">
                  <span className="text-xs text-gray-400 w-4 text-right mr-1 flex-shrink-0">
                    {n}
                  </span>
                  {choices.map(c => (
                    <div
                      key={c}
                      className="w-5 h-5 rounded-full border-[1.5px] border-gray-400 flex items-center justify-center flex-shrink-0"
                    >
                      {showLabels && (
                        <span className="text-gray-500 font-bold text-[9px] leading-none">
                          {c}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Essay section */}
        {exam.has_essay && (
          <div className="border-l-4 pl-3 mb-4" style={{ borderColor: '#7c3aed' }}>
            <p className="text-xs font-bold uppercase tracking-wide text-black mb-2">Essay</p>
            {exam.essay_question && (
              <p className="text-xs text-black mb-3 leading-relaxed">{exam.essay_question}</p>
            )}
            {Array.from({ length: exam.essay_lines ?? 8 }).map((_, i) => (
              <div key={i} className="border-b border-gray-300 h-7" />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="absolute bottom-5 left-9 right-9 border-t border-gray-200 pt-3 flex justify-between items-center">
          <span className="text-xs italic text-gray-500">{footerMotto || teacherName}</span>
          <div className="flex flex-col items-end gap-0.5">
            {footerContact && (
              <span className="text-xs text-gray-400">{footerContact}</span>
            )}
            {showPowered && (
              <span className="text-xs text-gray-400">Powered by GradeSnap</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
