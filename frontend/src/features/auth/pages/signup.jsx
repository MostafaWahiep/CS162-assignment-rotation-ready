import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/shared/components/ui/button"
import { Field, FieldContent, FieldDescription, FieldError, FieldLabel } from "@/shared/components/ui/field"
import { Input } from "@/shared/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select"
import { Spinner } from "@/shared/components/ui/spinner"
import { useSignup } from "../hooks/useSignup"
import { useVerification } from "../hooks/useVerification"
import { getCities } from "@/api/cities"
import "@/shared/styles/locale-theme.css"

export default function SignupPage() {
  const [isWaitingForOtp, setIsWaitingForOtp] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [currentLocale, setCurrentLocale] = useState('usa')
  const [rotationCities, setRotationCities] = useState([])
  const [citiesLoading, setCitiesLoading] = useState(true)
  const [citiesError, setCitiesError] = useState("")
  const signup = useSignup()
  const verification = useVerification(signup.formData.email)

  const localeMap = {
    'san francisco': 'usa',
    'taipei': 'china',
    'seoul': 'korea',
    'buenos aires': 'argentina',
    'hyderabad': 'india',
    'berlin': 'germany'
  }

  const handleCityChange = (value) => {
    signup.handleChange("cityId", value)
    const selectedCity = rotationCities.find(c => String(c.city_id) === value)
    if (selectedCity) {
      const cityName = selectedCity.name?.toLowerCase() || ''
      const newLocale = localeMap[cityName] || 'usa'
      setCurrentLocale(newLocale)
    }
  }

  useEffect(() => {
    const loadCities = async () => {
      try {
        const cities = await getCities()
        setRotationCities(cities)
        // Default to San Francisco
        const sfCity = cities.find(c => c.name?.toLowerCase() === 'san francisco')
        if (sfCity) {
          signup.handleChange("cityId", String(sfCity.city_id))
          setCurrentLocale('usa')
        } else if (cities.length > 0) {
          signup.handleChange("cityId", String(cities[0].city_id))
        }
      } catch (error) {
        console.error('Failed to fetch cities:', error)
        setRotationCities([])
        setCitiesError("Failed to load rotation cities from server")
      } finally {
        setCitiesLoading(false)
      }
    }
    loadCities()
  }, [])


  const handleRegister = async (e) => {
    e.preventDefault()
    const result = await signup.handleSubmit()
    if (result.success) {
      setIsWaitingForOtp(true)
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    await verification.handleSubmit()
  }

  const handleBackToRegistration = () => {
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

  const shouldSplitLetters = () => {
    return currentLocale !== 'india'
  }

  return (
    <div className={`locale-container min-h-screen w-full relative flex items-center justify-center ${getLocaleClass()}`}>
        <div className={`locale-overlay absolute inset-0 ${getLocaleClass()}`}></div>

        <div className="relative z-10 flex flex-col items-center justify-center w-full px-6 sm:px-12 max-w-3xl">
          <h1 className="text-white text-5xl sm:text-7xl font-extrabold leading-tight drop-shadow-md text-center mb-8" style={{fontFamily: 'Georgia, serif'}}>
            {shouldSplitLetters() ? (
              getLocaleText().split('').map((letter, index) => (
                <span key={index} className={`letter letter-${index}`}>
                  {letter}
                </span>
              ))
            ) : (
              <span className="letter letter-0">{getLocaleText()}</span>
            )}
          </h1>

          {signup.errors.submit && (
            <div className="text-sm text-white">{signup.errors.submit}</div>
          )}
          {!isWaitingForOtp ? (
            <form onSubmit={handleRegister} className="fade-in w-full flex flex-col items-center">
              <div className="w-full max-w-2xl space-y-6">
                <Field>
                  <FieldContent>
                    <FieldLabel htmlFor="firstName" className="text-lg font-semibold text-white">First Name</FieldLabel>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="John"
                      value={signup.formData.firstName}
                      onChange={(e) => signup.handleChange("firstName", e.target.value)}
                      disabled={signup.isLoading}
                      required
                      className="bg-white rounded-full px-8 py-4 text-gray-800 text-lg placeholder-gray-400 shadow-lg"
                    />
                    <FieldError errors={signup.errors.firstName ? [{ message: signup.errors.firstName }] : null} />
                  </FieldContent>
                </Field>

                <Field>
                  <FieldContent>
                    <FieldLabel htmlFor="lastName" className="text-lg font-semibold text-white">Last Name</FieldLabel>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Doe"
                      value={signup.formData.lastName}
                      onChange={(e) => signup.handleChange("lastName", e.target.value)}
                      disabled={signup.isLoading}
                      required
                      className="bg-white rounded-full px-8 py-4 text-gray-800 text-lg placeholder-gray-400 shadow-lg"
                    />
                    <FieldError errors={signup.errors.lastName ? [{ message: signup.errors.lastName }] : null} />
                  </FieldContent>
                </Field>

                <Field>
                  <FieldContent>
                    <FieldLabel htmlFor="email" className="text-lg font-semibold text-white">Email</FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={signup.formData.email}
                      onChange={(e) => signup.handleChange("email", e.target.value)}
                      disabled={signup.isLoading}
                      required
                      className="bg-white rounded-full px-8 py-4 text-gray-800 text-lg placeholder-gray-400 shadow-lg"
                    />
                    <FieldError errors={signup.errors.email ? [{ message: signup.errors.email }] : null} />
                  </FieldContent>
                </Field>

                <Field>
                  <FieldContent>
                    <FieldLabel htmlFor="city" className="text-lg font-semibold text-white">Rotation City</FieldLabel>
                    <Select value={signup.formData.cityId} onValueChange={handleCityChange}>
                      <SelectTrigger className="bg-white rounded-full px-8 py-4 text-gray-800 text-lg shadow-lg">
                        <SelectValue placeholder={citiesLoading ? "Loading cities..." : (citiesError ? citiesError : "Select a city")} />
                      </SelectTrigger>
                      <SelectContent>
                        {citiesLoading ? (
                          <div className="px-4 py-2 text-gray-500">Loading...</div>
                        ) : (
                          rotationCities.map((city) => (
                            <SelectItem key={city.city_id} value={String(city.city_id)}>
                              {city.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {citiesError && (
                      <div className="mt-2 text-sm text-white">{citiesError}</div>
                    )}
                    <FieldError errors={signup.errors.cityId ? [{ message: signup.errors.cityId }] : null} />
                  </FieldContent>
                </Field>
              </div>

              <div className="mt-8 w-full max-w-2xl flex items-center justify-between gap-6">
                <p className="text-white text-sm">
                  Already have an account? <Link to="/login" className="font-semibold underline hover:opacity-80 transition">Sign in</Link>
                </p>
                <Button 
                  type="submit" 
                  className="rounded-full px-8 py-3 bg-white font-semibold shadow-lg whitespace-nowrap transition-all" 
                  style={{color: getLocaleColor()}} 
                  onMouseEnter={(e) => { if (!signup.isLoading && !citiesLoading && rotationCities.length > 0) { e.currentTarget.style.backgroundColor = getLocaleColor(); e.currentTarget.style.color = 'white'; } }}
                  onMouseLeave={(e) => { if (!signup.isLoading && !citiesLoading && rotationCities.length > 0) { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.color = getLocaleColor(); } }}
                  disabled={signup.isLoading || citiesLoading || rotationCities.length === 0}
                >
                  {signup.isLoading ? <Spinner className="mr-2" /> : 'Sign up'}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="fade-in w-full flex flex-col items-center">
              <div className="w-full max-w-2xl space-y-6">
                <Field>
                  <FieldContent>
                    <FieldLabel htmlFor="verification-code" className="text-lg font-semibold text-white">Verification Code</FieldLabel>
                    <Input
                      id="verification-code"
                      type="text"
                      placeholder="ABC123"
                      value={verification.verificationCode}
                      onChange={(e) => verification.handleVerificationCodeChange(e.target.value)}
                      disabled={verification.isLoading}
                      required
                      maxLength={6}
                      className="bg-white rounded-full px-8 py-4 text-gray-800 text-lg text-center placeholder-gray-400 shadow-lg"
                      autoComplete="off"
                    />
                    <FieldDescription className="text-white/90">
                      Enter the 6-character code sent to {signup.formData.email}
                    </FieldDescription>
                    <FieldError errors={verification.errors.verification ? [{ message: verification.errors.verification }] : null} />
                  </FieldContent>
                </Field>

                {verification.resendMessage && (
                  <div className="text-lg text-green-200 font-medium">
                    {verification.resendMessage}
                  </div>
                )}

                {verification.errors.submit && (
                  <FieldError errors={[{ message: verification.errors.submit }]} />
                )}
              </div>

              <div className="mt-8 w-full max-w-2xl flex flex-col space-y-3">
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
                    onClick={handleBackToRegistration} 
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
  )
}
