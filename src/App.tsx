import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { initFirebase, signInAsGuest } from './lib/firebase'
import { logProgress } from './lib/logging'
import Step1Auth from './steps/Step1Auth'
import Step2MessageEditor from './steps/Step2MessageEditor'
import Step5Completion from './steps/Step5Completion'

export type FormState = {
  step: 1 | 2 | 3 | 4 | 5
  isGuest: boolean
  userId: string | null
  partnerName: string
  partnerRelationship: '' | 'current_partner' | 'previous_partner' | 'future_partner'
  communicationPreference: '' | 'text' | 'call'
  testResults: string[]
  attachmentStyle: '' | 'secure' | 'anxious' | 'avoidant' | 'disorganized'
  lastInteractionFiles: File[]
  additionalMessage: string
  messageText: string
  sponsorKit: boolean
}

const initialFormState: FormState = {
  step: 1,
  isGuest: false,
  userId: null,
  partnerName: '',
  partnerRelationship: '',
  communicationPreference: 'text',
  testResults: [],
  attachmentStyle: '',
  lastInteractionFiles: [],
  additionalMessage: '',
  messageText: '',
  sponsorKit: false,
}

function App() {
  const [form, setForm] = useState<FormState>(initialFormState)
  const [firebaseReady, setFirebaseReady] = useState(false)
  const [step2InitialPage, setStep2InitialPage] = useState<1 | 2 | 3 | 4 | 5>(1)

  useEffect(() => {
    const fb = initFirebase()
    setFirebaseReady(!!fb)
  }, [])

  const goToStep = (step: FormState['step']) => {
    setForm((prev) => ({ ...prev, step }))
  }

  const updateForm = (updates: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...updates }))
  }

  const handleGuestContinue = async () => {
    setStep2InitialPage(1)
    try {
      if (firebaseReady) {
        const user = await signInAsGuest()
        if (user) {
          updateForm({ isGuest: true, userId: user.uid, step: 2 })
          logProgress(user.uid, 'step_1_guest')
        } else {
          updateForm({ isGuest: true, step: 2 })
        }
      } else {
        updateForm({ isGuest: true, step: 2 })
      }
    } catch {
      // Anonymous sign-in may be disabled or fail; continue as guest without userId
      updateForm({ isGuest: true, step: 2 })
    }
  }

  const handleSignInSuccess = (userId: string) => {
    setStep2InitialPage(1)
    updateForm({ isGuest: false, userId, step: 2 })
    logProgress(userId, 'step_1_signin')
  }

  const handleBackToSponsorKit = () => {
    setStep2InitialPage(5)
    goToStep(2)
  }

  const handleNewMessage = () => {
    setStep2InitialPage(1)
    setForm((prev) => ({
      ...prev,
      step: 2,
      partnerName: '',
      partnerRelationship: '',
      communicationPreference: 'text',
      testResults: [],
      attachmentStyle: '',
      lastInteractionFiles: [],
      additionalMessage: '',
      messageText: '',
      sponsorKit: false,
    }))
  }

  return (
    <div className="min-h-screen app-bg">
      <AnimatePresence mode="sync">
        {form.step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Step1Auth
              onGuestContinue={handleGuestContinue}
              onSignInSuccess={handleSignInSuccess}
              firebaseReady={firebaseReady}
            />
          </motion.div>
        )}
        {form.step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 1, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 1, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Step2MessageEditor
              form={form}
              updateForm={updateForm}
              initialPage={step2InitialPage}
              onNext={() => {
                setStep2InitialPage(1)
                logProgress(form.userId, 'step_5_complete')
                goToStep(5)
              }}
              onBack={() => goToStep(1)}
            />
          </motion.div>
        )}
        {form.step === 5 && (
          <motion.div
            key="step5"
            initial={{ opacity: 1, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Step5Completion
              form={form}
              updateForm={updateForm}
              isGuest={form.isGuest}
              onLogCopy={() => logProgress(form.userId, 'step_5_copy')}
              onLogShare={() => logProgress(form.userId, 'step_5_share')}
              onBackToSponsorKit={handleBackToSponsorKit}
              onNewMessage={handleNewMessage}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
