import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, ExternalLink, FlaskConical, Gift, Upload, Users, X } from 'lucide-react'
import type { ChangeEvent, DragEvent } from 'react'
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
    description: 'Situationships, vibes, it\'s complicated, etc.',
  },
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
    description: 'Comfortable with intimacy/independence.',
  },
  {
    value: 'anxious',
    label: 'Anxious',
    description: 'Craving closeness, fearing abandonment.',
  },
  {
    value: 'avoidant',
    label: 'Avoidant',
    description: 'Valuing independence, emotionally distant.',
  },
  {
    value: 'disorganized',
    label: 'Disorganized',
    description: 'Conflicted, fearful behavior.',
  },
] as const

type Step2MessageEditorProps = {
  form: FormState
  updateForm: (u: Partial<FormState>) => void
  initialPage?: 1 | 2 | 3 | 4 | 5
  onNext: () => void
  onBack: () => void
}

export default function Step2MessageEditor({
  form,
  updateForm,
  initialPage = 1,
  onNext,
  onBack,
}: Step2MessageEditorProps) {
  const [popupStep, setPopupStep] = useState<1 | 2 | 3 | 4 | 5>(initialPage)
  const [hasInteractedWithStiSelection, setHasInteractedWithStiSelection] = useState(false)
  const [isDraggingFiles, setIsDraggingFiles] = useState(false)

  const canContinue = popupStep === 1
    ? Boolean(form.partnerName.trim() && form.partnerRelationship)
    : popupStep === 2
      ? form.testResults.length > 0
      : popupStep === 3
        ? Boolean(form.attachmentStyle)
        : true // Pages 4 and 5 are optional, always can continue

  const handleNext = () => {
    if (!canContinue) return
    if (popupStep < 5) {
      setPopupStep((prev) => (prev + 1) as 1 | 2 | 3 | 4 | 5)
      return
    }
    onNext()
  }

  const processIncomingFiles = (incomingFiles: File[]) => {
    if (!incomingFiles.length) return
    if (form.lastInteractionFiles.length >= 2) return

    const merged = [...form.lastInteractionFiles, ...incomingFiles].slice(0, 2)
    updateForm({ lastInteractionFiles: merged })
  }

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const incomingFiles = Array.from(event.target.files ?? [])
    processIncomingFiles(incomingFiles)
    event.target.value = ''
  }

  const handleDropFiles = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDraggingFiles(false)
    const files = Array.from(event.dataTransfer?.files ?? []).filter((file) => file.type.startsWith('image/'))
    processIncomingFiles(files)
  }

  const removeFile = (indexToRemove: number) => {
    updateForm({
      lastInteractionFiles: form.lastInteractionFiles.filter((_, index) => index !== indexToRemove),
    })
  }

  const toggleDisease = (diseaseValue: string) => {
    setHasInteractedWithStiSelection(true)
    const isSelected = form.testResults.includes(diseaseValue)
    if (isSelected) {
      updateForm({
        testResults: form.testResults.filter((d) => d !== diseaseValue),
      })
    } else {
      updateForm({
        testResults: [...form.testResults, diseaseValue],
      })
    }
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
          <p className="page-header-desc">Page {popupStep} of 5</p>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((dot) => (
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
                  <Users className="w-5 h-5 text-calm-600 shrink-0" />
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
              <div className="space-y-3">
                <div className="section-title">
                  <FlaskConical className="w-5 h-5 text-calm-600 shrink-0" />
                  <span>Type of disease (select all that apply)</span>
                </div>
                <div className="space-y-3">
                  {DISEASE_OPTIONS.map((option) => {
                    const isSelected = form.testResults.includes(option.value)
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => toggleDisease(option.value)}
                        className={`w-full text-left rounded-2xl border px-4 py-3 transition-all flex items-center gap-3 ${
                          isSelected
                            ? 'border-calm-400 bg-calm-50/90 shadow-soft'
                            : 'border-white/60 bg-white/50 hover:bg-white/70'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? 'border-calm-500 bg-calm-500'
                            : 'border-slate-300'
                        }`}>
                          {isSelected && <Check className="w-4 h-4 text-white" />}
                        </div>
                        <span className={`font-medium ${
                          isSelected ? 'text-calm-800' : 'text-slate-700'
                        }`}>
                          {option.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
                {form.testResults.length === 0 && hasInteractedWithStiSelection && (
                  <p className="text-sm text-red-600 mt-2">Select at least one STI to continue.</p>
                )}
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
                </p>
                <p className="text-sm text-slate-600 mb-3">Upload screenshots or photos (optional, max 2 files).</p>
                <label
                  className={`w-full rounded-2xl border border-dashed ${
                    isDraggingFiles ? 'border-calm-500 bg-calm-50/80' : 'border-calm-300/80 bg-white/40 hover:bg-white/60'
                  } transition-colors p-4 flex flex-col items-center justify-center gap-2 text-center cursor-pointer`}
                  onDragOver={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    if (!isDraggingFiles) setIsDraggingFiles(true)
                  }}
                  onDragEnter={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    setIsDraggingFiles(true)
                  }}
                  onDragLeave={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    setIsDraggingFiles(false)
                  }}
                  onDrop={handleDropFiles}
                >
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

                <div className="mt-6">
                  <h3 className="section-title">What is your partner's attachment style?</h3>
                  <p className="text-xs text-calm-600 mt-1 mb-3">
                    Attachment style reflects how someone emotionally connects and communicates in relationships.
                  </p>
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
              </div>
            </motion.div>
          )}

          {popupStep === 4 && (
            <motion.div
              key="popup-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div>
                <h3 className="section-title">Additional message content (optional)</h3>
                <p className="text-sm text-slate-600 mb-3">
                  Share anything else you'd like to include in the message
                </p>
                <textarea
                  value={form.additionalMessage || ''}
                  onChange={(event) => updateForm({ additionalMessage: event.target.value })}
                  placeholder="Type your additional message here..."
                  rows={6}
                  className="w-full px-4 py-3 rounded-2xl bg-white/60 backdrop-blur border border-white/60 focus:border-calm-400 focus:ring-2 focus:ring-calm-200/50 outline-none transition-all resize-none"
                />
              </div>
            </motion.div>
          )}

          {popupStep === 5 && (
            <motion.div
              key="popup-5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <p className="text-sm text-slate-600 text-left px-1">
                Offering a testing kit shifts the conversation from accusation to a gift of care.
              </p>

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
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-3 w-full">
          <div className="min-w-0 flex-1 flex">
            {popupStep === 1 ? (
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={onBack}
                className="w-full flex items-center justify-center py-4 rounded-2xl glass-card text-calm-700 font-medium hover:bg-white/80 transition-all"
              >
                <ArrowLeft className="w-5 h-5 shrink-0" />
              </motion.button>
            ) : (
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => setPopupStep((prev) => (prev - 1) as 1 | 2 | 3 | 4 | 5)}
                className="w-full flex items-center justify-center py-4 rounded-2xl glass-card text-calm-700 font-medium hover:bg-white/80 transition-all"
              >
                <ArrowLeft className="w-5 h-5 shrink-0" />
              </motion.button>
            )}
          </div>
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleNext}
            disabled={!canContinue}
            className="min-w-0 flex-1 flex items-center justify-center py-4 rounded-2xl bg-gradient-primary text-white font-medium shadow-soft border border-white/20 hover:shadow-lg transition-shadow disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <ArrowRight className="w-5 h-5 shrink-0" />
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}
