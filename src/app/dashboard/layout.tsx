import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { redirect } from 'next/navigation'
import type { Database } from '@/lib/supabase'
import Sidebar from '@/components/dashboard/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {
          // Cannot set cookies during Server Component rendering
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: teacher } = await supabase
    .from('teachers')
    .select('name, school_name')
    .eq('id', user.id)
    .single()

  const teacherProfile = teacher ?? {
    name: user.email ?? 'Teacher',
    school_name: null,
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar teacher={teacherProfile} />
      <main className="lg:ml-64 flex-1 px-4 pt-16 pb-6 lg:p-6">{children}</main>
    </div>
  )
}
