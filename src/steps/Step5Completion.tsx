import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, CheckCircle2, Copy, Lightbulb, LoaderCircle, MessageCircle, Phone, Shield, Sparkles } from 'lucide-react'
import type { FormState } from '../App'
import { generateMessageAndStyleFromForm, generateGuidanceFromForm, generateCoachingInsightFromForm, generateCallScriptFromForm, getDefaultMessage, type AttachmentGuidance, type CoachingInsight } from '../lib/messageGenerator'

const FALLBACK_GUIDANCE: AttachmentGuidance = {
  attachmentStyle: 'secure',
  tip: "Keep the message clear, non-blaming, and focused on shared health.",
  positiveNote: "You're taking a positive step. Being open about sexual health builds trust.",
} 

const SPONSOR_KIT_VOUCHER_PARAGRAPH =
  "I've included a free testing voucher through DX Your Way. To use it safely: download the official DX Your Way app from your app store and enter code [REFERENCE_CODE]. This is legitimate - you can verify by searching 'DX Your Way' in your app store first. No one will ask for passwords or personal info via text."

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
  const [generatedMessages, setGeneratedMessages] = useState<string[]>([])
  const [editableMessages, setEditableMessages] = useState<string[]>([])
  const [selectedMessageIndex, setSelectedMessageIndex] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState('')
  const [guidance, setGuidance] = useState<AttachmentGuidance>(FALLBACK_GUIDANCE)
  const [coachingInsight, setCoachingInsight] = useState<CoachingInsight | null>(null)
  const [isLoadingGuidance, setIsLoadingGuidance] = useState(false)
  const isCallMode = form.communicationPreference === 'call'
  const [callFlowStage, setCallFlowStage] = useState<'questionnaire' | 'insights'>(
    isCallMode ? 'questionnaire' : 'insights'
  )
  const [callFeelingInput, setCallFeelingInput] = useState(form.callConversationFeeling || '')
  const [callFearInput, setCallFearInput] = useState(form.callReactionFears || '')
  const [recommendedScript, setRecommendedScript] = useState<string | null>(null)
  const scriptTextareaRef = useRef<HTMLTextAreaElement>(null)
  const shouldAppendVoucherParagraph = !isCallMode && form.sponsorKit

  // Auto-resize script textarea so full content is visible without scrolling
  useEffect(() => {
    const el = scriptTextareaRef.current
    if (!el || recommendedScript == null) return
    el.style.height = 'auto'
    el.style.height = `${Math.max(200, el.scrollHeight)}px`
  }, [recommendedScript])

  const appendVoucherParagraphIfNeeded = (message: string): string => {
    const base = message.trim()
    if (!shouldAppendVoucherParagraph) return base
    if (base.includes(SPONSOR_KIT_VOUCHER_PARAGRAPH)) return base
    return `${base}\n\n${SPONSOR_KIT_VOUCHER_PARAGRAPH}`
  }

  const fallbackMessage = form.messageText.trim() || getDefaultMessage(form)
  const messageToShare = editableMessages[selectedMessageIndex] || fallbackMessage

  const buildVariantContext = (baseForm: FormState, styleInstruction: string, slot: number): FormState => {
    const existingContext = baseForm.additionalMessage.trim()
    const diversityContext = [
      existingContext,
      `Variant goal ${slot}: ${styleInstruction}`,
      'Use a clearly different wording and sentence structure from other options while preserving facts.',
    ]
      .filter(Boolean)
      .join('\n')

    return {
      ...baseForm,
      additionalMessage: diversityContext,
    }
  }

  const normalizeForComparison = (message: string) =>
    message
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length > 2)

  const areMessagesTooSimilar = (a: string, b: string) => {
    const aTokens = new Set(normalizeForComparison(a))
    const bTokens = new Set(normalizeForComparison(b))
    if (aTokens.size === 0 || bTokens.size === 0) return false
    const overlap = [...aTokens].filter((token) => bTokens.has(token)).length
    const similarity = overlap / Math.min(aTokens.size, bTokens.size)
    return similarity >= 0.8
  }

  const generateThreeMessages = async (): Promise<{ messages: string[]; attachmentStyle: string }> => {
    const variantInstructions = [
      'Balanced and neutral: calm, collaborative, and straightforward.',
      'Concise and direct: fewer words, fact-first, respectful and clear.',
      'Warm and reassuring: emotionally supportive with gentle tone.',
    ]

    const seed = await generateMessageAndStyleFromForm(buildVariantContext(form, variantInstructions[0], 1))
    const attachmentStyle = seed.attachmentStyle

    const baseFormWithStyle: FormState = {
      ...form,
      attachmentStyle: attachmentStyle as FormState['attachmentStyle'],
    }

    const initialMessages = [seed.message.trim()]
    const remaining = await Promise.all(
      variantInstructions.slice(1).map(async (instruction, index) => {
        const result = await generateMessageAndStyleFromForm(
          buildVariantContext(baseFormWithStyle, instruction, index + 2)
        )
        return result.message.trim()
      })
    )

    const messages = [...initialMessages, ...remaining]

    for (let i = 0; i < messages.length; i += 1) {
      for (let j = i + 1; j < messages.length; j += 1) {
        if (!areMessagesTooSimilar(messages[i], messages[j])) continue
        const retryInstruction = `${variantInstructions[j]} Make this option significantly different in cadence, opening phrase, and wording.`
        const retry = await generateMessageAndStyleFromForm(
          buildVariantContext(baseFormWithStyle, retryInstruction, j + 1)
        )
        messages[j] = retry.message.trim()
      }
    }

    return { messages, attachmentStyle }
  }

  const runGeneration = async (formOverride?: FormState) => {
    const sourceForm = formOverride ?? form
    setIsGenerating(true)
    setGenerationError('')
    try {
      if (isCallMode) {
        // For call mode, generate recommended script and coaching insights
        const [script, insight] = await Promise.all([
          generateCallScriptFromForm(sourceForm),
          generateCoachingInsightFromForm(sourceForm),
        ])
        setRecommendedScript(script)
        console.log('Generated coaching insight:', insight)
        setCoachingInsight(insight)
        // Update form with determined attachment style
        updateForm({ attachmentStyle: insight.attachmentStyle as FormState['attachmentStyle'] })
      } else {
        // For text mode, generate three message options and guidance
        const result = await generateThreeMessages()
        setGeneratedMessages(result.messages)
        setEditableMessages(result.messages.map((message) => appendVoucherParagraphIfNeeded(message)))
        setSelectedMessageIndex(0)
        
        // Update form with determined attachment style
        updateForm({ attachmentStyle: result.attachmentStyle as FormState['attachmentStyle'] })
        
      }
    } catch (error) {
      console.error('Generation error:', error)
      setGeneratedMessages([])
      setEditableMessages([])
      setRecommendedScript(null)
      const details = error instanceof Error ? error.message : 'Unknown error'
      setGenerationError(`Could not generate content. ${details}`)
      // Try to load guidance with fallback message for text mode
      if (!isCallMode) {
        await loadGuidance(sourceForm.messageText.trim() || getDefaultMessage(sourceForm), sourceForm.attachmentStyle || 'secure')
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
    if (isCallMode) return
    void runGeneration()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCallMode])

  useEffect(() => {
    if (isCallMode || generatedMessages.length === 0) return
    const selectedMessage = generatedMessages[selectedMessageIndex] || generatedMessages[0]
    void loadGuidance(selectedMessage, form.attachmentStyle || 'secure')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generatedMessages, selectedMessageIndex, isCallMode, form.attachmentStyle])

  const handleCallQuestionnaireContinue = async () => {
    const trimmedFeeling = callFeelingInput.trim()
    const trimmedFears = callFearInput.trim()
    if (isGenerating) return

    const updates: Partial<FormState> = {
      callConversationFeeling: trimmedFeeling,
      callReactionFears: trimmedFears,
    }
    const formForGeneration: FormState = {
      ...form,
      ...updates,
      callConversationFeeling: trimmedFeeling,
      callReactionFears: trimmedFears,
    }

    updateForm(updates)
    setCallFlowStage('insights')
    setCoachingInsight(null)
    setRecommendedScript(null)
    await runGeneration(formForGeneration)
  }

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
          <h2 className="text-2xl font-bold tracking-tight text-calm-900">
            {isCallMode && callFlowStage === 'questionnaire' ? 'Quick check-in (optional)' : "You're all set!"}
          </h2>
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
              <div className="mb-2">
                <p className="text-xs font-medium text-slate-500">Choose your final message</p>
              </div>
              {generationError && <p className="text-xs text-amber-700 mb-2">{generationError}</p>}
              {isGenerating ? (
                <div className="flex items-center gap-2 text-sm text-slate-500 py-3">
                  <LoaderCircle className="w-4 h-4 animate-spin" />
                  <span>Generating 3 message options...</span>
                </div>
              ) : generatedMessages.length > 0 ? (
                <div className="space-y-3">
                  {editableMessages.map((message, index) => {
                    const isSelected = selectedMessageIndex === index
                    const preview = message.length > 260 ? `${message.slice(0, 260)}…` : message
                    return (
                      <div
                        key={`option-${index}`}
                        className={`w-full rounded-xl border p-3 text-left transition-all ${
                          isSelected
                            ? 'border-calm-400 bg-calm-50/80'
                            : 'border-slate-200 bg-white/70'
                        }`}
                      >
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Option {index + 1}</p>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-calm-600" />}
                        </div>
                        {isSelected ? (
                          <textarea
                            value={message}
                            onChange={(event) =>
                              setEditableMessages((prev) =>
                                prev.map((draft, draftIndex) =>
                                  draftIndex === index ? event.target.value : draft
                                )
                              )
                            }
                            className="w-full min-h-[180px] rounded-lg border border-calm-300/70 bg-white/90 px-3 py-2 text-sm text-slate-700 whitespace-pre-wrap resize-y focus:border-calm-500 focus:ring-2 focus:ring-calm-300/70 outline-none transition-all"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSelectedMessageIndex(index)}
                            className="w-full text-left"
                          >
                            <p className="text-sm text-slate-700 whitespace-pre-wrap">{preview}</p>
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{fallbackMessage}</p>
              )}
            </div>
          )}

          {isCallMode && callFlowStage === 'questionnaire' && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-white/70 backdrop-blur p-5 border border-white/60 shadow-soft">
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">How are you feeling about this conversation?</span>
                    <textarea
                      value={callFeelingInput}
                      onChange={(event) => setCallFeelingInput(event.target.value)}
                      placeholder="Short answer..."
                      className="mt-2 w-full min-h-[96px] rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-700 resize-y focus:border-calm-500 focus:ring-2 focus:ring-calm-300/70 outline-none transition-all"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">What reactions do you anticipate or fear the most?</span>
                    <textarea
                      value={callFearInput}
                      onChange={(event) => setCallFearInput(event.target.value)}
                      placeholder="Short answer..."
                      className="mt-2 w-full min-h-[96px] rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-700 resize-y focus:border-calm-500 focus:ring-2 focus:ring-calm-300/70 outline-none transition-all"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {isCallMode && callFlowStage === 'insights' && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-white/80 backdrop-blur p-5 border border-calm-200/70 shadow-soft">
                <div className="mb-3">
                  <div className="flex items-center gap-2 text-calm-700">
                    <MessageCircle className="w-5 h-5" />
                    <p className="text-sm font-semibold">Recommended Script</p>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Use this as a starting point for your call. You can adjust the words so they sound like you.
                  </p>
                </div>

                {generationError && !recommendedScript && (
                  <p className="text-xs text-amber-700 mb-2">{generationError}</p>
                )}

                {isGenerating && !recommendedScript ? (
                  <div className="flex items-center justify-center gap-3 py-6">
                    <LoaderCircle className="w-5 h-5 animate-spin text-calm-600" />
                    <p className="text-sm text-slate-600">Generating your call script...</p>
                  </div>
                ) : recommendedScript ? (
                  <textarea
                    ref={scriptTextareaRef}
                    value={recommendedScript}
                    onChange={(event) => setRecommendedScript(event.target.value)}
                    rows={8}
                    className="w-full min-h-[200px] rounded-xl border border-calm-300/70 bg-white/90 px-3 py-2 text-sm text-slate-700 whitespace-pre-wrap resize-none overflow-hidden focus:border-calm-500 focus:ring-2 focus:ring-calm-300/70 outline-none transition-all"
                  />
                ) : (
                  <p className="text-sm text-slate-600">
                    Unable to generate a script right now. Please try again in a moment.
                  </p>
                )}
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-calm-50/80 to-white/95 p-6 border border-calm-200/70 shadow-soft">
                <div className="mb-4">
                  <div className="flex items-center gap-2 text-calm-700">
                    <Sparkles className="w-5 h-5" />
                    <p className="text-sm font-semibold">Coaching Insights</p>
                  </div>
                </div>

                {recommendedScript && (
                  <div className="mb-5 rounded-xl border border-calm-200 bg-white/80 p-4 min-h-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Your full script</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed break-words">{recommendedScript}</p>
                  </div>
                )}
                
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
                {copied ? 'Copied!' : 'Copy selected message'}
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

          {isCallMode && callFlowStage === 'insights' && (
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

          {isCallMode && callFlowStage === 'questionnaire' ? (
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
                onClick={() => void handleCallQuestionnaireContinue()}
                disabled={isGenerating}
                className="w-full flex items-center justify-center py-4 rounded-2xl bg-gradient-primary text-white font-medium shadow-soft border border-white/20 hover:shadow-lg transition-shadow disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isGenerating ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5 shrink-0" />}
              </motion.button>
            </div>
          ) : (
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
                You continued as a guest. We don't store your data permanently. This session is for your use only.
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
