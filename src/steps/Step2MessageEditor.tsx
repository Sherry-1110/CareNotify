import { useState, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, MessageCircle, Smartphone, User, FlaskConical, ChevronDown, PenLine } from 'lucide-react'
import type { FormState } from '../App'

const TEST_OPTIONS = [
  { value: 'chlamydia', label: 'Chlamydia' },
  { value: 'gonorrhea', label: 'Gonorrhea' },
  { value: 'hiv', label: 'HIV' },
  { value: 'syphilis', label: 'Syphilis' },
  { value: 'other', label: 'Other' },
] as const


const SUPPORTIVE_TEMPLATES = [
  (name: string, test: string) =>
    `Hey ${name || '[Name]'}, I care about us and our health. I recently got tested and my results came back positive for ${test}. I wanted you to know so you can get tested too — it's treatable and we're in this together. Here for you.`,
  (name: string, test: string) =>
    `Hi ${name || '[Name]'}, I got my test results back and they came back positive for ${test}. I wanted to tell you first — I care about you and our health. Getting tested is simple, and treatment is available. I'm here with you.`,
  (name: string, test: string) =>
    `${name || '[Name]'}, I need to share something with you. I tested positive for ${test}. I'm sharing this because I care about you and think you should get tested too. We can get through this together; it's treatable.`,
]

const DIRECT_TEMPLATES = [
  (name: string, test: string) =>
    `Hi ${name || '[Name]'}, I need to share something important: I tested positive for ${test}. You should get tested as well. Early treatment is available. Let me know if you have questions.`,
  (name: string, test: string) =>
    `${name || '[Name]'}, I tested positive for ${test}. Please get tested. Treatment is available and it's important to know your status.`,
  (_name: string, test: string) =>
    `Important: I tested positive for ${test}. You need to get tested too. Early treatment is available. Questions? Let me know.`,
]

type Step2MessageEditorProps = {
  form: FormState
  updateForm: (u: Partial<FormState>) => void
  onNext: () => void
}

export default function Step2MessageEditor({ form, updateForm, onNext }: Step2MessageEditorProps) {
  const [testSelectOpen, setTestSelectOpen] = useState(false)
  const testSelectRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (testSelectRef.current && !testSelectRef.current.contains(e.target as Node)) {
        setTestSelectOpen(false)
      }
    }
    if (testSelectOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [testSelectOpen])

  const testLabel = TEST_OPTIONS.find((o) => o.value === form.testResult)?.label ?? form.testResult
  const supportiveText = useMemo(
    () => SUPPORTIVE_TEMPLATES[0](form.partnerName, testLabel),
    [form.partnerName, testLabel]
  )
  const directText = useMemo(
    () => DIRECT_TEMPLATES[0](form.partnerName, testLabel),
    [form.partnerName, testLabel]
  )

  const previewOptions = useMemo(() => {
    const name = form.partnerName
    const test = testLabel
    return form.messageTemplate === 'supportive'
      ? SUPPORTIVE_TEMPLATES.map((fn) => fn(name, test))
      : DIRECT_TEMPLATES.map((fn) => fn(name, test))
  }, [form.partnerName, form.messageTemplate, testLabel])

  const applyTemplate = (template: 'supportive' | 'direct') => {
    const options = template === 'supportive'
      ? SUPPORTIVE_TEMPLATES.map((fn) => fn(form.partnerName, testLabel))
      : DIRECT_TEMPLATES.map((fn) => fn(form.partnerName, testLabel))
    updateForm({
      messageTemplate: template,
      messageText: options[0],
    })
  }

  return (
    <div className="min-h-screen px-6 py-8 pb-24 max-w-lg mx-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-8"
      >
        <div className="page-header">
          <h2 className="page-header-title">Message & partner info</h2>
          <p className="page-header-desc">Add their name and the test result, then choose a tone.</p>
        </div>

        <div>
          <div className="section-title">
            <User className="w-5 h-5 text-calm-600 shrink-0" />
            <span>Partner's name or nickname</span>
          </div>
          <input
            type="text"
            value={form.partnerName}
            onChange={(e) => updateForm({ partnerName: e.target.value })}
            placeholder="e.g. Alex"
            className="w-full px-4 py-3 rounded-2xl bg-white/60 backdrop-blur border border-white/60 focus:border-calm-400 focus:ring-2 focus:ring-calm-200/50 outline-none transition-all"
          />
        </div>

        <div className="relative" ref={testSelectRef}>
          <div className="section-title">
            <FlaskConical className="w-5 h-5 text-calm-600 shrink-0" />
            <span>Test result</span>
          </div>
          <button
            type="button"
            onClick={() => setTestSelectOpen((o) => !o)}
            className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-2xl bg-white/60 backdrop-blur border border-white/60 hover:border-calm-300/60 focus:border-calm-400 focus:ring-2 focus:ring-calm-200/50 outline-none transition-all text-left"
          >
            <span className="text-slate-800">{testLabel}</span>
            <ChevronDown className={`w-5 h-5 text-slate-500 shrink-0 transition-transform ${testSelectOpen ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {testSelectOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 right-0 top-full mt-2 z-10 rounded-2xl glass border border-white/50 overflow-hidden shadow-glass-lg"
              >
                {TEST_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      updateForm({ testResult: opt.value })
                      setTestSelectOpen(false)
                    }}
                    className={`w-full flex items-center px-4 py-3 text-left transition-colors ${form.testResult === opt.value ? 'bg-calm-100/80 text-calm-800 font-medium' : 'hover:bg-white/60 text-slate-700'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div>
          <div className="section-title">
            <MessageCircle className="w-5 h-5 text-calm-600 shrink-0" />
            <span>Message tone</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => applyTemplate('supportive')}
              className={`py-3 px-4 rounded-2xl text-left transition-all border ${
                form.messageTemplate === 'supportive'
                  ? 'border-calm-400/80 bg-gradient-to-br from-calm-50 to-calm-100/80 text-calm-800 shadow-soft'
                  : 'border-white/50 bg-white/40 backdrop-blur text-slate-600 hover:bg-white/60'
              }`}
            >
              <span className="font-medium text-sm">Supportive / Soft</span>
              <p className="text-xs mt-1 text-slate-500 line-clamp-2">Warm, caring tone</p>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => applyTemplate('direct')}
              className={`py-3 px-4 rounded-2xl text-left transition-all border ${
                form.messageTemplate === 'direct'
                  ? 'border-calm-400/80 bg-gradient-to-br from-calm-50 to-calm-100/80 text-calm-800 shadow-soft'
                  : 'border-white/50 bg-white/40 backdrop-blur text-slate-600 hover:bg-white/60'
              }`}
            >
              <span className="font-medium text-sm">Direct / Informative</span>
              <p className="text-xs mt-1 text-slate-500 line-clamp-2">Clear and factual</p>
            </motion.button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="sm:col-span-2">
            <div className="section-title">
              <Smartphone className="w-5 h-5 text-calm-600 shrink-0" />
              <span>Preview</span>
            </div>
            <div className="space-y-3 w-full">
              {previewOptions.map((text, i) => {
                const isSelected = form.messageText === text
                return (
                  <motion.button
                    key={i}
                    type="button"
                    whileTap={{ scale: 0.99 }}
                    onClick={() => updateForm({ messageText: text })}
                    className={`w-full text-left rounded-2xl bg-white/50 backdrop-blur p-4 min-h-[80px] border transition-all ${
                      isSelected
                        ? 'border-calm-400 ring-2 ring-calm-200/60'
                        : 'border-white/50 hover:border-calm-200/70 hover:bg-white/60'
                    }`}
                  >
                    <p className="text-sm text-slate-700 whitespace-pre-wrap line-clamp-4">{text}</p>
                  </motion.button>
                )
              })}
            </div>
          </div>
          <div className="sm:col-span-2">
            <div className="section-title">
              <PenLine className="w-5 h-5 text-calm-600 shrink-0" />
              <span>Edit your message</span>
            </div>
            <textarea
              value={form.messageText}
              onChange={(e) => updateForm({ messageText: e.target.value })}
              placeholder={form.messageTemplate === 'supportive' ? supportiveText : directText}
              rows={5}
              className="w-full px-4 py-3 rounded-2xl bg-white/60 backdrop-blur border border-white/60 focus:border-calm-400 focus:ring-2 focus:ring-calm-200/50 outline-none resize-y min-h-[120px]"
            />
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={onNext}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-primary text-white font-medium shadow-soft border border-white/20 hover:shadow-lg transition-shadow"
        >
          Continue
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </motion.div>
    </div>
  )
}
