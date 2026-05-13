import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Svg,
  Circle,
} from '@react-pdf/renderer'

const CHOICES = ['A', 'B', 'C', 'D', 'E']

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
    padding: 28,
    fontSize: 9,
  },
  // Registration marks
  regMark: {
    position: 'absolute',
    width: 12,
    height: 12,
    backgroundColor: '#000000',
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  schoolBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  schoolLogo: {
    width: 44,
    height: 44,
  },
  schoolTextBlock: {
    flex: 1,
  },
  schoolName: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },
  schoolAddress: {
    fontSize: 7,
    color: '#555555',
    textAlign: 'center',
    marginTop: 1,
  },
  qrCode: {
    width: 60,
    height: 60,
    flexShrink: 0,
  },
  // Divider
  divider: {
    borderBottom: '0.75pt solid #000000',
    marginVertical: 5,
  },
  // Exam info
  examTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  examMeta: {
    fontSize: 8,
    color: '#444444',
    textAlign: 'center',
  },
  // Student info grid
  studentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 6,
  },
  studentFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    gap: 4,
  },
  studentLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    whiteSpace: 'nowrap',
  },
  studentLine: {
    flex: 1,
    borderBottom: '0.5pt solid #000000',
    height: 14,
  },
  // Instructions
  instructionBox: {
    border: '0.75pt solid #000000',
    padding: 4,
    marginBottom: 6,
  },
  instructionTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  instructionText: {
    fontSize: 7,
    color: '#333333',
  },
  // Bubble grid
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  bubbleColumns: {
    flexDirection: 'row',
    gap: 16,
  },
  bubbleColumn: {
    flex: 1,
  },
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
    gap: 2,
  },
  bubbleNum: {
    fontSize: 7,
    width: 16,
    textAlign: 'right',
    marginRight: 3,
    fontFamily: 'Helvetica',
  },
  bubble: {
    width: 14,
    height: 14,
    borderRadius: 7,
    border: '0.75pt solid #000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 1,
  },
  bubbleLetter: {
    fontSize: 6,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
  },
  // Essay
  essaySection: {
    marginTop: 8,
    borderTop: '0.75pt solid #000000',
    paddingTop: 6,
  },
  essayLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 3,
  },
  essayQuestion: {
    fontSize: 8,
    marginBottom: 6,
    lineHeight: 1.4,
  },
  essayLine: {
    height: 18,
    borderBottom: '0.5pt solid #000000',
    marginBottom: 1,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 28,
    right: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 7,
    color: '#aaaaaa',
  },
})

export type SheetPDFProps = {
  exam: {
    id: string
    teacher_id: string
    title: string
    subject: string
    grade_level: string
    quarter: string
    school_year: string
    num_items: number
    num_choices: number
    theme_color: string | null
    has_essay: boolean
    essay_question: string | null
    essay_lines: number | null
  }
  teacher: {
    name: string
    school_name: string | null
    school_address: string | null
    school_logo_url: string | null
  }
  answerKeys: Array<{
    question_number: number
    correct_answer: string | null
    points: number
  }>
  qrDataUrl: string
}

export default function SheetPDF({ exam, teacher, qrDataUrl }: SheetPDFProps) {
  const choices = CHOICES.slice(0, exam.num_choices)
  const half = Math.ceil(exam.num_items / 2)
  const leftItems = Array.from({ length: half }, (_, i) => i + 1)
  const rightItems = Array.from({ length: exam.num_items - half }, (_, i) => i + half + 1)

  return (
    <Document title={exam.title}>
      <Page size="A4" style={styles.page}>
        {/* Registration marks */}
        <View style={{ ...styles.regMark, top: 10, left: 10 }} />
        <View style={{ ...styles.regMark, top: 10, right: 10 }} />
        <View style={{ ...styles.regMark, bottom: 10, left: 10 }} />
        <View style={{ ...styles.regMark, bottom: 10, right: 10 }} />

        {/* Header: school info + QR code */}
        <View style={styles.header}>
          <View style={styles.schoolBlock}>
            {teacher.school_logo_url && (
              <Image src={teacher.school_logo_url} style={styles.schoolLogo} />
            )}
            <View style={styles.schoolTextBlock}>
              <Text style={styles.schoolName}>
                {teacher.school_name ?? 'School Name'}
              </Text>
              {teacher.school_address && (
                <Text style={styles.schoolAddress}>{teacher.school_address}</Text>
              )}
            </View>
          </View>
          <Image src={qrDataUrl} style={styles.qrCode} />
        </View>

        <View style={styles.divider} />

        {/* Exam info */}
        <Text style={styles.examTitle}>{exam.title}</Text>
        <Text style={styles.examMeta}>
          {exam.subject}{'  ·  '}{exam.grade_level}{'  ·  '}{exam.quarter}{'  ·  '}{exam.school_year}
        </Text>

        <View style={styles.divider} />

        {/* Student info */}
        <View style={styles.studentGrid}>
          <View style={styles.studentFieldRow}>
            <Text style={styles.studentLabel}>Name:</Text>
            <View style={styles.studentLine} />
          </View>
          <View style={styles.studentFieldRow}>
            <Text style={styles.studentLabel}>LRN:</Text>
            <View style={styles.studentLine} />
          </View>
          <View style={styles.studentFieldRow}>
            <Text style={styles.studentLabel}>Section:</Text>
            <View style={styles.studentLine} />
          </View>
          <View style={styles.studentFieldRow}>
            <Text style={styles.studentLabel}>Date:</Text>
            <View style={styles.studentLine} />
          </View>
        </View>

        <View style={styles.divider} />

        {/* Instructions */}
        <View style={styles.instructionBox}>
          <Text style={styles.instructionTitle}>INSTRUCTIONS:</Text>
          <Text style={styles.instructionText}>
            Use a black ballpen or pencil. Shade the bubble completely corresponding to the
            letter of your answer. Erasures are not allowed. Do not make any stray marks.
          </Text>
        </View>

        {/* Bubble grid */}
        <Text style={styles.sectionTitle}>MULTIPLE CHOICE</Text>
        <View style={styles.bubbleColumns}>
          {/* Left column */}
          <View style={styles.bubbleColumn}>
            {leftItems.map(n => (
              <View key={n} style={styles.bubbleRow}>
                <Text style={styles.bubbleNum}>{n}.</Text>
                {choices.map(c => (
                  <View key={c} style={styles.bubble}>
                    <Text style={styles.bubbleLetter}>{c}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>

          {/* Right column */}
          <View style={styles.bubbleColumn}>
            {rightItems.map(n => (
              <View key={n} style={styles.bubbleRow}>
                <Text style={styles.bubbleNum}>{n}.</Text>
                {choices.map(c => (
                  <View key={c} style={styles.bubble}>
                    <Text style={styles.bubbleLetter}>{c}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>

        {/* Essay section */}
        {exam.has_essay && (
          <View style={styles.essaySection}>
            <Text style={styles.essayLabel}>ESSAY:</Text>
            {exam.essay_question && (
              <Text style={styles.essayQuestion}>{exam.essay_question}</Text>
            )}
            {Array.from({ length: exam.essay_lines ?? 8 }).map((_, i) => (
              <View key={i} style={styles.essayLine} />
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{teacher.name}</Text>
          <Text style={styles.footerText}>Powered by GradeSnap</Text>
        </View>
      </Page>
    </Document>
  )
}
