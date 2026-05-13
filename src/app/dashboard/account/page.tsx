import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { redirect } from 'next/navigation'
import type { Database } from '@/lib/supabase'
import AccountClient from './AccountClient'

export default async function AccountPage() {
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

  if (!user) redirect('/login')

  const { data: teacher } = await supabase
    .from('teachers')
    .select('*')
    .eq('id', user.id)
    .single()

  const teacherData = teacher ?? {
    id: user.id,
    email: user.email ?? '',
    name: '',
    school_name: null,
    school_address: null,
    school_logo_url: null,
    plan: 'free' as const,
  }

  return <AccountClient userId={user.id} authEmail={user.email ?? ''} teacher={teacherData} />
}
