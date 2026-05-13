# GradeSnap — Claude Code Skill Guide

## Project Overview
GradeSnap is a bubble sheet exam grading SaaS for Filipino teachers.
Solo project. MVP focus. Ship fast, keep it clean.
One job: create exams → print bubble sheets → scan → auto-grade → see results.

---

## Tech Stack
- Frontend: Next.js 14 (App Router), TypeScript, Tailwind CSS
- Backend: Supabase (auth, database, storage, realtime)
- AI fallback: Groq API (llama-3.3-70b-versatile) — only for ambiguous scans
- PDF generation: @react-pdf/renderer
- QR codes: qrcode npm package
- File upload: react-dropzone
- Icons: lucide-react
- Deployment: Vercel

---

## Folder Structure
```
src/
  app/
    (auth)/
      login/
      signup/
    dashboard/
      page.tsx              ← main dashboard
      exams/
        new/                ← exam builder
        [id]/
          sheet/            ← bubble sheet PDF preview + download
      scan/                 ← upload scans
      results/
        [examId]/           ← per-exam results table
      account/              ← plan + billing
    api/
      grade/                ← grading logic
      stripe/               ← billing
  lib/
    supabase.ts             ← supabase client (typed)
    groq.ts                 ← groq client
    utils.ts                ← helpers (isPro, formatScore, etc.)
  components/
    ui/                     ← reusable: Button, Card, Input, Badge, Modal
    sheet/                  ← bubble sheet renderer components
    dashboard/              ← sidebar, topbar, stat cards
```

---

## ═══════════════════════════════════
## UI DESIGN SYSTEM
## Inspired by: clean travel app aesthetic —
## white cards on gray background, bold dark
## typography, pill filters, subtle shadows.
## ═══════════════════════════════════

### Color Palette
```
Background page:   #F1F5F9   (slate-100 — cool light gray, never pure white)
Background card:   #FFFFFF   (white cards floating on gray)
Background dark:   #0F172A   (slate-900 — for sidebar, headers)
Background input:  #F8FAFC   (slate-50)

Accent primary:    #0EA5E9   (sky-500 — trustworthy sky blue)
Accent hover:      #0284C7   (sky-600)
Accent light:      #E0F2FE   (sky-100 — for badges, pill backgrounds)

Text primary:      #0F172A   (slate-900 — near black, for headings)
Text secondary:    #475569   (slate-600 — for labels, subtitles)
Text muted:        #94A3B8   (slate-400 — for placeholders, meta)
Text on dark:      #F1F5F9   (slate-100)
Text on accent:    #FFFFFF

Border default:    #E2E8F0   (slate-200)
Border focus:      #0EA5E9   (sky-500)

Status green:      #10B981   (emerald-500) — passed, correct
Status green bg:   #ECFDF5   (emerald-50)
Status red:        #EF4444   (red-500) — failed, incorrect, flagged
Status red bg:     #FEF2F2   (red-50)
Status amber:      #F59E0B   (amber-500) — pending, review
Status amber bg:   #FFFBEB   (amber-50)
Status blue:       #0EA5E9   (sky-500) — active, info
Status blue bg:    #F0F9FF   (sky-50)
```

### Typography
```
Font family:  'Plus Jakarta Sans', sans-serif
Import:       https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap

Heading 1:    text-2xl font-bold text-slate-900 tracking-tight
Heading 2:    text-xl font-bold text-slate-900
Heading 3:    text-base font-semibold text-slate-900
Body:         text-sm font-normal text-slate-600
Small/Meta:   text-xs font-medium text-slate-400
Label:        text-xs font-semibold text-slate-500 uppercase tracking-wide
Number/Score: text-2xl font-bold tabular-nums (use for scores, counts)
```

### Spacing & Radius
```
Page padding:     px-6 py-6 (desktop), px-4 py-4 (mobile)
Card padding:     p-5 or p-6
Section gap:      gap-6 between major sections
Item gap:         gap-3 or gap-4 between list items
Border radius:    rounded-2xl for cards
                  rounded-xl for inputs, buttons, modals
                  rounded-full for pills, avatars, badges
                  rounded-lg for small elements
```

### Shadows
```
Card shadow:      shadow-sm (subtle, not dramatic)
Card hover:       shadow-md transition-shadow duration-200
Modal shadow:     shadow-xl
Topbar shadow:    shadow-sm border-b border-slate-200
```

### Component Patterns

#### Page Layout
```
- Full page background: bg-slate-100 min-h-screen
- Sidebar: fixed left, bg-slate-900, w-64
- Main content: ml-64, p-6
- Page header: flex justify-between items-center mb-6
```

#### Cards
```tsx
<div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
```

#### Stat Cards (like travel app's summary cards)
```tsx
<div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
    Total Scans
  </p>
  <p className="text-3xl font-bold text-slate-900 tabular-nums">48</p>
  <p className="text-xs text-slate-500 mt-1">this month</p>
</div>
```

#### Primary Button
```tsx
<button className="bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm
  px-4 py-2.5 rounded-xl transition-colors duration-150 flex items-center gap-2">
```

#### Ghost Button
```tsx
<button className="bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm
  px-4 py-2.5 rounded-xl border border-slate-200 transition-colors duration-150">
```

#### Danger Button
```tsx
<button className="bg-red-500 hover:bg-red-600 text-white font-semibold text-sm
  px-4 py-2.5 rounded-xl transition-colors duration-150">
```

#### Input Field
```tsx
<input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5
  text-sm text-slate-900 placeholder-slate-400
  focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent
  transition duration-150" />
```

#### Pill Filter Tabs (like travel app's Asia/Europe/South America tabs)
```tsx
<div className="flex gap-2">
  {['All', 'Passed', 'Failed', 'Flagged'].map(tab => (
    <button key={tab}
      className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors
      ${active === tab
        ? 'bg-sky-500 text-white shadow-sm'
        : 'bg-white text-slate-600 border border-slate-200 hover:border-sky-300'
      }`}>
      {tab}
    </button>
  ))}
</div>
```

#### Badge / Status Chip
```tsx
// Passed
<span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600">
  Passed
</span>
// Failed
<span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-500">
  Failed
</span>
// Pending
<span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-500">
  Pending
</span>
// Flagged
<span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-500
  flex items-center gap-1">
  ⚠ Flagged
</span>
```

#### Sidebar Navigation
```tsx
// Sidebar wrapper
<aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 flex flex-col z-50">

// Logo area
<div className="px-5 py-5 border-b border-slate-800">
  <span className="text-white font-bold text-lg tracking-tight">GradeSnap</span>
  <span className="text-sky-400 font-bold text-lg">.</span>
</div>

// Teacher info
<div className="px-5 py-4 border-b border-slate-800 flex items-center gap-3">
  <div className="w-9 h-9 rounded-full bg-sky-500 flex items-center justify-center
    text-white font-bold text-sm flex-shrink-0">
    MR
  </div>
  <div>
    <p className="text-white text-sm font-semibold">Ms. Reyes</p>
    <p className="text-slate-400 text-xs">Grade 8 · Math</p>
  </div>
</div>

// Nav item inactive
<a className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400
  hover:text-white hover:bg-slate-800 text-sm font-medium transition-colors mx-2">

// Nav item active
<a className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-white
  bg-sky-500 text-sm font-semibold mx-2">
```

#### Data Table
```tsx
<div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
  <table className="w-full">
    <thead>
      <tr className="border-b border-slate-100 bg-slate-50">
        <th className="text-left text-xs font-semibold text-slate-400 uppercase
          tracking-wide px-5 py-3">
          Student
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-slate-50">
      <tr className="hover:bg-slate-50 transition-colors">
        <td className="px-5 py-3.5 text-sm font-medium text-slate-900">
          Santos, Maria A.
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

#### Score Progress Bar
```tsx
<div className="flex items-center gap-3">
  <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
    <div className="h-full rounded-full bg-emerald-500 transition-all"
      style={{ width: '82%' }} />
  </div>
  <span className="text-sm font-bold text-slate-900 tabular-nums w-10 text-right">
    82%
  </span>
</div>
```

#### Greeting Header (like travel app's "Hello, Vanessa")
```tsx
<div className="mb-6">
  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
    Good morning
  </p>
  <h1 className="text-2xl font-bold text-slate-900">
    Ms. Reyes 👋
  </h1>
  <p className="text-sm text-slate-500 mt-0.5">
    Monday · Q3 Week 4 · Rizal National High School
  </p>
</div>
```

#### Search Bar
```tsx
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
  <input
    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5
      text-sm text-slate-900 placeholder-slate-400
      focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
    placeholder="Search students..." />
</div>
```

#### Empty State
```tsx
<div className="flex flex-col items-center justify-center py-16 text-center">
  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center
    justify-center mb-4">
    <FileText className="w-7 h-7 text-slate-400" />
  </div>
  <p className="text-sm font-semibold text-slate-600 mb-1">No exams yet</p>
  <p className="text-xs text-slate-400 mb-4">Create your first exam to get started</p>
  <button className="bg-sky-500 text-white text-sm font-semibold px-4 py-2
    rounded-xl hover:bg-sky-600 transition-colors">
    + New Exam
  </button>
</div>
```

#### Loading Skeleton
```tsx
<div className="animate-pulse">
  <div className="h-4 bg-slate-200 rounded-full w-3/4 mb-2" />
  <div className="h-4 bg-slate-200 rounded-full w-1/2" />
</div>
```

#### Toast / Notification
```tsx
// Success
<div className="fixed bottom-4 right-4 bg-slate-900 text-white text-sm font-medium
  px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 z-50">
  <span className="text-emerald-400">✓</span> Sheet generated successfully
</div>
```

---

## Code Rules
- Always use TypeScript — no `any` types
- Use Tailwind only — no inline styles, no CSS modules
- Use Server Components by default, add `'use client'` only when needed
- Always add `'use client'` when using useState, useEffect, or browser APIs
- Use Supabase RLS — never bypass on frontend
- All API routes in /app/api/
- NEXT_PUBLIC_ prefix for client-side env vars only
- Always wrap Supabase calls in try/catch
- Always show loading skeleton while data fetches
- Always show empty state when list is empty
- Import Plus Jakarta Sans in app/layout.tsx

---

## Supabase Rules
- Typed client from src/lib/supabase.ts
- Never use service_role key client-side
- All tables have RLS — teachers see only their own data
- Storage bucket named "scans" for uploaded images
- Storage bucket named "logos" for school logos

---

## Database Tables
```
teachers        (id, email, name, school_name, school_address, school_logo_url, plan)
exams           (id, teacher_id, title, subject, grade_level, quarter, school_year,
                 num_items, num_choices, theme_color, has_essay, essay_question, essay_lines)
answer_keys     (id, exam_id, question_number, correct_answer, points)
scan_submissions(id, exam_id, teacher_id, image_url, status)
grading_results (id, scan_id, exam_id, teacher_id, student_name, student_lrn,
                 raw_answers, score, total_items, percentage, flagged)
question_results(id, grading_result_id, question_number, detected_answer,
                 correct_answer, is_correct, points_earned)
```

---

## Groq API Usage
- Only for ambiguous bubble detection fallback
- Model: llama-3.3-70b-versatile
- Endpoint: https://api.groq.com/openai/v1/chat/completions
- Keep prompts short and return structured JSON
- Never use for primary grading logic — must be deterministic

---

## Filipino Context
- LRN = Learner Reference Number (student identifier)
- Quarters: Q1, Q2, Q3, Q4
- School year format: S.Y. 2024-2025
- Grade levels: Grade 7–12 (Junior and Senior High)
- DepEd = Department of Education Philippines

---

## Subscription Plan
- Free: up to 3 exams, 30 scans/month
- Pro: ₱99/month via Stripe — unlimited exams and scans
- teachers.plan column: 'free' or 'pro'
- Gate features with isPro() helper in src/lib/utils.ts

---

## What NOT to Build
- No attendance tracking
- No gradebook / K-12 grade computation
- No parent communication
- No DepEd form generation
- No light/dark toggle — light theme only
- No UI component libraries (no shadcn, no MUI, no Radix)
- No over-engineering — simplest working version first


---

## BUBBLE SHEET BUILDER — Sheet Page Spec
Located at: app/dashboard/exams/[id]/sheet/page.tsx

### Page Layout
Two column layout — side by side:
- Left: customization panel w-80 bg-white border-r border-slate-200 
  overflow-y-auto fixed height
- Right: live preview flex-1 bg-slate-100 overflow-auto p-8

### Customization Panel Sections
1. School Branding
   - Logo upload → Supabase Storage "logos" bucket
   - School name input → teachers.school_name
   - School address input → teachers.school_address
   - Save Profile button → updates teachers table

2. Sheet Style
   - Theme color: 8 preset swatches + custom color input
     Presets: #3b4dff, #e63946, #2ec4b6, #e76f51,
              #2d6a4f, #7209b7, #e63700, #1d3557
   - Layout: Portrait / Landscape pill toggle
   - Choices override: A-C / A-D / A-E pills

3. Sheet Content toggles
   - Show instructions box (default ON)
   - Show registration marks (default ON)
   - Show bubble labels A B C D (default ON)
   - Show sample filled bubble (default ON)

4. Footer
   - Motto input
   - Contact/website input
   - Show "Powered by GradeSnap" toggle

### Live Preview
- Updates instantly on every input change
- Uses React useState for all customization values
- No page reload, no save needed for preview
- Pre-fills from teachers table and exams table on load
- Zoom in/out buttons (scale transform)
- Print button → window.print()
- Download PDF → @react-pdf/renderer

### Bubble Sheet Structure (white, print-ready)
Header:
  - Logo img (56x56px) + school name (font-bold text-sm) 
    + address (text-xs text-gray-500)
  - Right side: exam title, subject, grade, quarter

Accent bar:
  - h-1.5 rounded-full using theme color, full width

Info fields row:
  - flex gap-3, each field has label + underline
  - Fields: Student Name, LRN, Section, Date
  - Labels use theme color, text-xs font-bold uppercase

QR + Instructions row:
  - QR code left (52x52px, generated with qrcode package)
  - Instructions box right (yellow bg, warning text)

Bubble Grid Rules:
  - ALWAYS 10 rows per column
  - Number of columns = Math.ceil(numItems / 10)
  - Example: 30 items = 3 columns of 10
  - Example: 50 items = 5 columns of 10
  - Example: 100 items = 10 columns of 10
  - Layout: grid grid-cols-{columns} gap-x-4 gap-y-0.5
  - Each bubble row: flex items-center gap-0.5
  - Question number: text-xs text-gray-400 w-4 text-right mr-1
  - Each bubble: w-5 h-5 rounded-full border-1.5 border-gray-400
    flex items-center justify-center text-gray-500
    font-bold text-xs
  - Filled sample bubble: bg-gray-900 border-gray-900 text-white

Essay section (if has_essay):
  - Purple border-l-4 question prompt box
  - Writing lines: border-b border-gray-300 h-7 per line
  - Word count guide if enabled
  - Scoring rubric table if enabled

Footer:
  - border-t border-gray-200 pt-3 mt-4
  - Left: motto in italic text-xs text-gray-500
  - Right: contact text-xs text-gray-400

Registration marks:
  - 4 corners, absolute positioned
  - 13x13px solid black squares, rounded-sm
  - top-3 left-3, top-3 right-3, bottom-3 left-3, bottom-3 right-3

### Print CSS
@media print:
  - Hide left customization panel
  - Hide zoom/print/download buttons
  - Sheet fills full page
  - @page size A4, margin 0
  - background-color: white
  - -webkit-print-color-adjust: exact

### State Variables (useState)
- schoolName, schoolAddress, logoUrl
- themeColor (default #3b4dff)
- layout ('portrait' | 'landscape')
- numChoices (3 | 4 | 5)
- showInstructions, showRegMarks, showLabels, showSample
- footerMotto, footerContact, showPowered
- zoom (default 100, step 10, min 50 max 150)

---

## SCANNING ARCHITECTURE — Browser-Based OMR

### Stack
- OpenCV.js (@techstark/opencv-js) — bubble detection
- Tesseract.js — OCR for student name/LRN fields  
- Browser Camera API (getUserMedia) — camera capture
- Web Workers — background processing (never block UI)
- jsQR — QR code decoding

### Install packages
npm install @techstark/opencv-js tesseract.js jsqr

### Scan page location
app/dashboard/scan/page.tsx

### Processing flow
1. Teacher captures photo or uploads image
2. Pass image to Web Worker
3. Web Worker loads OpenCV.js
4. Preprocess: grayscale → Gaussian blur → 
   adaptive threshold → find contours
5. Detect 3 registration marks → correct perspective warp
6. Decode QR code with jsQR → get exam_id
7. Load answer key from Supabase using exam_id
8. For each bubble row: sample pixel darkness
   if mean darkness < 80 → mark as filled
   if multiple filled → flag for review
   if none filled → flag for review
9. Tesseract.js reads student name field (optional)
10. Calculate score vs answer key
11. Save to grading_results + question_results tables
12. Update scan_submissions status to 'done'

### Bubble Detection Logic
- Sheet is divided into known grid based on registration marks
- Each bubble cell is a fixed-size circle region
- Sample average pixel value in center of each bubble
- Threshold: pixel mean < 80 = filled (0=black, 255=white)
- Ambiguous range 80-120: flag for manual review
- Send ambiguous cases to Groq API for AI fallback

### Camera UI
- Full width video preview with overlay guide rectangle
- Corner markers showing where to align the sheet
- "Capture" button takes snapshot from video stream
- "Upload Photo" button for gallery/file upload
- Both paths feed into same Web Worker pipeline

### Web Worker file
public/workers/scan.worker.js
- Loads OpenCV.js inside worker
- Receives ImageData from main thread
- Returns: { answers, studentName, examId, flagged, confidence }

### Offline Support
- OpenCV.js cached after first load
- Answer keys cached in localStorage by exam_id
- Results queued in IndexedDB if no internet
- Auto-sync to Supabase when connection restored

### Never block the main thread
- All OpenCV operations in Web Worker
- Show progress bar while processing
- UI stays responsive during scan