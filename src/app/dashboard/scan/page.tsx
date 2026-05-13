'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Camera,
  Upload,
  X,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Clock,
  FileImage,
  Play,
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

type QueueStatus = 'waiting' | 'processing' | 'done' | 'review'

type WorkerAnswer = { q: number; answer: string }
type WorkerFlagged = { q: number; reason: string }

type QueueItem = {
  id: string
  file: File | null
  thumbnail: string
  name: string
  status: QueueStatus
  examId: string
  confidence?: number
  flaggedCount?: number
}

type Exam = {
  id: string
  title: string
  grade_level: string
  num_items: number
}

type RecentResult = {
  id: string
  student_name: string
  score: number
  total_items: number
  exams: { title: string } | null
}

let captureCounter = 0

export default function ScanPage() {
  const [exams, setExams] = useState<Exam[]>([])
  const [examsLoading, setExamsLoading] = useState(true)
  const [selectedExamId, setSelectedExamId] = useState('')

  const [queue, setQueue] = useState<QueueItem[]>([])
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState(false)

  const [recentResults, setRecentResults] = useState<RecentResult[]>([])
  const [resultsLoading, setResultsLoading] = useState(true)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const workerRef = useRef<Worker | null>(null)

  // Initialise Web Worker once
  useEffect(() => {
    const worker = new Worker('/workers/scan.worker.js')
    workerRef.current = worker
    return () => worker.terminate()
  }, [])

  // Fetch exams
  useEffect(() => {
    async function fetchExams() {
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from('exams')
          .select('id, title, grade_level, num_items')
          .order('created_at', { ascending: false })
        if (data) setExams(data)
      } catch {
        // silently fail — UI shows empty dropdown
      } finally {
        setExamsLoading(false)
      }
    }
    fetchExams()
  }, [])

  // Fetch recent results
  useEffect(() => {
    async function fetchResults() {
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from('grading_results')
          .select('id, student_name, score, total_items, exams(title)')
          .limit(5)
        if (data) setRecentResults(data as RecentResult[])
      } catch {
        // silently fail
      } finally {
        setResultsLoading(false)
      }
    }
    fetchResults()
  }, [])

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraActive(true)
      setCameraError(false)
    } catch {
      setCameraError(true)
      setCameraActive(false)
    }
  }, [])

  // Stop camera stream on unmount
  useEffect(() => {
    startCamera()
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [startCamera])

  function sendToWorker(imageData: ImageData, itemId: string) {
    const worker = workerRef.current
    if (!worker) return

    const exam = exams.find((e) => e.id === selectedExamId)
    const numItems = exam?.num_items ?? 50

    const handler = (e: MessageEvent) => {
      worker.removeEventListener('message', handler)
      const data = e.data as {
        success: boolean
        examId?: string
        answers?: WorkerAnswer[]
        flagged?: WorkerFlagged[]
        confidence?: number
        error?: string
      }

      setQueue((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) return item
          if (data.success) {
            return {
              ...item,
              status: (data.flagged?.length ?? 0) > 0 ? 'review' : 'done',
              confidence: data.confidence,
              flaggedCount: data.flagged?.length ?? 0,
            }
          }
          return { ...item, status: 'review' }
        })
      )
    }

    worker.addEventListener('message', handler)
    worker.postMessage({ imageData, width: imageData.width, height: imageData.height, numItems })
  }

  function processItem(item: QueueItem) {
    if (!item.file || !canvasRef.current) return

    setQueue((prev) =>
      prev.map((q) => (q.id === item.id ? { ...q, status: 'processing' } : q))
    )

    const img = new Image()
    const objectUrl = URL.createObjectURL(item.file)
    img.onload = () => {
      const canvas = canvasRef.current!
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(objectUrl)
      sendToWorker(imageData, item.id)
    }
    img.src = objectUrl
  }

  function processAll() {
    queue.filter((item) => item.status === 'waiting').forEach(processItem)
  }

  function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0)

    canvas.toBlob((blob) => {
      if (!blob) return
      captureCounter += 1
      const name = `Captured photo ${captureCounter}`
      const thumbnail = canvas.toDataURL('image/jpeg', 0.3)
      const file = new File([blob], `${name}.jpg`, { type: 'image/jpeg' })
      const item = addToQueue(file, thumbnail, name)

      // Auto-process captured photos immediately
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: 'processing' } : q))
      )
      sendToWorker(imageData, item.id)
    }, 'image/jpeg')
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const thumbnail = ev.target?.result as string
        const item = addToQueue(file, thumbnail, file.name)
        processItem(item)
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  function addToQueue(file: File, thumbnail: string, name: string): QueueItem {
    const item: QueueItem = {
      id: crypto.randomUUID(),
      file,
      thumbnail,
      name,
      status: 'waiting',
      examId: selectedExamId,
    }
    setQueue((prev) => [...prev, item])
    return item
  }

  function removeFromQueue(id: string) {
    setQueue((prev) => prev.filter((item) => item.id !== id))
  }

  const queueIsEmpty = queue.length === 0
  const hasWaiting = queue.some((item) => item.status === 'waiting')

  return (
    <>
      <style>{`
        @keyframes scanline {
          0%   { top: 0; }
          100% { top: calc(100% - 2px); }
        }
        .animate-scanline {
          animation: scanline 2s linear infinite;
        }
      `}</style>

      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-0.5">
            Scan
          </p>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Scan Answer Sheets
          </h1>
        </div>
      </div>

      {/* Top two-column section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* ── LEFT: Camera / Upload Panel ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col gap-5">
          {/* Exam selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Select Exam
            </label>
            {examsLoading ? (
              <div className="animate-pulse">
                <div className="h-10 bg-slate-200 rounded-xl w-full" />
              </div>
            ) : (
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5
                  text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500
                  focus:border-transparent transition duration-150 appearance-none"
              >
                <option value="">— Choose an exam —</option>
                {exams.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.title} · Grade {exam.grade_level}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Viewfinder or error message — min-h-64 keeps it tall on narrow screens */}
          {cameraError ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl
              bg-slate-50 border border-slate-200 py-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                <Camera className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-600">Camera not available</p>
              <p className="text-xs text-slate-400">Use Upload Photo instead</p>
            </div>
          ) : (
            <div className="relative w-full rounded-xl overflow-hidden bg-slate-900 min-h-64"
              style={{ aspectRatio: '4/3' }}>
              {/* Video */}
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                muted
                playsInline
              />

              {/* Dark overlay with a cutout effect using a border-based guide rect */}
              {cameraActive && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="absolute inset-0 bg-black/40" />

                  {/* Guide rectangle */}
                  <div className="relative z-10 w-3/4 h-[85%]">
                    <div className="absolute inset-0 border-2 border-white/70 rounded-sm" />

                    {/* Corner markers */}
                    <span className="absolute -top-0.5 -left-0.5 w-5 h-5 border-t-[3px] border-l-[3px] border-white rounded-tl-sm" />
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 border-t-[3px] border-r-[3px] border-white rounded-tr-sm" />
                    <span className="absolute -bottom-0.5 -left-0.5 w-5 h-5 border-b-[3px] border-l-[3px] border-white rounded-bl-sm" />
                    <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 border-b-[3px] border-r-[3px] border-white rounded-br-sm" />

                    {/* Scan line */}
                    <div className="absolute inset-x-0 animate-scanline pointer-events-none">
                      <div className="h-0.5 bg-sky-400/80 shadow-[0_0_8px_2px_rgba(56,189,248,0.6)]" />
                    </div>
                  </div>
                </div>
              )}

              <p className="absolute bottom-3 left-0 right-0 text-center text-xs
                font-medium text-white/80 z-20">
                Align sheet within the frame
              </p>
            </div>
          )}

          {/* Hidden canvas for snapshot / offscreen drawing */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Buttons — stack vertically on mobile, side by side on sm+ */}
          <div className="flex flex-col sm:flex-row gap-3">
            {!cameraError && (
              <button
                onClick={capturePhoto}
                disabled={!cameraActive}
                className="flex-1 min-h-12 bg-sky-500 hover:bg-sky-600 disabled:opacity-40
                  disabled:cursor-not-allowed text-white font-semibold text-sm px-4 py-2.5
                  rounded-xl transition-colors duration-150 flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4" />
                Capture
              </button>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 min-h-12 bg-white hover:bg-slate-50 text-slate-700 font-semibold
                text-sm px-4 py-2.5 rounded-xl border border-slate-200 transition-colors
                duration-150 flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload Photo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        </div>

        {/* ── RIGHT: Processing Queue ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Processing Queue</h2>

          {queueIsEmpty ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center
                justify-center mb-4">
                <FileImage className="w-7 h-7 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-600 mb-1">No scans yet</p>
              <p className="text-xs text-slate-400">Capture or upload a sheet to begin</p>
            </div>
          ) : (
            <ul className="flex-1 flex flex-col gap-3 mb-4 overflow-y-auto max-h-96">
              {queue.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-100
                    bg-slate-50"
                >
                  {/* Thumbnail */}
                  <img
                    src={item.thumbnail}
                    alt={item.name}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border
                      border-slate-200"
                  />

                  {/* Name + status + meta */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{item.name}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={item.status} />
                      {item.status === 'done' && item.confidence !== undefined && (
                        <span className="text-xs text-slate-400 tabular-nums">
                          {Math.round(item.confidence * 100)}% confidence
                        </span>
                      )}
                      {(item.status === 'done' || item.status === 'review') &&
                        (item.flaggedCount ?? 0) > 0 && (
                          <span className="text-xs font-semibold text-amber-500">
                            ⚠ {item.flaggedCount} question{item.flaggedCount === 1 ? '' : 's'} need review
                          </span>
                        )}
                    </div>
                  </div>

                  {/* Remove (only for waiting) */}
                  {item.status === 'waiting' && (
                    <button
                      onClick={() => removeFromQueue(item.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg
                        hover:bg-slate-200 text-slate-400 hover:text-slate-600
                        transition-colors flex-shrink-0"
                      aria-label="Remove"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {/* Process All button — for any items still waiting */}
          <button
            onClick={processAll}
            disabled={!hasWaiting}
            className="w-full min-h-12 bg-sky-500 hover:bg-sky-600 disabled:opacity-40
              disabled:cursor-not-allowed text-white font-semibold text-sm px-4 py-2.5
              rounded-xl transition-colors duration-150 flex items-center justify-center gap-2 mt-auto"
          >
            <Play className="w-4 h-4" />
            Process All
          </button>
        </div>
      </div>

      {/* ── BOTTOM: Recent Results ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Recent Scans</h2>
          <Link
            href="/dashboard/results"
            className="text-xs font-semibold text-sky-500 hover:text-sky-600 transition-colors"
          >
            View All Results →
          </Link>
        </div>

        {resultsLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse flex gap-4">
                <div className="h-4 bg-slate-200 rounded-full w-1/4" />
                <div className="h-4 bg-slate-200 rounded-full w-1/3" />
                <div className="h-4 bg-slate-200 rounded-full w-1/6" />
              </div>
            ))}
          </div>
        ) : recentResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center
              justify-center mb-4">
              <CheckCircle className="w-7 h-7 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-600 mb-1">No results yet</p>
            <p className="text-xs text-slate-400">Graded sheets will appear here</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left text-xs font-semibold text-slate-400 uppercase
                  tracking-wide px-6 py-3">
                  Student
                </th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase
                  tracking-wide px-6 py-3">
                  Exam
                </th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase
                  tracking-wide px-6 py-3">
                  Score
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentResults.map((result) => (
                <tr key={result.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3.5 text-sm font-medium text-slate-900">
                    {result.student_name}
                  </td>
                  <td className="px-6 py-3.5 text-sm text-slate-600">
                    {result.exams?.title ?? '—'}
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="text-sm font-bold tabular-nums text-slate-900">
                      {result.score}
                    </span>
                    <span className="text-xs text-slate-400 ml-1">/ {result.total_items}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}

function StatusBadge({ status }: { status: QueueStatus }) {
  switch (status) {
    case 'waiting':
      return (
        <span className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full
          text-xs font-semibold bg-amber-50 text-amber-500">
          <Clock className="w-3 h-3" />
          Waiting
        </span>
      )
    case 'processing':
      return (
        <span className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full
          text-xs font-semibold bg-sky-50 text-sky-500">
          <Loader2 className="w-3 h-3 animate-spin" />
          Processing...
        </span>
      )
    case 'done':
      return (
        <span className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full
          text-xs font-semibold bg-emerald-50 text-emerald-600">
          <CheckCircle className="w-3 h-3" />
          Done
        </span>
      )
    case 'review':
      return (
        <span className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full
          text-xs font-semibold bg-red-50 text-red-500">
          <AlertTriangle className="w-3 h-3" />
          Review needed
        </span>
      )
  }
}
