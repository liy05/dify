import Link from 'next/link'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter, useSearchParams } from 'next/navigation'
import { useContext } from 'use-context-selector'
import Button from '@/app/components/base/button'
import Toast from '@/app/components/base/toast'
import { emailRegex } from '@/config'
import { login } from '@/service/common'
import Input from '@/app/components/base/input'
import I18NContext from '@/context/i18n'
import { noop } from 'lodash-es'

type MailAndPasswordAuthProps = {
  isInvite: boolean
  isEmailSetup: boolean
  allowRegistration: boolean
}

const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/

export default function MailAndPasswordAuth({ isInvite, isEmailSetup, allowRegistration }: MailAndPasswordAuthProps) {
  const { t } = useTranslation()
  const { locale } = useContext(I18NContext)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const emailFromLink = decodeURIComponent(searchParams.get('email') || '')
  const [email, setEmail] = useState(emailFromLink)
  const [password, setPassword] = useState('')

  const [isLoading, setIsLoading] = useState(false)
  const handleEmailPasswordLogin = async () => {
    if (!email) {
      Toast.notify({ type: 'error', message: t('login.error.emailEmpty') })
      return
    }
    if (!emailRegex.test(email)) {
      Toast.notify({
        type: 'error',
        message: t('login.error.emailInValid'),
      })
      return
    }
    if (!password?.trim()) {
      Toast.notify({ type: 'error', message: t('login.error.passwordEmpty') })
      return
    }
    if (!passwordRegex.test(password)) {
      Toast.notify({
        type: 'error',
        message: t('login.error.passwordInvalid'),
      })
      return
    }
    try {
      setIsLoading(true)
      const loginData: Record<string, any> = {
        email,
        password,
        language: locale,
        remember_me: true,
      }
      if (isInvite)
        loginData.invite_token = decodeURIComponent(searchParams.get('invite_token') as string)
      const res = await login({
        url: '/login',
        body: loginData,
      })
      if (res.result === 'success') {
        if (isInvite) {
          router.replace(`/signin/invite-settings?${searchParams.toString()}`)
        }
        else {
          localStorage.setItem('console_token', res.data.access_token)
          localStorage.setItem('refresh_token', res.data.refresh_token)
          router.replace('/home')
        }
      }
      else if (res.code === 'account_not_found') {
        if (allowRegistration) {
          const params = new URLSearchParams()
          params.append('email', encodeURIComponent(email))
          params.append('token', encodeURIComponent(res.data))
          router.replace(`/reset-password/check-code?${params.toString()}`)
        }
        else {
          Toast.notify({
            type: 'error',
            message: t('login.error.registrationNotAllowed'),
          })
        }
      }
      else {
        Toast.notify({
          type: 'error',
          message: res.data,
        })
      }
    }

    finally {
      setIsLoading(false)
    }
  }

  return <form onSubmit={noop}>
    <div className='mb-6'>
      <label htmlFor="email" className="system-md-semibold my-2 text-gray-700">
        {t('login.email')}
      </label>
      <div className="mt-2">
        <Input
          value={email}
          onChange={e => setEmail(e.target.value)}
          disabled={isInvite}
          id="email"
          type="email"
          autoComplete="email"
          placeholder={t('login.emailPlaceholder') || ''}
          tabIndex={1}
          className="w-full rounded-xl border border-gray-200 bg-white/70 px-4 py-3 backdrop-blur-sm transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>

    <div className='mb-6'>
      <label htmlFor="password" className="my-2 flex items-center justify-between">
        <span className='system-md-semibold text-gray-700'>{t('login.password')}</span>
        <Link
          href={`/reset-password?${searchParams.toString()}`}
          className={`system-xs-regular ${isEmailSetup ? 'text-blue-600 hover:text-blue-800' : 'pointer-events-none text-gray-400'} transition-colors duration-200`}
          tabIndex={isEmailSetup ? 0 : -1}
          aria-disabled={!isEmailSetup}
        >
          {t('login.forget')}
        </Link>
      </label>
      <div className="relative mt-2">
        <Input
          id="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter')
              handleEmailPasswordLogin()
          }}
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder={t('login.passwordPlaceholder') || ''}
          tabIndex={2}
          className="w-full rounded-xl border border-gray-200 bg-white/70 px-4 py-3 pr-12 backdrop-blur-sm transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-blue-500"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <Button
            type="button"
            variant='ghost'
            onClick={() => setShowPassword(!showPassword)}
            className="text-gray-500 transition-colors duration-200 hover:text-gray-700"
          >
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </Button>
        </div>
      </div>
    </div>

    <div className='mb-2'>
      <Button
        tabIndex={2}
        variant='primary'
        onClick={handleEmailPasswordLogin}
        disabled={isLoading || !email || !password}
        className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:from-blue-700 hover:to-purple-700 hover:shadow-xl disabled:transform-none disabled:cursor-not-allowed disabled:opacity-50"
      >{t('login.signBtn')}</Button>
    </div>
  </form>
}
