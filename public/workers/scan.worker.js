/* global cv, jsQR */

// Load dependencies — both files are served from public/workers/
importScripts('/workers/jsqr.js', '/workers/opencv.js')

// OpenCV signals readiness via this callback
self.Module = {
  onRuntimeInitialized() {
    self._cvReady = true
  },
}

function waitForCv() {
  return new Promise((resolve) => {
    if (self._cvReady) return resolve()
    const check = setInterval(() => {
      if (self._cvReady) {
        clearInterval(check)
        resolve()
      }
    }, 50)
  })
}

self.addEventListener('message', async (e) => {
  const { imageData, width, height, numItems = 50 } = e.data

  try {
    await waitForCv()
    const result = processSheet(imageData, width, height, numItems)
    self.postMessage(result)
  } catch (err) {
    self.postMessage({ success: false, error: err.message || 'Unknown error' })
  }
})

function processSheet(imageData, width, height, numItems) {
  // ── STEP 2: Preprocessing ──────────────────────────────────────────────────
  const src = cv.matFromImageData({ data: imageData, width, height })
  const gray = new cv.Mat()
  const blurred = new cv.Mat()
  const thresh = new cv.Mat()

  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY)
  cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0)
  cv.adaptiveThreshold(
    blurred,
    thresh,
    255,
    cv.ADAPTIVE_THRESH_GAUSSIAN_C,
    cv.THRESH_BINARY_INV,
    11,
    2
  )

  const contours = new cv.MatVector()
  const hierarchy = new cv.Mat()
  cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)

  // ── STEP 3: Registration mark detection + perspective warp ─────────────────
  let warped = src // fallback: use src as-is if warp fails
  let warpedGray = gray
  let didWarp = false

  const squares = []
  for (let i = 0; i < contours.size(); i++) {
    const cnt = contours.get(i)
    const area = cv.contourArea(cnt)
    if (area < 100 || area > width * height * 0.01) continue // skip tiny & huge

    const peri = cv.arcLength(cnt, true)
    const approx = new cv.Mat()
    cv.approxPolyDP(cnt, approx, 0.04 * peri, true)

    if (approx.rows === 4) {
      const rect = cv.boundingRect(cnt)
      const aspectRatio = rect.width / rect.height
      if (aspectRatio > 0.7 && aspectRatio < 1.3) {
        squares.push({ area, rect, cnt: approx })
      } else {
        approx.delete()
      }
    } else {
      approx.delete()
    }
    cnt.delete()
  }

  // Sort by area descending, pick top 4 candidates (corner marks)
  squares.sort((a, b) => b.area - a.area)
  const marks = squares.slice(0, 4)

  if (marks.length === 4) {
    // Identify corners by position
    const centers = marks.map((m) => ({
      x: m.rect.x + m.rect.width / 2,
      y: m.rect.y + m.rect.height / 2,
      ...m,
    }))
    centers.sort((a, b) => a.y - b.y)
    const top2 = centers.slice(0, 2).sort((a, b) => a.x - b.x)
    const bot2 = centers.slice(2, 4).sort((a, b) => a.x - b.x)
    const [tl, tr, bl, br] = [top2[0], top2[1], bot2[0], bot2[1]]

    const srcPts = cv.matFromArray(4, 1, cv.CV_32FC2, [
      tl.x, tl.y,
      tr.x, tr.y,
      br.x, br.y,
      bl.x, bl.y,
    ])
    const dstW = 800
    const dstH = 1100
    const dstPts = cv.matFromArray(4, 1, cv.CV_32FC2, [
      0, 0,
      dstW, 0,
      dstW, dstH,
      0, dstH,
    ])

    const M = cv.getPerspectiveTransform(srcPts, dstPts)
    const warpedMat = new cv.Mat()
    cv.warpPerspective(src, warpedMat, M, new cv.Size(dstW, dstH))
    warped = warpedMat
    warpedGray = new cv.Mat()
    cv.cvtColor(warped, warpedGray, cv.COLOR_RGBA2GRAY)
    didWarp = true

    srcPts.delete()
    dstPts.delete()
    M.delete()
  }

  // ── STEP 4: QR code decoding ───────────────────────────────────────────────
  const warpedW = warped.cols
  const warpedH = warped.rows
  const rgbaData = new Uint8ClampedArray(warped.data)

  // jsQR needs RGBA Uint8ClampedArray
  const qrResult = jsQR(rgbaData, warpedW, warpedH)
  let examId = null

  if (qrResult) {
    try {
      const payload = JSON.parse(qrResult.data)
      examId = payload.examId ?? payload.exam_id ?? qrResult.data
    } catch {
      examId = qrResult.data // raw string fallback
    }
  }

  if (!examId) {
    cleanup()
    return { success: false, error: 'QR not found' }
  }

  // ── STEP 5: Bubble detection ───────────────────────────────────────────────
  const numCols = Math.ceil(numItems / 10)
  const ROWS = 10
  const NUM_CHOICES = 4 // A B C D — default; sheet always uses 4

  // Approximate bubble grid bounds (relative to warped sheet)
  // These offsets assume a standard GradeSnap bubble sheet layout.
  // Margins are expressed as fractions of the warped image dimensions.
  const gridTop = 0.22    // 22% from top (below header / info fields)
  const gridBottom = 0.88 // ends at 88%
  const gridLeft = 0.05
  const gridRight = 0.95

  const gridW = warpedW * (gridRight - gridLeft)
  const gridH = warpedH * (gridBottom - gridTop)
  const cellW = gridW / numCols
  const cellH = gridH / ROWS
  const bubbleW = cellW / (NUM_CHOICES + 1.5) // space: num# + 4 bubbles + gap

  // Get grayscale pixel value at (x, y) from warpedGray
  function pixelAt(x, y) {
    const xi = Math.max(0, Math.min(Math.round(x), warpedW - 1))
    const yi = Math.max(0, Math.min(Math.round(y), warpedH - 1))
    return warpedGray.ucharAt(yi, xi)
  }

  function sampleCircleMean(cx, cy, r) {
    let sum = 0
    let count = 0
    const ri = Math.ceil(r)
    for (let dy = -ri; dy <= ri; dy++) {
      for (let dx = -ri; dx <= ri; dx++) {
        if (dx * dx + dy * dy <= r * r) {
          sum += pixelAt(cx + dx, cy + dy)
          count++
        }
      }
    }
    return count > 0 ? sum / count : 255
  }

  const answers = []
  const flagged = []
  let totalConfidence = 0

  for (let col = 0; col < numCols; col++) {
    for (let row = 0; row < ROWS; row++) {
      const qNum = col * ROWS + row + 1
      if (qNum > numItems) break

      // Cell origin (top-left of the column block)
      const colOriginX = warpedW * gridLeft + col * cellW
      const rowOriginY = warpedH * gridTop + row * cellH

      // Bubble centres: skip first slot (question number label area)
      const bubbleRadius = Math.min(bubbleW, cellH) * 0.3
      const choices = ['A', 'B', 'C', 'D'].slice(0, NUM_CHOICES)

      const darkness = choices.map((_, ci) => {
        const bx = colOriginX + (ci + 1.2) * (cellW / (NUM_CHOICES + 1.5))
        const by = rowOriginY + cellH * 0.5
        // Invert: in the threshold image filled bubbles are dark (low value in gray)
        // We sample from warpedGray (not thresholded) — lower = darker = filled
        return sampleCircleMean(bx, by, bubbleRadius)
      })

      // Classify each bubble
      const filled = []
      const ambiguous = []
      for (let ci = 0; ci < choices.length; ci++) {
        const mean = darkness[ci]
        if (mean < 80) filled.push(ci)
        else if (mean <= 120) ambiguous.push(ci)
      }

      if (filled.length === 1 && ambiguous.length === 0) {
        answers.push({ q: qNum, answer: choices[filled[0]] })
        totalConfidence += 1
      } else if (filled.length === 0 && ambiguous.length === 1) {
        answers.push({ q: qNum, answer: choices[ambiguous[0]] })
        flagged.push({ q: qNum, reason: 'ambiguous' })
        totalConfidence += 0.5
      } else if (filled.length > 1) {
        answers.push({ q: qNum, answer: choices[filled[0]] })
        flagged.push({ q: qNum, reason: 'multiple' })
        totalConfidence += 0.3
      } else {
        // none filled
        flagged.push({ q: qNum, reason: 'ambiguous' })
        totalConfidence += 0
      }
    }
  }

  const confidence = numItems > 0 ? totalConfidence / numItems : 0

  // ── Cleanup ────────────────────────────────────────────────────────────────
  function cleanup() {
    src.delete()
    gray.delete()
    blurred.delete()
    thresh.delete()
    contours.delete()
    hierarchy.delete()
    if (didWarp) {
      warped.delete()
      warpedGray.delete()
    }
    marks.forEach((m) => m.cnt.delete())
  }
  cleanup()

  // ── STEP 6: Return results ─────────────────────────────────────────────────
  return {
    success: true,
    examId,
    answers,
    flagged,
    confidence: Math.round(confidence * 100) / 100,
  }
}
