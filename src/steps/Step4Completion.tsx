import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Copy, Edit2, LoaderCircle, MessageCircle, Phone, Share2, Shield, Sparkles, Check, X } from 'lucide-react'
import type { FormState } from '../App'
import { generateMessageFromForm, getDefaultMessage } from '../lib/messageGenerator'

type Step4CompletionProps = {
  form: FormState
  isGuest: boolean
  updateForm: (u: Partial<FormState>) => void
  onLogCopy: () => void
  onLogShare: () => void
}

export default function Step4Completion({ form, isGuest, updateForm, onLogCopy, onLogShare }: Step4CompletionProps) {
  const [copied, setCopied] = useState(false)
  const [generatedMessage, setGeneratedMessage] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editedMessage, setEditedMessage] = useState('')
  const communicationLabel = form.communicationPreference === 'call' ? 'Call' : 'Text'
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
    // Generate once on page load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
            {generationError && (
              <p className="text-xs text-amber-700 mb-2">{generationError}</p>
            )}
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
