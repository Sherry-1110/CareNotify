import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, LogIn, User, ArrowLeft, Mail, Lock } from 'lucide-react'
import { signInWithEmail, signUpWithEmail } from '../lib/firebase'

type Step1AuthProps = {
  onGuestContinue: () => void
  onSignInSuccess: (userId: string) => void
  firebaseReady: boolean
}

export default function Step1Auth({ onGuestContinue, onSignInSuccess, firebaseReady }: Step1AuthProps) {
  const [showAuthForm, setShowAuthForm] = useState(false)
  const [isSignUp, setIsSignUp] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = isSignUp
        ? await signUpWithEmail(email, password)
        : await signInWithEmail(email, password)
      if (user) onSignInSuccess(user.uid)
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'message' in err
        ? String((err as { message: string }).message)
        : 'Something went wrong. Try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm glass-dark rounded-3xl p-8 sm:p-10 flex flex-col items-center text-center"
      >
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-calm-400/90 to-calm-600 flex items-center justify-center mb-6 shadow-soft border border-white/30">
          <Heart className="w-8 h-8 text-white" strokeWidth={1.8} />
        </div>
        <h1 className="text-2xl font-semibold text-slate-800 mb-2">CareNotify</h1>
        <p className="text-slate-600 text-base leading-relaxed mb-10">
          Notify with care. We help you share health information in a supportive way.
        </p>

        <AnimatePresence mode="wait">
          {!showAuthForm ? (
            <motion.div
              key="buttons"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full space-y-4"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => firebaseReady && setShowAuthForm(true)}
                disabled={!firebaseReady}
                className="w-full flex items-center justify-center gap-3 py-4 px-5 rounded-2xl bg-gradient-primary text-white font-medium shadow-soft border border-white/20 disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-lg transition-shadow"
              >
                <LogIn className="w-5 h-5" />
                Sign up / Login
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onGuestContinue}
                className="w-full flex items-center justify-center gap-3 py-4 px-5 rounded-2xl glass-card text-calm-700 font-medium hover:bg-white/80 transition-all"
              >
                <User className="w-5 h-5" />
                Continue as Guest
              </motion.button>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onSubmit={handleSubmit}
              className="w-full space-y-4 text-left"
            >
              <button
                type="button"
                onClick={() => setShowAuthForm(false)}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <div className="flex gap-2 p-1.5 rounded-xl bg-white/50 backdrop-blur border border-white/50">
                <button
                  type="button"
                  onClick={() => setIsSignUp(true)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${isSignUp ? 'bg-white/90 text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-700'}`}
                >
                  Sign up
                </button>
                <button
                  type="button"
                  onClick={() => setIsSignUp(false)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${!isSignUp ? 'bg-white/90 text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-700'}`}
                >
                  Sign in
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/60 backdrop-blur border border-white/60 focus:border-calm-400 focus:ring-2 focus:ring-calm-200/50 outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/60 backdrop-blur border border-white/60 focus:border-calm-400 focus:ring-2 focus:ring-calm-200/50 outline-none transition-all"
                  />
                </div>
              </div>
              {error && (
                <p className="text-sm text-red-600 bg-red-50/80 backdrop-blur rounded-xl px-3 py-2 border border-red-200/50">{error}</p>
              )}
              <motion.button
                type="submit"
                disabled={loading}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-primary text-white font-medium shadow-soft border border-white/20 disabled:opacity-70 hover:shadow-lg transition-shadow"
              >
                {loading ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>

        {!showAuthForm && (
          <p className="mt-8 text-sm text-slate-500">
            Guest mode: no account needed. Your privacy is respected.
          </p>
        )}
      </motion.div>
    </div>
  )
}
