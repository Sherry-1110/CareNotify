import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, FlaskConical, MessageCircle, Phone, Upload, User, X } from 'lucide-react'
import type { ChangeEvent } from 'react'
import type { FormState } from '../App'

const RELATIONSHIP_OPTIONS = [
  {
    value: 'current_partner',
    label: 'Current partner',
    description: 'Someone who you are currently sexually active with.',
  },
  {
    value: 'previous_partner',
    label: 'Previous partner',
    description: 'Someone you were sexually active with, but not recently.',
  },
  {
    value: 'future_partner',
    label: 'Future partner',
    description: '',
  },
] as const

const COMMUNICATION_OPTIONS = [
  { value: 'text', label: 'Text', icon: MessageCircle },
  { value: 'call', label: 'Call', icon: Phone },
] as const

const DISEASE_OPTIONS = [
  { value: 'chlamydia', label: 'Chlamydia' },
  { value: 'gonorrhea', label: 'Gonorrhea' },
  { value: 'syphilis', label: 'Syphilis' },
  { value: 'trichomoniasis', label: 'Trichomoniasis' },
  { value: 'hiv', label: 'HIV' },
  { value: 'hsv_1', label: 'HSV-1 (Herpes Simplex Virus Type 1)' },
  { value: 'hsv_2', label: 'HSV-2 (Herpes Simplex Virus Type 2)' },
  { value: 'mycoplasma_genitalium', label: 'Mycoplasma Genitalium' },
] as const

const ATTACHMENT_STYLE_OPTIONS = [
  {
    value: 'secure',
    label: 'Secure',
    description: 'Comfortable with intimacy and independence.',
  },
  {
    value: 'anxious',
    label: 'Anxious',
    description: 'Craving closeness and fearing abandonment.',
  },
  {
    value: 'avoidant',
    label: 'Avoidant',
    description: 'Valuing independence and emotionally distant.',
  },
  {
    value: 'disorganized',
    label: 'Disorganized',
    description: 'Conflicted and fearful behavior patterns.',
  },
] as const

type Step2MessageEditorProps = {
  form: FormState
  updateForm: (u: Partial<FormState>) => void
  onNext: () => void
  onBack: () => void
}

export default function Step2MessageEditor({ form, updateForm, onNext, onBack }: Step2MessageEditorProps) {
  const [popupStep, setPopupStep] = useState<1 | 2 | 3>(1)

  const canContinue = popupStep === 1
    ? Boolean(form.partnerName.trim() && form.partnerRelationship && form.communicationPreference)
    : popupStep === 2
      ? Boolean(form.testResult)
      : Boolean(form.attachmentStyle)

  const handleNext = () => {
    if (!canContinue) return
    if (popupStep < 3) {
      setPopupStep((prev) => (prev + 1) as 1 | 2 | 3)
      return
    }
    onNext()
  }

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const incomingFiles = Array.from(event.target.files ?? [])
    if (!incomingFiles.length) return

    const merged = [...form.lastInteractionFiles, ...incomingFiles].slice(0, 2)
    updateForm({ lastInteractionFiles: merged })
    event.target.value = ''
  }

  const removeFile = (indexToRemove: number) => {
    updateForm({
      lastInteractionFiles: form.lastInteractionFiles.filter((_, index) => index !== indexToRemove),
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
          <p className="page-header-desc">Page {popupStep} of 3</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((dot) => (
            <div
              key={dot}
              className={`h-2 rounded-full transition-all ${
                dot <= popupStep ? 'bg-calm-500' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {popupStep === 1 && (
            <motion.div
              key="popup-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div>
                <div className="section-title">
                  <User className="w-5 h-5 text-calm-600 shrink-0" />
                  <span>Who would you like to send this to?</span>
                </div>
                <input
                  type="text"
                  value={form.partnerName}
                  onChange={(event) => updateForm({ partnerName: event.target.value })}
                  placeholder="Name"
                  className="w-full px-4 py-3 rounded-2xl bg-white/60 backdrop-blur border border-white/60 focus:border-calm-400 focus:ring-2 focus:ring-calm-200/50 outline-none transition-all"
                />
              </div>

              <div>
                <h3 className="section-title">Is this your…?</h3>
                <div className="space-y-3">
                  {RELATIONSHIP_OPTIONS.map((option) => {
                    const selected = form.partnerRelationship === option.value
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateForm({ partnerRelationship: option.value })}
                        className={`w-full text-left rounded-2xl border p-4 transition-all ${
                          selected
                            ? 'border-calm-400 bg-calm-50/90 shadow-soft'
                            : 'border-white/60 bg-white/50 hover:bg-white/70'
                        }`}
                      >
                        <p className="font-medium text-slate-800">{option.label}</p>
                        {option.description && (
                          <p className="text-sm text-slate-600 mt-1">{option.description}</p>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <h3 className="section-title">How would you like to communicate?</h3>
                <div className="grid grid-cols-2 gap-3">
                  {COMMUNICATION_OPTIONS.map((option) => {
                    const Icon = option.icon
                    const selected = form.communicationPreference === option.value
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateForm({ communicationPreference: option.value })}
                        className={`rounded-2xl border p-4 flex items-center gap-3 transition-all ${
                          selected
                            ? 'border-calm-400 bg-calm-50/90 text-calm-800 shadow-soft'
                            : 'border-white/60 bg-white/50 text-slate-700 hover:bg-white/70'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{option.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {popupStep === 2 && (
            <motion.div
              key="popup-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="section-title">
                <FlaskConical className="w-5 h-5 text-calm-600 shrink-0" />
                <span>Type of disease</span>
              </div>
              <div className="space-y-3">
                {DISEASE_OPTIONS.map((option) => {
                  const selected = form.testResult === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateForm({ testResult: option.value })}
                      className={`w-full text-left rounded-2xl border px-4 py-3 transition-all ${
                        selected
                          ? 'border-calm-400 bg-calm-50/90 shadow-soft text-calm-800'
                          : 'border-white/60 bg-white/50 text-slate-700 hover:bg-white/70'
                      }`}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
            </motion.div>
          )}

          {popupStep === 3 && (
            <motion.div
              key="popup-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div>
                <div className="section-title">
                  <Upload className="w-5 h-5 text-calm-600 shrink-0" />
                  <span>About your relationship</span>
                </div>
                <p className="text-sm text-slate-600 mb-3">
                  Can you help provide some context of your last interaction with them?
                  Upload screenshots or photos (max 2 files).
                </p>
                <label className="w-full rounded-2xl border border-dashed border-calm-300/80 bg-white/40 hover:bg-white/60 transition-colors p-4 flex flex-col items-center justify-center gap-2 text-center cursor-pointer">
                  <Upload className="w-5 h-5 text-calm-600" />
                  <span className="text-sm font-medium text-slate-700">Upload context files</span>
                  <span className="text-xs text-slate-500">Up to 2 images</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={form.lastInteractionFiles.length >= 2}
                  />
                </label>
                {form.lastInteractionFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {form.lastInteractionFiles.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="flex items-center justify-between rounded-xl bg-white/60 border border-white/50 px-3 py-2"
                      >
                        <p className="text-sm text-slate-700 truncate">{file.name}</p>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="p-1 rounded-lg hover:bg-white/70 text-slate-500 hover:text-slate-700"
                          aria-label={`Remove ${file.name}`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="section-title">What is your attachment style?</h3>
                <div className="space-y-3">
                  {ATTACHMENT_STYLE_OPTIONS.map((option) => {
                    const selected = form.attachmentStyle === option.value
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateForm({ attachmentStyle: option.value })}
                        className={`w-full text-left rounded-2xl border p-4 transition-all ${
                          selected
                            ? 'border-calm-400 bg-calm-50/90 shadow-soft'
                            : 'border-white/60 bg-white/50 hover:bg-white/70'
                        }`}
                      >
                        <p className="font-medium text-slate-800">{option.label}</p>
                        <p className="text-sm text-slate-600 mt-1">{option.description}</p>
                      </button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
          {popupStep > 1 && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => setPopupStep((prev) => (prev - 1) as 1 | 2 | 3)}
              className="px-5 py-4 rounded-2xl glass-card text-calm-700 font-medium hover:bg-white/80 transition-all flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleNext}
            disabled={!canContinue}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-primary text-white font-medium shadow-soft border border-white/20 hover:shadow-lg transition-shadow disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {popupStep === 3 ? 'Continue' : 'Next'}
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}
