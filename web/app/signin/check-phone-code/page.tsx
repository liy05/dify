'use client'
import { RiMailSendFill } from '@remixicon/react'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useContext } from 'use-context-selector'
import Countdown from '@/app/components/signin/countdown'
import Button from '@/app/components/base/button'
import Input from '@/app/components/base/input'
import Toast from '@/app/components/base/toast'
import { phoneLoginWithCode, sendPhoneLoginCode } from '@/service/common'
import I18NContext from '@/context/i18n'

export default function CheckPhoneCode() {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const phone = decodeURIComponent(searchParams.get('phone') as string)
  const token = decodeURIComponent(searchParams.get('token') as string)
  const invite_token = decodeURIComponent(searchParams.get('invite_token') || '')
  const [code, setVerifyCode] = useState('')
  const [loading, setIsLoading] = useState(false)
  const { locale } = useContext(I18NContext)

  const verify = async () => {
    try {
      if (!code.trim()) {
        Toast.notify({
          type: 'error',
          message: t('login.checkCode.emptyCode'),
        })
        return
      }
      if (!/\d{6}/.test(code)) {
        Toast.notify({
          type: 'error',
          message: t('login.checkCode.invalidCode'),
        })
        return
      }
      setIsLoading(true)
      const ret = await phoneLoginWithCode({ phone, code, token })
      if (ret.result === 'success') {
        localStorage.setItem('console_token', ret.data.access_token)
        localStorage.setItem('refresh_token', ret.data.refresh_token)
        router.replace(invite_token ? `/signin/invite-settings?${searchParams.toString()}` : '/home')
      }
    }
    catch (error) { console.error(error) }
    finally {
      setIsLoading(false)
    }
  }

  const resendCode = async () => {
    try {
      const ret = await sendPhoneLoginCode(phone, locale)
      if (ret.result === 'success') {
        const params = new URLSearchParams(searchParams)
        params.set('token', encodeURIComponent(ret.data))
        router.replace(`/signin/check-phone-code?${params.toString()}`)
      }
    }
    catch (error) { console.error(error) }
  }

  return <div className='flex flex-col gap-3'>
    <div className='inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-components-panel-border-subtle bg-background-default-dodge shadow-lg'>
      <RiMailSendFill className='h-6 w-6 text-2xl text-text-accent-light-mode-only' />
    </div>
    <div className='pb-4 pt-2'>
      <h2 className='title-4xl-semi-bold text-text-primary'>{t('login.checkCode.checkYourPhone')}</h2>
      <p className='body-md-regular mt-2 text-text-secondary'>
        <span dangerouslySetInnerHTML={{ __html: t('login.checkCode.phoneTips', { phone }) as string }}></span>
        <br />
        {t('login.checkCode.validTime')}
      </p>
    </div>

    <form action="">
      <label htmlFor="code" className='system-md-semibold mb-1 text-text-secondary'>{t('login.checkCode.verificationCode')}</label>
      <Input value={code} onChange={e => setVerifyCode(e.target.value)} max-length={6} className='mt-1' placeholder={t('login.checkCode.verificationCodePlaceholder') as string} />
      <Button loading={loading} disabled={loading} className='my-3 w-full' variant='primary' onClick={verify}>{t('login.checkCode.verify')}</Button>
      <Countdown onResend={resendCode} />
    </form>
    <div className='py-2'>
      <div className='h-px bg-gradient-to-r from-background-gradient-mask-transparent via-divider-regular to-background-gradient-mask-transparent'></div>
    </div>
  </div>
}
