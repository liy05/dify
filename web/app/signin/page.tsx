'use client'
import { useSearchParams } from 'next/navigation'
import OneMoreStep from './oneMoreStep'
import NormalForm from './normalForm'
import PhoneAndCodeAuth from './components/phone-and-code-auth'

const SignIn = () => {
  const searchParams = useSearchParams()
  const step = searchParams.get('step')
  const authType = searchParams.get('auth_type')

  if (step === 'next')
    return <OneMoreStep />
  if (authType === 'phone')
    return <PhoneAndCodeAuth isInvite={!!searchParams.get('invite_token')} />
  return <NormalForm />
}

export default SignIn
