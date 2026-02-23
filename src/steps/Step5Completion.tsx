import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Copy, Lightbulb, MessageCircle, MessageSquare, Phone, Share2, Shield, Sparkles } from 'lucide-react'
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

type AttachmentKey = FormState['attachmentStyle']
type AttachmentGuidance = {
  tip: string
}

const ATTACHMENT_GUIDANCE: Record<Exclude<AttachmentKey, ''>, AttachmentGuidance> = {
  anxious: {
    tip: "Tip: Your draft isn't wrong. However, with an anxious partner, clarity and reassurance can really help prevent spiraling. Some parts might unintentionally feel like an indirect accusation. It could help to remove any implied blame, keep the focus on health, and clearly signal that the relationship is safe.",
  },
  secure: {
    tip: "Tip: Your draft isn't wrong. However, with a secure partner, direct and transparent wording with clear next steps usually works well. It could help to stay factual, keep the focus on health, and frame this as collaboration instead of blame.",
  },
  avoidant: {
    tip: "Tip: Your draft isn't wrong. However, with an avoidant partner, concise and non-pressuring language can reduce shutdown. It could help to remove emotionally loaded wording, keep the focus on health, and avoid any implied blame.",
  },
  disorganized: {
    tip: "Tip: Your draft isn't wrong. However, with a disorganized partner, calm and consistent wording can make the conversation feel safer. It could help to remove implied blame, keep the focus on health, and clearly reinforce emotional safety.",
  },
}

const FALLBACK_GUIDANCE: AttachmentGuidance = {
  tip: "Tip: Your draft isn't wrong. It could help to keep the message clear, non-blaming, and focused on shared health.",
}

const POSITIVE_NOTE_LEAD = `"You're taking a positive step.`
const POSITIVE_NOTE_BODY = 'Being open about sexual health builds trust and keeps everyone safe."'

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

type Step5CompletionProps = {
  form: FormState
  updateForm: (u: Partial<FormState>) => void
  isGuest: boolean
  onBack: () => void
  onLogCopy: () => void
  onLogShare: () => void
}

export default function Step5Completion({ form, updateForm, isGuest, onBack, onLogCopy, onLogShare }: Step5CompletionProps) {
  const [copied, setCopied] = useState(false)
  const guidance = ATTACHMENT_GUIDANCE[form.attachmentStyle as Exclude<AttachmentKey, ''>] ?? FALLBACK_GUIDANCE
  
  const templateMessage = useMemo(
    () => getDefaultMessage(form),
    [form.partnerName, form.testResults, form.sponsorKit]
  )
  
  const currentMessage = form.messageText || templateMessage
  
  const messageToShare = useMemo(
    () => form.messageText.trim() || getDefaultMessage(form),
    [form.messageText, form.partnerName, form.testResults, form.sponsorKit]
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
          <h2 className="text-2xl font-bold tracking-tight text-calm-900">You're all set!</h2>
          <p className="text-sm text-calm-700/90 mt-1 leading-relaxed">
            Preview and edit your message below, then copy or send it to your partner.
            {form.sponsorKit && " If you're sponsoring a kit, you can complete that here when you're ready."}
          </p>
        </div>

        <div className="w-full space-y-4">
          {/* Edit Message Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-calm-600" />
              <h3 className="font-semibold text-slate-800">Preview & edit your message</h3>
            </div>
            <textarea
              value={currentMessage}
              onChange={(e) => updateForm({ messageText: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl bg-white/60 backdrop-blur border border-white/60 focus:border-calm-400 focus:ring-2 focus:ring-calm-200/50 outline-none transition-all min-h-[200px] text-sm text-slate-700 resize-none"
              placeholder="Edit your message here..."
            />
          </div>

          {/* Action Buttons */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={onBack}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/70 text-slate-700 font-medium hover:bg-white hover:shadow-md transition-all border border-slate-200"
          >
            <ArrowLeft className="w-4 h-4" />
          </motion.button>
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
          <div className="relative overflow-hidden rounded-3xl border border-calm-200/70 bg-gradient-to-br from-white/90 via-calm-50/80 to-white/80 p-5 text-left shadow-soft">
            <div className="pointer-events-none absolute -top-16 -right-10 h-40 w-40 rounded-full bg-calm-200/40 blur-2xl" />
            <div className="relative space-y-4">
              <div className="rounded-2xl border border-white/80 bg-white/75 p-4 backdrop-blur">
                <div className="mb-2 flex items-center gap-2 text-calm-700">
                  <Lightbulb className="w-4 h-4" />
                  <p className="text-xs font-semibold uppercase tracking-[0.08em]">Tip</p>
                </div>
                <p className="text-sm leading-relaxed text-slate-700">{guidance.tip}</p>
              </div>
              <div className="rounded-2xl border border-calm-200/70 bg-gradient-to-br from-calm-50/80 to-white/95 p-4">
                <div className="mb-2 flex items-center gap-2 text-calm-700">
                  <Sparkles className="w-4 h-4" />
                  <p className="text-xs font-semibold uppercase tracking-[0.08em]">Positive Note:</p>
                </div>
                <p className="text-xl leading-tight font-bold text-slate-800">{POSITIVE_NOTE_LEAD}</p>
                <p className="mt-1 text-sm leading-relaxed font-medium text-slate-600">{POSITIVE_NOTE_BODY}</p>
              </div>
            </div>
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
                You continued as a guest. We don't store your data permanently. This session is for your use only.
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
