import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Copy, MessageCircle, Shield } from 'lucide-react'
import type { FormState } from '../App'

const TEST_LABELS: Record<string, string> = {
  chlamydia: 'Chlamydia',
  gonorrhea: 'Gonorrhea',
  hiv: 'HIV',
  syphilis: 'Syphilis',
  other: 'Other',
}

function getDefaultMessage(form: FormState): string {
  const name = form.partnerName || '[Name]'
  const test = TEST_LABELS[form.testResult] ?? form.testResult
  if (form.messageTemplate === 'direct') {
    return `Hi ${name}, I need to share something important: I tested positive for ${test}. You should get tested as well. Early treatment is available. Let me know if you have questions.`
  }
  return `Hey ${name}, I care about us and our health. I recently got tested and my results came back positive for ${test}. I wanted you to know so you can get tested too — it's treatable and we're in this together. Here for you.`
}

type Step4CompletionProps = {
  form: FormState
  isGuest: boolean
  onLogCopy: () => void
  onLogShare: () => void
}

export default function Step4Completion({ form, isGuest, onLogCopy, onLogShare }: Step4CompletionProps) {
  const [copied, setCopied] = useState(false)
  const messageToShare = useMemo(
    () => form.messageText.trim() || getDefaultMessage(form),
    [form.messageText, form.partnerName, form.testResult, form.messageTemplate]
  )

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageToShare)
      setCopied(true)
      onLogCopy()
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback or toast
    }
  }

  const shareUrl = `https://wa.me/?text=${encodeURIComponent(messageToShare)}`
  const smsUrl = `sms:?body=${encodeURIComponent(messageToShare)}`

  return (
    <div className="min-h-screen px-6 py-8 pb-24 max-w-lg mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center space-y-8 w-full text-center"
      >
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-calm-400/90 to-calm-600 flex items-center justify-center border border-white/40 shadow-soft">
          <CheckCircle2 className="w-10 h-10 text-white" />
        </div>
        <div className="w-full text-center">
          <h2 className="text-2xl font-bold tracking-tight text-calm-900">You’re all set</h2>
          <p className="text-base text-calm-700/90 mt-1 leading-relaxed">
            Copy your message or share it via text or WhatsApp.
          </p>
        </div>

        <div className="w-full space-y-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-3 py-4 px-5 rounded-2xl bg-gradient-primary text-white font-medium shadow-soft border border-white/20 hover:shadow-lg transition-shadow"
          >
            <Copy className="w-5 h-5" />
            {copied ? 'Copied!' : 'Copy message to clipboard'}
          </motion.button>
          <div className="grid grid-cols-2 gap-3">
            <motion.a
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              href={smsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onLogShare}
              className="flex items-center justify-center gap-2 py-4 px-4 rounded-2xl glass-card text-slate-700 font-medium hover:bg-white/80 transition-all"
            >
              <MessageCircle className="w-5 h-5" />
              Text
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onLogShare}
              className="flex items-center justify-center gap-2 py-4 px-4 rounded-2xl bg-gradient-to-r from-[#25D366] to-[#20BD5A] text-white font-medium hover:shadow-lg border border-white/20 transition-shadow"
            >
              WhatsApp
            </motion.a>
          </div>
        </div>

        {isGuest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-start gap-3 p-4 rounded-2xl glass-card text-left w-full"
          >
            <Shield className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-slate-700">Privacy note</p>
              <p className="text-sm text-slate-600 mt-1">
                You continued as a guest. We don’t store your data permanently. This session is for your use only.
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
