import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Copy, Lightbulb, LoaderCircle, MessageCircle, Phone, Shield, Sparkles } from 'lucide-react'
import type { FormState } from '../App'
import { generateMessageFromForm, getDefaultMessage } from '../lib/messageGenerator'

type AttachmentKey = FormState['attachmentStyle']
type AttachmentGuidance = {
  tip: string
}

const ATTACHMENT_GUIDANCE: Record<Exclude<AttachmentKey, ''>, AttachmentGuidance> = {
  anxious: {
    tip: "Your draft isn't wrong. However, with an anxious partner, clarity and reassurance can really help prevent spiraling. Some parts might unintentionally feel like an indirect accusation. It could help to remove any implied blame, keep the focus on health, and clearly signal that the relationship is safe.",
  },
  secure: {
    tip: "Your draft isn't wrong. However, with a secure partner, direct and transparent wording with clear next steps usually works well. It could help to stay factual, keep the focus on health, and frame this as collaboration instead of blame.",
  },
  avoidant: {
    tip: "Your draft isn't wrong. However, with an avoidant partner, concise and non-pressuring language can reduce shutdown. It could help to remove emotionally loaded wording, keep the focus on health, and avoid any implied blame.",
  },
  disorganized: {
    tip: "Your draft isn't wrong. However, with a disorganized partner, calm and consistent wording can make the conversation feel safer. It could help to remove implied blame, keep the focus on health, and clearly reinforce emotional safety.",
  },
}

const FALLBACK_GUIDANCE: AttachmentGuidance = {
  tip: "Your draft isn't wrong. It could help to keep the message clear, non-blaming, and focused on shared health.",
}

const POSITIVE_NOTE_LEAD = "You're taking a positive step."
const POSITIVE_NOTE_BODY = 'Being open about sexual health builds trust and keeps everyone safe.'

type Step5CompletionProps = {
  form: FormState
  updateForm: (u: Partial<FormState>) => void
  isGuest: boolean
  onBack: () => void
  onLogCopy: () => void
  onLogShare: () => void
}

export default function Step5Completion({ form, isGuest, onBack, onLogCopy, onLogShare }: Step5CompletionProps) {
  const [copied, setCopied] = useState(false)
  const [generatedMessage, setGeneratedMessage] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState('')
  const guidance = ATTACHMENT_GUIDANCE[form.attachmentStyle as Exclude<AttachmentKey, ''>] ?? FALLBACK_GUIDANCE

  const fallbackMessage = form.messageText.trim() || getDefaultMessage(form)
  const messageToShare = generatedMessage || fallbackMessage

  const runGeneration = async () => {
    setIsGenerating(true)
    setGenerationError('')
    try {
      const message = await generateMessageFromForm(form)
      setGeneratedMessage(message)
    } catch (error) {
      setGeneratedMessage('')
      const details = error instanceof Error ? error.message : 'Unknown error'
      setGenerationError(`Could not generate a personalized message. Using fallback message instead. ${details}`)
    } finally {
      setIsGenerating(false)
    }
  }

  useEffect(() => {
    void runGeneration()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageToShare)
      setCopied(true)
      onLogCopy()
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // noop
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
        className="flex flex-col items-center space-y-8 w-full"
      >
        <div className="w-full text-center">
          <h2 className="text-2xl font-bold tracking-tight text-calm-900">You're all set!</h2>
        </div>

        <div className="w-full space-y-4">
          <div className="text-left px-1">
            <div className="flex items-center gap-2 text-calm-700/80">
              <Lightbulb className="w-3.5 h-3.5" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em]">Tip</p>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">{guidance.tip}</p>
          </div>

          <div className="rounded-2xl bg-white/50 backdrop-blur p-4 border border-white/50 text-left">
            <div className="flex items-center justify-between gap-3 mb-2">
              <p className="text-xs font-medium text-slate-500">Personalized message</p>
              <button
                type="button"
                onClick={() => void runGeneration()}
                disabled={isGenerating}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-calm-700 hover:text-calm-900 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
                    Generating
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Regenerate
                  </>
                )}
              </button>
            </div>
            {generationError && <p className="text-xs text-amber-700 mb-2">{generationError}</p>}
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

          <div className="rounded-2xl border border-calm-200/70 bg-gradient-to-br from-calm-50/80 to-white/95 p-4 text-left shadow-soft">
            <div className="mb-2 flex items-center gap-2 text-calm-700">
              <Sparkles className="w-4 h-4" />
              <p className="text-xs font-semibold uppercase tracking-[0.08em]">Positive Note</p>
            </div>
            <p className="text-xl leading-tight font-bold text-slate-800">{POSITIVE_NOTE_LEAD}</p>
            <p className="mt-1 text-sm leading-relaxed font-medium text-slate-600">{POSITIVE_NOTE_BODY}</p>
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={onBack}
            className="w-full px-5 py-4 rounded-2xl glass-card text-calm-700 font-medium hover:bg-white/80 transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </motion.button>
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
                You continued as a guest. We don't store your data permanently. This session is for your use only.
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
