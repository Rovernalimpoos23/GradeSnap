'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  Scan,
  BarChart2,
  User,
  LogOut,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'

type Teacher = {
  name: string
  school_name: string | null
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/exams', label: 'Exams', icon: FileText, exact: false },
  { href: '/dashboard/scan', label: 'Scan Sheets', icon: Scan, exact: false },
  { href: '/dashboard/results', label: 'Results', icon: BarChart2, exact: false },
  { href: '/dashboard/account', label: 'Account', icon: User, exact: false },
]

function initials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function SignOutButton() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleSignOut}
      className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-sm font-medium transition-colors w-full"
    >
      <LogOut className="w-4 h-4 flex-shrink-0" />
      Sign Out
    </button>
  )
}

export default function Sidebar({ teacher }: { teacher: Teacher }) {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 flex flex-col z-50">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-800 flex-shrink-0">
        <span className="text-white font-bold text-lg tracking-tight">GradeSnap</span>
        <span className="text-sky-400 font-bold text-lg">.</span>
      </div>

      {/* Teacher info */}
      <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-3 flex-shrink-0">
        <div className="w-9 h-9 rounded-full bg-sky-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {initials(teacher.name)}
        </div>
        <div className="min-w-0">
          <p className="text-white text-sm font-semibold truncate">{teacher.name}</p>
          <p className="text-slate-400 text-xs truncate">
            {teacher.school_name ?? 'No school set'}
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        <div className="space-y-0.5">
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const isActive = exact
              ? pathname === href
              : pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors mx-2 ${
                  isActive
                    ? 'bg-sky-500 text-white font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800 font-medium'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Sign out */}
      <div className="p-3 border-t border-slate-800 flex-shrink-0">
        <SignOutButton />
      </div>
    </aside>
  )
}
