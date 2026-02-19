import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Gift, Check } from 'lucide-react'
import type { FormState } from '../App'

type Step3KitSponsorshipProps = {
  form: FormState
  updateForm: (u: Partial<FormState>) => void
  onBack: () => void
  onNext: () => void
}

export default function Step3KitSponsorship({ form, updateForm, onBack, onNext }: Step3KitSponsorshipProps) {
  return (
    <div className="min-h-screen px-6 py-8 pb-24 max-w-lg mx-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-8"
      >
        <div className="page-header">
          <h2 className="page-header-title">Would you like to support their health?</h2>
          <p className="page-header-desc">
            Offering a testing kit shifts the conversation from accusation to a gift of care.
          </p>
        </div>

        <motion.div
          whileTap={{ scale: 0.99 }}
          onClick={() => updateForm({ sponsorKit: !form.sponsorKit })}
          className={`rounded-3xl p-6 cursor-pointer transition-all border ${
            form.sponsorKit
              ? 'glass border-calm-400/50 bg-gradient-to-br from-calm-50/90 to-white/70 shadow-soft'
              : 'glass-card hover:bg-white/70'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              form.sponsorKit ? 'bg-gradient-primary text-white border border-white/30' : 'bg-white/60 backdrop-blur text-calm-600 border border-white/50'
            }`}>
              <Gift className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-slate-800">Sponsor a testing kit</h3>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  form.sponsorKit ? 'border-calm-500 bg-gradient-primary' : 'border-slate-300 bg-white/40'
                }`}>
                  {form.sponsorKit && <Check className="w-4 h-4 text-white" />}
                </div>
              </div>
              <p className="text-sm text-slate-600 mt-2">
                Offer to cover the cost of a testing kit so they can get tested at no cost. It shows you care and makes it easier for them to take the next step.
              </p>
              {form.sponsorKit && (
                <p className="mt-4 text-sm text-calm-700 rounded-xl glass-card px-4 py-3">
                  You will complete payment in the summary. If they decline the kit, the fee will be refunded to your original payment method.
                </p>
              )}
            </div>
          </div>
        </motion.div>

        <p className="text-center text-sm text-slate-500">
          You can skip this step. Your message will still be ready to send.
        </p>

        <div className="flex items-center gap-3">
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={onBack}
            className="px-5 py-4 rounded-2xl glass-card text-calm-700 font-medium hover:bg-white/80 transition-all flex items-center gap-2"
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
            Continue to preview message
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}
