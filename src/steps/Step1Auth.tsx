import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogIn, User, Mail, Lock, X, UserCircle, Phone } from 'lucide-react'
import { signInWithEmail, signUpWithProfile, signInWithGoogle } from '../lib/firebase'
import logoImage from '../../logo.jpg'

type Step1AuthProps = {
  onGuestContinue: () => void
  onSignInSuccess: (userId: string) => void
  firebaseReady: boolean
}

export default function Step1Auth({ onGuestContinue, onSignInSuccess, firebaseReady }: Step1AuthProps) {
  const [showAuthForm, setShowAuthForm] = useState(false)
  const [isSignUp, setIsSignUp] = useState(true)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState<'google' | null>(null)

  const closeAuthModal = () => {
    setShowAuthForm(false)
    setSocialLoading(null)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isSignUp) {
        const user = await signUpWithProfile(email, password, name.trim() || undefined, phone.trim() || undefined)
        if (user) onSignInSuccess(user.uid)
      } else {
        const user = await signInWithEmail(email, password)
        if (user) onSignInSuccess(user.uid)
      }
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'message' in err
        ? String((err as { message: string }).message)
        : 'Something went wrong. Try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setSocialLoading('google')
    try {
      const user = await signInWithGoogle()
      if (user) onSignInSuccess(user.uid)
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'message' in err
        ? String((err as { message: string }).message)
        : 'Sign in with Google failed.'
      setError(message)
    } finally {
      setSocialLoading(null)
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
        <div className="w-20 h-20 rounded-3xl bg-white/75 backdrop-blur flex items-center justify-center mb-6 shadow-soft border border-white/70">
          <img
            src={logoImage}
            alt="CareNotify logo"
            className="w-[4.5rem] h-[4.5rem] object-cover rounded-2xl translate-y-1"
          />
        </div>
        <h1 className="text-2xl font-semibold mb-2">
          <span className="text-[#2D6BA5]">Care</span>
          <span className="text-[#4FB39B]">Notify</span>
        </h1>
        <p className="text-slate-600 text-base leading-relaxed mb-10">
          Notify with care. We help you share health information in a supportive way.
        </p>

        <div className="w-full space-y-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAuthForm(true)}
            className="w-full flex items-center justify-center gap-3 py-4 px-5 rounded-2xl bg-gradient-primary text-white font-medium shadow-soft border border-white/20 hover:shadow-lg transition-shadow"
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
        </div>

        <p className="mt-8 text-sm text-slate-500">
          Guest mode: no account needed. Your privacy is respected.
        </p>
      </motion.div>

      {/* 注册/登录弹窗 */}
      <AnimatePresence>
        {showAuthForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              onClick={closeAuthModal}
              aria-hidden
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div
                className="w-full max-w-sm glass-dark rounded-3xl p-6 sm:p-8 text-left pointer-events-auto shadow-glass-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-slate-800">Sign up / Login</h2>
                  <button
                    type="button"
                    onClick={closeAuthModal}
                    className="p-2 rounded-xl text-slate-500 hover:bg-white/50 hover:text-slate-700 transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {!firebaseReady ? (
                  <p className="text-sm text-slate-600">
                    Sign up / login needs Firebase. Copy <code className="bg-white/60 px-1 rounded">.env.example</code> to <code className="bg-white/60 px-1 rounded">.env</code> and add your Firebase keys (see Firebase Console → project settings).
                  </p>
                ) : (
                <div className="space-y-4">
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

                  <motion.form onSubmit={handleSubmit} className="space-y-3">
                    {isSignUp && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                          <div className="relative">
                            <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                              type="text"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder="Your name"
                              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/60 backdrop-blur border border-white/60 focus:border-calm-400 focus:ring-2 focus:ring-calm-200/50 outline-none transition-all"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                              type="tel"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="+1 234 567 8900"
                              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/60 backdrop-blur border border-white/60 focus:border-calm-400 focus:ring-2 focus:ring-calm-200/50 outline-none transition-all"
                            />
                          </div>
                        </div>
                      </>
                    )}
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

                  <div className="flex items-center gap-3 py-2">
                    <div className="flex-1 border-t border-slate-200" />
                    <span className="text-sm text-slate-500 shrink-0">or continue with</span>
                    <div className="flex-1 border-t border-slate-200" />
                  </div>

                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGoogleSignIn}
                    disabled={!!socialLoading}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white/80 backdrop-blur border border-white/60 text-slate-700 font-medium hover:bg-white transition-all disabled:opacity-60"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </motion.button>
                </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
