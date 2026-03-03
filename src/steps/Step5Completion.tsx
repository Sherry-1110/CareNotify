import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Copy, Edit2, Lightbulb, LoaderCircle, MessageCircle, Phone, Shield, Sparkles, Check, X } from 'lucide-react'
import type { FormState } from '../App'
import { generateMessageAndStyleFromForm, generateGuidanceFromForm, generateCoachingInsightFromForm, getDefaultMessage, type AttachmentGuidance, type CoachingInsight } from '../lib/messageGenerator'

const FALLBACK_GUIDANCE: AttachmentGuidance = {
  attachmentStyle: 'secure',
  tip: "Keep the message clear, non-blaming, and focused on shared health.",
  positiveNote: "You're taking a positive step. Being open about sexual health builds trust.",
}

type Step5CompletionProps = {
  form: FormState
  updateForm: (u: Partial<FormState>) => void
  isGuest: boolean
  onLogCopy: () => void
  onLogShare: () => void
  onBackToSponsorKit: () => void
  onNewMessage: () => void
}

export default function Step5Completion({
  form,
  updateForm,
  isGuest,
  onLogCopy,
  onLogShare,
  onBackToSponsorKit,
  onNewMessage,
}: Step5CompletionProps) {
  const [copied, setCopied] = useState(false)
  const [generatedMessage, setGeneratedMessage] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState('')
  const [guidance, setGuidance] = useState<AttachmentGuidance>(FALLBACK_GUIDANCE)
  const [coachingInsight, setCoachingInsight] = useState<CoachingInsight | null>(null)
  const [isLoadingGuidance, setIsLoadingGuidance] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedMessage, setEditedMessage] = useState('')
  const isCallMode = form.communicationPreference === 'call'

  const fallbackMessage = form.messageText.trim() || getDefaultMessage(form)
  const messageToShare = generatedMessage || fallbackMessage

  const runGeneration = async () => {
    setIsGenerating(true)
    setGenerationError('')
    try {
      if (isCallMode) {
        // For call mode, generate coaching insight instead of message
        const insight = await generateCoachingInsightFromForm(form)
        console.log('Generated coaching insight:', insight)
        setCoachingInsight(insight)
        // Update form with determined attachment style
        updateForm({ attachmentStyle: insight.attachmentStyle as FormState['attachmentStyle'] })
      } else {
        // For text mode, generate message and guidance
        // Generate message and determine attachment style from context
        const result = await generateMessageAndStyleFromForm(form)
        setGeneratedMessage(result.message)
        
        // Update form with determined attachment style
        updateForm({ attachmentStyle: result.attachmentStyle as FormState['attachmentStyle'] })
        
        // Load guidance after message is generated
        await loadGuidance(result.message, result.attachmentStyle)
      }
    } catch (error) {
      console.error('Generation error:', error)
      setGeneratedMessage('')
      const details = error instanceof Error ? error.message : 'Unknown error'
      setGenerationError(`Could not generate content. ${details}`)
      // Try to load guidance with fallback message for text mode
      if (!isCallMode) {
        await loadGuidance(form.messageText.trim() || getDefaultMessage(form), form.attachmentStyle || 'secure')
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const loadGuidance = async (draftedMessage: string, attachmentStyle: string) => {
    setIsLoadingGuidance(true)
    try {
      // Create a form with the determined attachment style
      const formWithStyle: FormState = { ...form, attachmentStyle: attachmentStyle as FormState['attachmentStyle'] }
      const aiGuidance = await generateGuidanceFromForm(formWithStyle, draftedMessage)
      setGuidance(aiGuidance)
    } catch (error) {
      console.error('Failed to generate guidance:', error)
      setGuidance(FALLBACK_GUIDANCE)
    } finally {
      setIsLoadingGuidance(false)
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

  const handleEdit = () => {
    setEditedMessage(messageToShare)
    setIsEditing(true)
  }

  const handleSaveEdit = () => {
    if (editedMessage.trim()) {
      updateForm({ messageText: editedMessage })
      setGeneratedMessage(editedMessage)
      setIsEditing(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditedMessage('')
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
          {!isCallMode && (
            <div className="text-left px-1">
              <div className="flex items-center gap-2 text-calm-700/80">
                <Lightbulb className="w-3.5 h-3.5" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em]">Tip</p>
              </div>
              {isLoadingGuidance ? (
                <div className="mt-1 flex items-center gap-2 text-slate-500">
                  <LoaderCircle className="w-3 h-3 animate-spin" />
                  <p className="text-xs">Analyzing attachment style...</p>
                </div>
              ) : (
                <p className="mt-1 text-xs leading-relaxed text-slate-600">{guidance.tip}</p>
              )}
            </div>
          )}

          {!isCallMode && (
            <div className="rounded-2xl bg-white/50 backdrop-blur p-4 border border-white/50 text-left">
              <div className="flex items-center justify-between gap-3 mb-2">
                <p className="text-xs font-medium text-slate-500">Personalized message</p>
                <div className="flex items-center gap-2">
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={handleEdit}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-calm-700 hover:text-calm-900"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                  )}
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
              </div>
              {generationError && <p className="text-xs text-amber-700 mb-2">{generationError}</p>}
              {isEditing ? (
                <div className="space-y-2">
                  <textarea
                    value={editedMessage}
                    onChange={(e) => setEditedMessage(e.target.value)}
                    className="w-full text-sm text-slate-700 border border-calm-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-calm-400 min-h-[120px] resize-none"
                    placeholder="Edit your message..."
                  />
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSaveEdit}
                      className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-calm-500 text-white text-sm font-medium hover:bg-calm-600 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      Save
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCancelEdit}
                      className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-300 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </motion.button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{messageToShare}</p>
              )}
            </div>
          )}

          {isCallMode && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-gradient-to-br from-calm-50/80 to-white/95 p-6 border border-calm-200/70 shadow-soft">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2 text-calm-700">
                    <Sparkles className="w-5 h-5" />
                    <p className="text-sm font-semibold">Coaching Insights</p>
                  </div>
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
                
                {generationError && <p className="text-xs text-amber-700 mb-3">{generationError}</p>}
                
                {isGenerating ? (
                  <div className="flex items-center justify-center gap-3 py-8">
                    <LoaderCircle className="w-5 h-5 animate-spin text-calm-600" />
                    <p className="text-sm text-slate-600">Generating coaching insights...</p>
                  </div>
                ) : coachingInsight?.scenarios && coachingInsight.scenarios.length > 0 ? (
                  <div className="space-y-5">
                    {coachingInsight.scenarios.map((scenario, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="border border-calm-200 rounded-xl p-4 bg-white/50"
                      >
                        <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                          {scenario.type === 'likely' && '📊'}
                          {scenario.type === 'challenging' && '😰'}
                          {scenario.type === 'best' && '💚'}
                          <span>{scenario.title}</span>
                        </h4>
                        
                        <div className="space-y-2 text-sm">
                          <div>
                            <p className="font-medium text-slate-700 text-xs uppercase tracking-wide mb-1">Their Response</p>
                            <p className="text-slate-600 italic">"{scenario.theirResponse}"</p>
                          </div>
                          
                          <div>
                            <p className="font-medium text-slate-700 text-xs uppercase tracking-wide mb-1">Why</p>
                            <p className="text-slate-600">{scenario.whyThisReaction}</p>
                          </div>
                          
                          <div>
                            <p className="font-medium text-slate-700 text-xs uppercase tracking-wide mb-1">Your Best Reply</p>
                            <p className="text-slate-600 bg-calm-50/50 p-2 rounded border-l-2 border-calm-400">"{scenario.yourBestReply}"</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-600">Unable to generate coaching insights. Please try again.</p>
                )}
              </div>
            </div>
          )}

          {!isCallMode && (
            <>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCopy}
                className="w-full flex items-center justify-center gap-3 py-4 px-5 rounded-2xl bg-white text-slate-700 font-medium shadow-soft border border-slate-200 hover:shadow-lg transition-shadow"
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
            </>
          )}

          {isCallMode && (
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
          )}

          {!isCallMode && (
            <div className="rounded-2xl border border-calm-200/70 bg-gradient-to-br from-calm-50/80 to-white/95 p-4 text-left shadow-soft">
              <div className="mb-2 flex items-center gap-2 text-calm-700">
                <Sparkles className="w-4 h-4" />
                <p className="text-xs font-semibold uppercase tracking-[0.08em]">Positive Note</p>
              </div>
              {isLoadingGuidance ? (
                <div className="flex items-center gap-2 text-slate-600">
                  <LoaderCircle className="w-4 h-4 animate-spin" />
                  <p className="text-sm">Loading personalized note...</p>
                </div>
              ) : (
                <p className="text-sm leading-relaxed font-medium text-slate-600">{guidance.positiveNote}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={onBackToSponsorKit}
              className="w-full flex items-center justify-center py-4 rounded-2xl glass-card text-calm-700 font-medium hover:bg-white/80 transition-all"
            >
              <ArrowLeft className="w-5 h-5 shrink-0" />
            </motion.button>
            <motion.button
              type="button"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={onNewMessage}
              className="w-full py-4 px-4 rounded-2xl bg-gradient-primary text-white font-medium shadow-soft border border-white/20 hover:shadow-lg transition-shadow"
            >
              New Message
            </motion.button>
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
