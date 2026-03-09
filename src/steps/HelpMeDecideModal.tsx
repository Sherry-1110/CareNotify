import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MessageCircle, Phone, Sparkles, Shield } from 'lucide-react'
import type { FormState } from '../App'

type HelpMeDecideModalProps = {
  form: FormState
  onClose: () => void
  onDecision: (preference: 'text' | 'call') => void
}

const HESITATION_OPTIONS = [
  {
    value: 'worried_reaction',
    label: "I'm worried about their reaction",
    description: 'Safety/Anger concerns',
  },
  {
    value: 'too_anxious',
    label: "I'm too anxious / I'll freeze",
    description: 'Difficulty with live conversation',
  },
  {
    value: 'not_big_deal',
    label: "I don't want to make it a big deal",
    description: 'Keep it simple and low-drama',
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Tell us more',
  },
] as const

// Determine if STI is chronic or curable
const isChronicSTI = (stiValue: string): boolean => {
  const chronicSTIs = ['hiv', 'hsv_1', 'hsv_2', 'herpes']
  return chronicSTIs.some(chronic => stiValue.toLowerCase().includes(chronic))
}

// Get friendly STI name
const getSTIName = (stiValue: string): string => {
  const names: Record<string, string> = {
    chlamydia: 'Chlamydia',
    gonorrhea: 'Gonorrhea',
    syphilis: 'Syphilis',
    trichomoniasis: 'Trichomoniasis',
    hiv: 'HIV',
    hsv_1: 'HSV-1 (Herpes)',
    hsv_2: 'HSV-2 (Herpes)',
    mycoplasma_genitalium: 'Mycoplasma Genitalium',
  }
  return names[stiValue] || stiValue
}

// Get friendly relationship name
const getRelationshipName = (relationship: string): string => {
  const names: Record<string, string> = {
    current_partner: 'Current Partner',
    previous_partner: 'Previous Partner',
    future_partner: 'Future Partner',
  }
  return names[relationship] || relationship
}

export default function HelpMeDecideModal({ form, onClose, onDecision }: HelpMeDecideModalProps) {
  const [selectedHesitation, setSelectedHesitation] = useState<string>('')
  const [otherInput, setOtherInput] = useState('')
  const [showRecommendation, setShowRecommendation] = useState(false)
  const [recommendation, setRecommendation] = useState<{
    method: 'text' | 'call'
    reasoning: string
  } | null>(null)

  // Determine STI severity
  const hasChronicSTI = form.testResults.some(test => isChronicSTI(test.value))
  const stiNames = form.testResults.map(test => getSTIName(test.value)).join(', ')
  const severity = hasChronicSTI ? 'Chronic/Manageable' : 'Curable'

  const analyzeOtherInput = (input: string): 'logistics' | 'emotion' | 'safety' | 'ambiguous' => {
    const lowerInput = input.toLowerCase()
    
    // Safety indicators
    if (lowerInput.includes('afraid') || lowerInput.includes('scare') || 
        lowerInput.includes('anger') || lowerInput.includes('violent') ||
        lowerInput.includes('hurt')) {
      return 'safety'
    }
    
    // Logistics indicators
    if (lowerInput.includes('work') || lowerInput.includes('public') || 
        lowerInput.includes('time') || lowerInput.includes('busy') ||
        lowerInput.includes('privacy')) {
      return 'logistics'
    }
    
    // Emotion indicators
    if (lowerInput.includes('guilt') || lowerInput.includes('shame') || 
        lowerInput.includes('sorry') || lowerInput.includes('feel')) {
      return 'emotion'
    }
    
    return 'ambiguous'
  }

  const generateRecommendation = () => {
    let method: 'text' | 'call' = 'text'
    let reasoning = ''

    // Safety check (highest priority)
    if (selectedHesitation === 'worried_reaction') {
      method = 'text'
      reasoning = "Because you're worried about their reaction, your safety comes first—a text allows you to deliver the health news while keeping a safe physical boundary."
    }
    // Other input with safety concerns
    else if (selectedHesitation === 'other' && analyzeOtherInput(otherInput) === 'safety') {
      method = 'text'
      reasoning = "Your physical and emotional safety is the priority. A text creates a necessary boundary and gives you a record of the conversation."
    }
    // Anxiety check
    else if (selectedHesitation === 'too_anxious') {
      if (hasChronicSTI) {
        method = 'call'
        reasoning = "I know your anxiety is high right now, but sending a text about a chronic diagnosis often leaves the other person confused and scared; hearing your calm voice is the best way to stop them from spiraling."
      } else {
        method = 'text'
        reasoning = "Since this is easily treated, a text gets the facts across clearly without the pressure of a live performance."
      }
    }
    // "Big deal" check
    else if (selectedHesitation === 'not_big_deal') {
      if (hasChronicSTI) {
        method = 'call'
        reasoning = "Actually, a text can make it feel bigger because tone gets lost. A quick, calm voice conversation minimizes the drama."
      } else {
        method = 'text'
        reasoning = "Agreed. A text keeps it transactional, simple, and low-drama."
      }
    }
    // Other input analysis
    else if (selectedHesitation === 'other') {
      const analysis = analyzeOtherInput(otherInput)
      if (analysis === 'logistics') {
        method = 'text'
        reasoning = "Since you're in a situation where you can't speak freely, a text is the most practical way to handle this responsibly right now."
      } else if (analysis === 'emotion') {
        method = 'call'
        reasoning = "Your emotional connection matters here. A phone call lets your sincerity come through and helps them feel your care."
      } else {
        method = 'text'
        reasoning = "A text message is a safe, clear way to share this information while giving both of you space to process."
      }
    }

    setRecommendation({ method, reasoning })
    setShowRecommendation(true)
  }

  const canContinue = selectedHesitation !== '' && 
    (selectedHesitation !== 'other' || otherInput.trim() !== '')

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-slate-200 p-6 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Help Me Decide</h2>
                <p className="text-sm text-slate-600">Let's find the best way to communicate</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {!showRecommendation ? (
              <>
                {/* Context Summary */}
                <div className="rounded-2xl glass-card p-4 space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-slate-600 font-medium w-24 shrink-0">STI Type:</span>
                    <span className="text-slate-900">{stiNames}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-slate-600 font-medium w-24 shrink-0">Severity:</span>
                    <span className="text-slate-900">{severity}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-slate-600 font-medium w-24 shrink-0">Relationship:</span>
                    <span className="text-slate-900">{getRelationshipName(form.partnerRelationship)}</span>
                  </div>
                </div>

                {/* Question */}
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">
                    What's your biggest hesitation?
                  </h3>
                  <div className="space-y-3">
                    {HESITATION_OPTIONS.map((option) => {
                      const selected = selectedHesitation === option.value
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setSelectedHesitation(option.value)
                            if (option.value !== 'other') setOtherInput('')
                          }}
                          className={`w-full text-left rounded-2xl border p-4 transition-all ${
                            selected
                              ? 'border-calm-400 bg-calm-50/90 shadow-soft'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-slate-900">{option.label}</p>
                              <p className="text-sm text-slate-600 mt-1">{option.description}</p>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              selected ? 'border-calm-500 bg-calm-500' : 'border-slate-300'
                            }`}>
                              {selected && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Other input */}
                {selectedHesitation === 'other' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Tell us more about what's on your mind:
                    </label>
                    <textarea
                      value={otherInput}
                      onChange={(e) => setOtherInput(e.target.value)}
                      placeholder="Share your concerns..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-calm-400 focus:ring-2 focus:ring-calm-200/50 outline-none transition-all resize-none"
                    />
                  </motion.div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 rounded-2xl border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={generateRecommendation}
                    disabled={!canContinue}
                    className="flex-1 py-3 rounded-2xl bg-gradient-primary text-white font-medium shadow-soft hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Get Recommendation
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Recommendation */}
                <div className="space-y-6">
                  <div className={`rounded-2xl p-6 border-2 ${
                    recommendation?.method === 'text' 
                      ? 'border-calm-400 bg-calm-50/50' 
                      : 'border-purple-400 bg-purple-50/50'
                  }`}>
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                        recommendation?.method === 'text'
                          ? 'bg-calm-500 text-white'
                          : 'bg-purple-500 text-white'
                      }`}>
                        {recommendation?.method === 'text' 
                          ? <MessageCircle className="w-7 h-7" />
                          : <Phone className="w-7 h-7" />
                        }
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-900 mb-1">
                          Recommendation: {recommendation?.method === 'text' ? 'Text Message' : 'Phone Call'}
                        </h3>
                        <p className="text-slate-700 leading-relaxed">
                          {recommendation?.reasoning}
                        </p>
                      </div>
                    </div>

                    {selectedHesitation === 'worried_reaction' && (
                      <div className="mt-4 flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
                        <Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-900">
                          Your safety is the top priority. Consider having a trusted friend nearby when you send this message.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowRecommendation(false)
                        setSelectedHesitation('')
                        setOtherInput('')
                        setRecommendation(null)
                      }}
                      className="flex-1 py-3 rounded-2xl border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50 transition-all"
                    >
                      Start Over
                    </button>
                    <button
                      onClick={() => {
                        if (recommendation) {
                          onDecision(recommendation.method)
                        }
                      }}
                      className="flex-1 py-3 rounded-2xl bg-gradient-primary text-white font-medium shadow-soft hover:shadow-lg transition-all"
                    >
                      Continue with {recommendation?.method === 'text' ? 'Text' : 'Call'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
