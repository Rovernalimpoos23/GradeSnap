import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <nav className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">GradeSnap</span>
            <span className="text-xl font-bold text-sky-500">.</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm px-4 py-2.5 rounded-xl border border-slate-200 transition-colors duration-150"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors duration-150"
            >
              Sign Up Free
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center px-6 py-24">
        <div className="text-center max-w-2xl">
          <p className="text-xs font-semibold text-sky-500 uppercase tracking-widest mb-3">
            For Filipino Teachers
          </p>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight leading-tight mb-4">
            Grade bubble sheets in seconds, not hours.
          </h1>
          <p className="text-base text-slate-500 mb-8 max-w-md mx-auto">
            Create exams, print answer sheets, scan, and get instant results — built for the Philippine classroom.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/signup"
              className="bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-colors duration-150"
            >
              Get Started Free
            </Link>
            <Link
              href="/login"
              className="bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm px-6 py-3 rounded-xl border border-slate-200 transition-colors duration-150"
            >
              Sign In
            </Link>
          </div>
          <p className="text-xs text-slate-400 mt-4">
            Free plan: 3 exams · 30 scans/month. No credit card needed.
          </p>
        </div>
      </main>
    </div>
  )
}
