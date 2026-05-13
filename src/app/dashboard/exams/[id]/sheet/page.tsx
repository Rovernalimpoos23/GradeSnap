import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { redirect } from 'next/navigation'
import QRCode from 'qrcode'
import type { Database } from '@/lib/supabase'
import SheetClient from './SheetClient'

type Props = {
  params: Promise<{ id: string }>
}

export default async function SheetPage({ params }: Props) {
  const { id } = await params
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

  const [examResult, teacherResult, keysResult] = await Promise.all([
    supabase.from('exams').select('*').eq('id', id).eq('teacher_id', user.id).single(),
    supabase
      .from('teachers')
      .select('name, school_name, school_address, school_logo_url')
      .eq('id', user.id)
      .single(),
    supabase
      .from('answer_keys')
      .select('question_number, correct_answer, points')
      .eq('exam_id', id)
      .order('question_number'),
  ])

  if (!examResult.data) redirect('/dashboard/exams')

  const exam = examResult.data
  const teacher = teacherResult.data ?? {
    name: '',
    school_name: null,
    school_address: null,
    school_logo_url: null,
  }
  const answerKeys = keysResult.data ?? []

  const qrDataUrl = await QRCode.toDataURL(
    JSON.stringify({ exam_id: exam.id, teacher_id: exam.teacher_id }),
    { width: 100, margin: 1, color: { dark: '#000000', light: '#ffffff' } }
  )

  return (
    <SheetClient
      exam={exam}
      teacher={teacher}
      answerKeys={answerKeys}
      qrDataUrl={qrDataUrl}
    />
  )
}
