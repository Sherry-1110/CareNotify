import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Copy, MessageCircle, Phone, Share2, Shield } from 'lucide-react'
import type { FormState } from '../App'

const TEST_LABELS: Record<string, string> = {
  chlamydia: 'Chlamydia',
  gonorrhea: 'Gonorrhea',
  syphilis: 'Syphilis',
  trichomoniasis: 'Trichomoniasis',
  hiv: 'HIV',
  hsv_1: 'HSV-1 (Herpes Simplex Virus Type 1)',
  hsv_2: 'HSV-2 (Herpes Simplex Virus Type 2)',
  mycoplasma_genitalium: 'Mycoplasma Genitalium',
}

function getDefaultMessage(form: FormState): string {
  const name = form.partnerName || '*insert partner name*'
  const diseases = form.testResults
    .map((result) => TEST_LABELS[result] ?? result)
    .join(', ')
  
  if (form.sponsorKit) {
    if (form.testResults.length === 0) {
      return `Hey ${name}, I tested positive for an STI. I wanted to let you know so you can get tested too. I'm not accusing you of anything — sometimes it can show up later without symptoms. I care about us and just want us both to be healthy. I actually ordered an at-home test kit for you just to make things easier and totally up to you if you want to use it. I just wanted to handle this responsibly.`
    }
    return `Hey ${name}, I tested positive for ${diseases}. I wanted to let you know so you can get tested too. I'm not accusing you of anything — sometimes it can show up later without symptoms. I care about us and just want us both to be healthy. I actually ordered an at-home test kit for you just to make things easier and totally up to you if you want to use it. I just wanted to handle this responsibly.`
  }
  
  if (form.testResults.length === 0) {
    return `Hey ${name}, I tested positive for an STI. I wanted to let you know so you can get tested too. I'm not accusing you of anything — sometimes it can show up later without symptoms. I care about us and just want us both to be healthy.`
  }
  return `Hey ${name}, I tested positive for ${diseases}. I wanted to let you know so you can get tested too. I'm not accusing you of anything — sometimes it can show up later without symptoms. I care about us and just want us both to be healthy.`
}

type Step4CompletionProps = {
  form: FormState
  isGuest: boolean
  onLogCopy: () => void
  onLogShare: () => void
}

export default function Step4Completion({ form, isGuest, onLogCopy, onLogShare }: Step4CompletionProps) {
  const [copied, setCopied] = useState(false)
  const communicationLabel = form.communicationPreference === 'call' ? 'Call' : 'Text'
  const messageToShare = useMemo(
    () => form.messageText.trim() || getDefaultMessage(form),
    [form.messageText, form.partnerName, form.testResults]
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
          <Share2 className="w-10 h-10 text-white" />
        </div>
        <div className="w-full text-center">
          <h2 className="text-2xl font-bold tracking-tight text-calm-900">You're almost done</h2>
          <p className="text-sm text-calm-700/90 mt-1 leading-relaxed">
            You can copy or send your message to your partner using any option below.
            {' '}Preferred communication: <span className="font-medium">{communicationLabel}</span>.
            {form.sponsorKit && ' If you’re sponsoring a kit, you can complete that here when you’re ready.'}
          </p>
        </div>

        <div className="w-full space-y-4">
          <div className="rounded-2xl bg-white/50 backdrop-blur p-4 border border-white/50 text-left">
            <p className="text-xs font-medium text-slate-500 mb-2">Message preview</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{messageToShare}</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-3 py-4 px-5 rounded-2xl bg-white text-slate-700 font-medium shadow-soft border border-slate-200 hover:shadow-lg transition-shadow"
          >
            <Copy className="w-5 h-5" />
            {copied ? 'Copied!' : 'Copy message to clipboard'}
          </motion.button>
          {form.communicationPreference === 'call' ? (
            <motion.a
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              href="tel:"
              onClick={onLogShare}
              className="flex items-center justify-center gap-2 py-4 px-4 rounded-2xl bg-[#34C759] text-white font-medium hover:shadow-lg border border-white/20 transition-shadow"
            >
              <Phone className="w-5 h-5" />
              Open phone dialer
            </motion.a>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <motion.a
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href={smsUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onLogShare}
                className="flex items-center justify-center gap-2 py-4 px-4 rounded-2xl bg-[#34C759] text-white font-medium hover:shadow-lg border border-white/20 transition-shadow"
              >
                <MessageCircle className="w-5 h-5" />
                Messages
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href={shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onLogShare}
                className="flex items-center justify-center gap-2 py-4 px-4 rounded-2xl bg-[#34C759] text-white font-medium hover:shadow-lg border border-white/20 transition-shadow"
              >
                WhatsApp
              </motion.a>
            </div>
          )}
          {form.sponsorKit && (
            <motion.button
              type="button"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full flex items-center justify-center gap-2 py-4 px-5 rounded-2xl bg-blue-500 text-white font-medium hover:bg-blue-600 hover:shadow-lg transition-all border border-blue-600/30"
            >
              Pay for kit
            </motion.button>
          )}
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
