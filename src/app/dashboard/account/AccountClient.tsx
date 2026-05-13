'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { Upload, Check, Crown, Zap, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type Teacher = Database['public']['Tables']['teachers']['Row']

type Props = {
  userId: string
  authEmail: string
  teacher: Teacher
}

export default function AccountClient({ userId, authEmail, teacher }: Props) {
  const router = useRouter()

  // School profile
  const [schoolName, setSchoolName] = useState(teacher.school_name ?? '')
  const [schoolAddress, setSchoolAddress] = useState(teacher.school_address ?? '')
  const [logoUrl, setLogoUrl] = useState<string | null>(teacher.school_logo_url)
  const [logoUploading, setLogoUploading] = useState(false)
  const [schoolSaving, setSchoolSaving] = useState(false)

  // Account
  const [teacherName, setTeacherName] = useState(teacher.name)
  const [accountSaving, setAccountSaving] = useState(false)

  // Sign out
  const [signingOut, setSigningOut] = useState(false)

  // Toast
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  // ── Logo upload via react-dropzone ───────────────────────────────────────

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return

      setLogoUploading(true)
      try {
        const supabase = createClient()
        const ext = file.name.split('.').pop() ?? 'png'
        const path = `${userId}/${Date.now()}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('logos')
          .upload(path, file, { upsert: true, cacheControl: '3600' })

        if (uploadError) throw uploadError

        const {
          data: { publicUrl },
        } = supabase.storage.from('logos').getPublicUrl(path)

        setLogoUrl(publicUrl)
      } catch (err) {
        console.error('Logo upload failed:', err)
      } finally {
        setLogoUploading(false)
      }
    },
    [userId]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
  })

  // ── Save school profile ──────────────────────────────────────────────────

  async function handleSaveSchool() {
    setSchoolSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('teachers')
        .update({
          school_name: schoolName.trim() || null,
          school_address: schoolAddress.trim() || null,
          school_logo_url: logoUrl,
        })
        .eq('id', userId)

      if (error) throw error
      setToast('Profile saved!')
      router.refresh()
    } catch (err) {
      console.error('Save failed:', err)
    } finally {
      setSchoolSaving(false)
    }
  }

  // ── Save account (teacher name) ──────────────────────────────────────────

  async function handleSaveAccount() {
    if (!teacherName.trim()) return
    setAccountSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('teachers')
        .update({ name: teacherName.trim() })
        .eq('id', userId)

      if (error) throw error
      setToast('Name saved!')
      router.refresh()
    } catch (err) {
      console.error('Save failed:', err)
    } finally {
      setAccountSaving(false)
    }
  }

  // ── Sign out ─────────────────────────────────────────────────────────────

  async function handleSignOut() {
    setSigningOut(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    } catch {
      setSigningOut(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Account</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your profile and school settings</p>
      </div>

      <div className="max-w-2xl space-y-5">
        {/* ── School Profile ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-5">School Profile</h2>

          {/* Logo */}
          <div className="mb-5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">
              School Logo
            </label>
            <div className="flex items-start gap-4">
              {/* Preview box */}
              <div className="w-[72px] h-[72px] rounded-xl border-2 border-slate-200 bg-slate-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {logoUploading ? (
                  <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                ) : logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt="School logo"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Upload className="w-6 h-6 text-slate-300" />
                )}
              </div>

              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={`flex-1 border-2 border-dashed rounded-xl px-4 py-5 text-center cursor-pointer transition-colors duration-150 ${
                  isDragActive
                    ? 'border-sky-400 bg-sky-50'
                    : 'border-slate-200 hover:border-sky-300 hover:bg-slate-50'
                }`}
              >
                <input {...getInputProps()} />
                <Upload
                  className={`w-5 h-5 mx-auto mb-1.5 ${isDragActive ? 'text-sky-500' : 'text-slate-400'}`}
                />
                {isDragActive ? (
                  <p className="text-sm font-medium text-sky-600">Drop to upload</p>
                ) : (
                  <>
                    <p className="text-sm font-medium text-slate-600">
                      Drag & drop or{' '}
                      <span className="text-sky-500 font-semibold">click to browse</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">PNG, JPG, WEBP · max 5 MB</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* School name */}
          <div className="mb-4">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
              School Name
            </label>
            <input
              value={schoolName}
              onChange={e => setSchoolName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition duration-150"
              placeholder="e.g. Rizal National High School"
            />
          </div>

          {/* School address */}
          <div className="mb-5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
              Address / Division
            </label>
            <input
              value={schoolAddress}
              onChange={e => setSchoolAddress(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition duration-150"
              placeholder="e.g. Sta. Cruz, Laguna · Division of Laguna"
            />
          </div>

          <button
            onClick={handleSaveSchool}
            disabled={schoolSaving || logoUploading}
            className="bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors duration-150 flex items-center gap-2"
          >
            {schoolSaving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            {schoolSaving ? 'Saving…' : 'Save Profile'}
          </button>
        </div>

        {/* ── Account ────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-5">Account</h2>

          {/* Teacher name */}
          <div className="mb-4">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
              Your Name
            </label>
            <input
              value={teacherName}
              onChange={e => setTeacherName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition duration-150"
              placeholder="e.g. Maria Santos"
            />
          </div>

          {/* Email (read-only) */}
          <div className="mb-5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
              Email
            </label>
            <div className="relative">
              <input
                value={authEmail || teacher.email}
                readOnly
                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-400 cursor-not-allowed select-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                Read only
              </span>
            </div>
          </div>

          {/* Plan */}
          <div className="mb-5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">
              Plan
            </label>

            {teacher.plan === 'pro' ? (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Crown className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-700">Active Pro Plan</p>
                  <p className="text-xs text-emerald-600 mt-0.5">Unlimited exams and scans</p>
                </div>
                <span className="ml-auto px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                  Pro
                </span>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                {/* Current plan row */}
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Free Plan</p>
                    <p className="text-xs text-slate-400 mt-0.5">3 exams · 30 scans/month</p>
                  </div>
                  <span className="ml-auto px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">
                    Free
                  </span>
                </div>

                {/* Upgrade banner */}
                <div className="border-t border-slate-100 bg-gradient-to-br from-sky-50 to-blue-50 px-4 py-3.5 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900">Upgrade to Pro</p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      Unlimited exams, unlimited scans, priority support
                    </p>
                  </div>
                  <button className="bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm px-4 py-2 rounded-xl transition-colors duration-150 whitespace-nowrap flex-shrink-0">
                    ₱99/month
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleSaveAccount}
            disabled={accountSaving || !teacherName.trim()}
            className="bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors duration-150 flex items-center gap-2"
          >
            {accountSaving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            {accountSaving ? 'Saving…' : 'Save'}
          </button>
        </div>

        {/* ── Danger Zone ────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-1">Danger Zone</h2>
          <p className="text-sm text-slate-500 mb-4">Sign out of your account on this device.</p>

          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors duration-150 flex items-center gap-2"
          >
            {signingOut ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            {signingOut ? 'Signing out…' : 'Sign Out'}
          </button>
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 bg-slate-900 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span className="text-emerald-400">✓</span>
          {toast}
        </div>
      )}
    </>
  )
}
