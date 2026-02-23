import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, MessageSquare } from 'lucide-react'
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

type Step4MessagePreviewProps = {
  form: FormState
  updateForm: (u: Partial<FormState>) => void
  onBack: () => void
  onNext: () => void
}

export default function Step4MessagePreview({ form, updateForm, onBack, onNext }: Step4MessagePreviewProps) {
  const templateMessage = useMemo(
    () => getDefaultMessage(form),
    [form.partnerName, form.testResults, form.sponsorKit]
  )
  
  const currentMessage = form.messageText || templateMessage

  return (
    <div className="min-h-screen px-6 py-8 pb-24 max-w-lg mx-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-8"
      >
        <div className="page-header">
          <h2 className="page-header-title">Preview & edit your message</h2>
          <p className="page-header-desc">
            Feel free to edit the message below to make it more personal.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-calm-600" />
            <h3 className="font-semibold text-slate-800">Your message</h3>
          </div>
          <textarea
            value={currentMessage}
            onChange={(e) => updateForm({ messageText: e.target.value })}
            className="w-full px-4 py-3 rounded-2xl bg-white/60 backdrop-blur border border-white/60 focus:border-calm-400 focus:ring-2 focus:ring-calm-200/50 outline-none transition-all min-h-[250px] text-sm text-slate-700 resize-none"
            placeholder="Edit your message here..."
          />
        </div>

        <p className="text-center text-sm text-slate-500">
          Once you're happy with your message, continue to send it.
        </p>

        <div className="flex items-center gap-3">
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={onBack}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-4 rounded-2xl glass-card text-calm-700 font-medium hover:bg-white/80 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={onNext}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-primary text-white font-medium shadow-soft border border-white/20 hover:shadow-lg transition-shadow"
          >
            Continue to send
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}
