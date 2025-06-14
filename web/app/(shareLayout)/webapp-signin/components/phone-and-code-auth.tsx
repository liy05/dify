import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter, useSearchParams } from 'next/navigation'
import { useContext } from 'use-context-selector'
import Input from '@/app/components/base/input'
import Button from '@/app/components/base/button'
import Toast from '@/app/components/base/toast'
import { sendPhoneLoginCode } from '@/service/common'
import { COUNT_DOWN_KEY, COUNT_DOWN_TIME_MS } from '@/app/components/signin/countdown'
import I18NContext from '@/context/i18n'

export default function PhoneAndCodeAuth() {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [loading, setIsLoading] = useState(false)
  const { locale } = useContext(I18NContext)

  const handleGetPhoneVerificationCode = async () => {
    try {
      if (!phone) {
        Toast.notify({ type: 'error', message: t('login.error.phoneEmpty') })
        return
      }

      if (!/^1[3-9]\d{9}$/.test(phone)) {
        Toast.notify({
          type: 'error',
          message: t('login.error.phoneInValid'),
        })
        return
      }
      setIsLoading(true)
      const ret = await sendPhoneLoginCode(phone, locale)
      if (ret.result === 'success') {
        localStorage.setItem(COUNT_DOWN_KEY, `${COUNT_DOWN_TIME_MS}`)
        const params = new URLSearchParams(searchParams)
        params.set('phone', encodeURIComponent(phone))
        params.set('token', encodeURIComponent(ret.data))
        router.push(`/signin/check-phone-code?${params.toString()}`)
      }
    }
    catch (error) {
      console.error(error)
    }
    finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex flex-col gap-2'>
        <label htmlFor="phone" className='system-md-semibold text-text-secondary'>{t('login.phone')}</label>
        <Input
          id="phone"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder={t('login.phonePlaceholder') as string}
          className='mt-1'
        />
      </div>
      <Button
        loading={loading}
        disabled={loading}
        className='w-full'
        variant='primary'
        onClick={handleGetPhoneVerificationCode}
      >
        {t('login.getVerificationCode')}
      </Button>
    </div>
  )
}
