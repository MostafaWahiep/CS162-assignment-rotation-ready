import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Spinner } from "@/shared/components/ui/spinner"
import { useLogin } from "../hooks/useLogin"
import { useLoginVerification } from "../hooks/useLoginVerification"
import "../../../shared/styles/localeTransitions.css"

export default function LoginPage() {
  const [isWaitingForOtp, setIsWaitingForOtp] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [currentLocale, setCurrentLocale] = useState('usa')
  const login = useLogin()
  const verification = useLoginVerification(login.email)

  useEffect(() => {
    const locales = ['usa', 'china', 'korea', 'argentina', 'india', 'germany']
    let index = 0

    const cycleLocales = () => {
      index = (index + 1) % locales.length
      setCurrentLocale(locales[index])
      setTimeout(cycleLocales, 8000)
    }

    const timer = setTimeout(cycleLocales, 8000)
    return () => clearTimeout(timer)
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    const result = await login.handleSubmit()
    if (result.success) {
      setIsWaitingForOtp(true)
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    await verification.handleSubmit()
  }

  const handleBackToLogin = () => {
    setIsWaitingForOtp(false)
    setResendCooldown(0)
    verification.reset()
  }

  const handleResendWithCooldown = async () => {
    await verification.handleResendCode()
    setResendCooldown(60)
    
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const getLocaleClass = () => {
    const classMap = {
      usa: 'show-photo',
      china: 'transition-green',
      korea: 'transition-korea',
      argentina: 'transition-argentina',
      india: 'transition-india',
      germany: 'transition-germany'
    }
    return classMap[currentLocale] || 'show-photo'
  }

  const getLocaleText = () => {
    const textMap = {
      usa: 'Welcome',
      china: '欢迎',
      korea: '어서 오세요',
      argentina: 'Bienvenido',
      india: 'స్వాగతం',
      germany: 'Willkommen'
    }
    return textMap[currentLocale] || 'Welcome'
  }

  const getLocaleColor = () => {
    const colorMap = {
      usa: '#cc0000',
      china: '#2c6e49',
      korea: '#da627d',
      argentina: '#d9a300',
      india: '#ff9505',
      germany: '#007ea7'
    }
    return colorMap[currentLocale] || '#cc0000'
  }

  const shouldSplitLetters = () => {
    return currentLocale !== 'india'
  }

  return (
    <>
      <div className={`locale-container min-h-screen w-full relative flex items-center justify-center ${getLocaleClass()}`}>
        <div className={`locale-overlay absolute inset-0 ${getLocaleClass()}`}></div>

        <div className="relative z-10 flex flex-col items-center justify-center w-full px-6 sm:px-12">
          <h1 className="text-white text-6xl sm:text-8xl md:text-9xl font-extrabold leading-tight" style={{fontFamily: 'Fraunces, serif', letterSpacing: '0.01em'}}>
            {shouldSplitLetters() ? (
              getLocaleText().split('').map((letter, index) => (
                <span key={index} className={`letter letter-${index}`}>
                  {letter}
                </span>
              ))
            ) : (
              <span className="letter letter-0" style={{fontFeatureSettings: '"liga" on, "kern" on'}}>{getLocaleText()}</span>
            )}
          </h1>

          {login.errors.submit && (
            <div className="mt-4 text-sm text-white">{login.errors.submit}</div>
          )}
          
          {!isWaitingForOtp ? (
            <form onSubmit={handleLogin} className="fade-in mt-8 w-full max-w-2xl flex flex-col items-center gap-4">
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={login.email}
                onChange={(e) => login.handleChange(e.target.value)}
                disabled={login.isLoading}
                required
                className="w-full bg-white rounded-full px-8 py-3 text-gray-800 text-lg text-center shadow-lg"
                autoComplete="email"
              />
              {login.errors.email && (
                <div className="mt-2 text-sm text-white">{login.errors.email}</div>
              )}
              <div className="flex items-center justify-between w-full gap-4 mt-2">
                <div className="text-white text-sm font-medium whitespace-nowrap">
                  Don't have an account? <Link to="/signup" className="underline hover:opacity-80 transition">Sign up</Link>
                </div>
                <Button 
                  type="submit" 
                  className="rounded-full px-8 py-3 bg-white font-semibold shadow-lg whitespace-nowrap transition-all" 
                  style={{color: getLocaleColor()}} 
                  onMouseEnter={(e) => { if (!login.isLoading) { e.currentTarget.style.backgroundColor = getLocaleColor(); e.currentTarget.style.color = 'white'; } }}
                  onMouseLeave={(e) => { if (!login.isLoading) { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.color = getLocaleColor(); } }}
                  disabled={login.isLoading}
                >
                  {login.isLoading ? <Spinner className="mr-2" /> : 'Sign In'}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="fade-in mt-8 w-full max-w-md flex flex-col items-center">
              <Input
                id="verification-code"
                type="text"
                placeholder="ABC123"
                value={verification.verificationCode}
                onChange={(e) => verification.handleVerificationCodeChange(e.target.value)}
                disabled={verification.isLoading}
                required
                maxLength={6}
                className="mx-auto block w-full bg-white rounded-full px-8 py-4 text-gray-800 text-lg tracking-widest text-center font-mono uppercase shadow-lg"
                autoComplete="off"
              />
              {verification.errors.submit && (
                <div className="mt-2 text-sm text-white">{verification.errors.submit}</div>
              )}
              <div className="mt-4 w-full flex flex-col space-y-3">
                <Button 
                  type="submit" 
                  className="rounded-full px-6 py-3 bg-white font-semibold shadow-lg transition-all" 
                  style={{color: getLocaleColor()}} 
                  onMouseEnter={(e) => { if (!verification.isLoading && verification.verificationCode.length === 6) { e.currentTarget.style.backgroundColor = getLocaleColor(); e.currentTarget.style.color = 'white'; } }}
                  onMouseLeave={(e) => { if (!verification.isLoading && verification.verificationCode.length === 6) { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.color = getLocaleColor(); } }}
                  disabled={verification.isLoading || verification.verificationCode.length !== 6}
                >
                  {verification.isLoading ? <Spinner className="mr-2" /> : 'Verify'}
                </Button>
                <div className="flex gap-3">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      className="flex-1 rounded-full bg-white text-sm font-semibold transition-all" 
                      style={{color: getLocaleColor()}} 
                      onMouseEnter={(e) => { if (!verification.isResending && !verification.isLoading && resendCooldown === 0) { e.currentTarget.style.backgroundColor = getLocaleColor(); e.currentTarget.style.color = 'white'; } }}
                      onMouseLeave={(e) => { if (!verification.isResending && !verification.isLoading && resendCooldown === 0) { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.color = getLocaleColor(); } }}
                      onClick={handleResendWithCooldown} 
                      disabled={verification.isResending || verification.isLoading || resendCooldown > 0}
                    >
                    {verification.isResending ? <Spinner className="mr-2" /> : (resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code')}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1 rounded-full bg-white text-sm font-semibold transition-all" 
                    style={{color: getLocaleColor()}} 
                    onMouseEnter={(e) => { if (!verification.isLoading) { e.currentTarget.style.backgroundColor = getLocaleColor(); e.currentTarget.style.color = 'white'; } }}
                    onMouseLeave={(e) => { if (!verification.isLoading) { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.color = getLocaleColor(); } }}
                    onClick={handleBackToLogin} 
                    disabled={verification.isLoading}
                  >
                    Back
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  )
}