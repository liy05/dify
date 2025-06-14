import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter, useSearchParams } from 'next/navigation'
import { useContext } from 'use-context-selector'
import { RiArrowLeftLine, RiMailSendFill } from '@remixicon/react'
import Input from '@/app/components/base/input'
import Button from '@/app/components/base/button'
import Toast from '@/app/components/base/toast'
import Countdown from '@/app/components/signin/countdown'
import { phoneLoginWithCode, sendPhoneLoginCode } from '@/service/common'
import { COUNT_DOWN_KEY, COUNT_DOWN_TIME_MS } from '@/app/components/signin/countdown'
import I18NContext from '@/context/i18n'

type PhoneAndCodeAuthProps = {
  isInvite: boolean
}

export default function PhoneAndCodeAuth({ isInvite }: PhoneAndCodeAuthProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<'phone' | 'code'>('phone') // 当前步骤
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [loading, setIsLoading] = useState(false)
  const [token, setToken] = useState('')
  const { locale } = useContext(I18NContext)

  // 使用prop传递的isInvite，与邮箱登录保持一致

  // 发送验证码
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
      console.log('发送验证码到手机号:', phone)
      const ret = await sendPhoneLoginCode(phone, locale)
      console.log('发送验证码响应:', ret)

      if (ret.result === 'success') {
        localStorage.setItem(COUNT_DOWN_KEY, `${COUNT_DOWN_TIME_MS}`)
        setToken(ret.data)
        setStep('code') // 切换到验证码输入步骤
        console.log('切换到验证码输入步骤')
        Toast.notify({
          type: 'success',
          message: `验证码已发送到 ${phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}`,
        })
      }
 else {
        console.error('发送验证码失败:', ret)
        Toast.notify({
          type: 'error',
          message: '发送验证码失败，请稍后重试',
        })
      }
    }
    catch (error) {
      console.error('发送验证码异常:', error)
      Toast.notify({
        type: 'error',
        message: '发送验证码失败，请稍后重试',
      })
    }
    finally {
      setIsLoading(false)
    }
  }

  // 验证码登录
  const handleVerifyCode = async () => {
    try {
      if (!code.trim()) {
        Toast.notify({
          type: 'error',
          message: t('login.checkCode.emptyCode'),
        })
        return
      }
      if (!/^\d{6}$/.test(code)) {
        Toast.notify({
          type: 'error',
          message: t('login.checkCode.invalidCode'),
        })
        return
      }
      setIsLoading(true)
      const ret = await phoneLoginWithCode({ phone, code, token })
      if (ret.result === 'success') {
        if (isInvite) {
          router.replace(`/signin/invite-settings?${searchParams.toString()}`)
        }
        else {
          localStorage.setItem('console_token', ret.data.access_token)
          localStorage.setItem('refresh_token', ret.data.refresh_token)
          router.replace('/home')
        }
      }
 else {
        Toast.notify({
          type: 'error',
          message: ret.message || '登录失败，请重试',
        })
      }
    }
    catch (error) {
      console.error(error)
      Toast.notify({
        type: 'error',
        message: '验证码错误或已过期，请重新获取',
      })
    }
    finally {
      setIsLoading(false)
    }
  }

  // 重新发送验证码
  const handleResendCode = async () => {
    try {
      const ret = await sendPhoneLoginCode(phone, locale)
      if (ret.result === 'success') {
        setToken(ret.data)
        Toast.notify({
          type: 'success',
          message: '验证码已重新发送',
        })
      }
    }
    catch (error) {
      console.error(error)
      Toast.notify({
        type: 'error',
        message: '重新发送失败，请稍后重试',
      })
    }
  }

  // 返回手机号输入步骤
  const handleBackToPhone = () => {
    setStep('phone')
    setCode('')
  }

  // 手机号输入步骤
  if (step === 'phone') {
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
            maxLength={11}
          />
        </div>
        <Button
          loading={loading}
          disabled={loading || !phone}
          className='w-full'
          variant='primary'
          onClick={handleGetPhoneVerificationCode}
        >
          {t('login.getVerificationCode')}
        </Button>
        <Countdown onResend={handleGetPhoneVerificationCode} />
      </div>
    )
  }

  // 验证码输入步骤
  return (
    <div className='flex flex-col gap-3'>
      {/* 返回按钮 */}
      <div className='mb-2 flex items-center gap-2'>
        <button
          onClick={handleBackToPhone}
          className='flex items-center gap-1 text-text-secondary transition-colors hover:text-text-primary'
        >
          <RiArrowLeftLine className='h-4 w-4' />
          <span className='system-sm-medium'>返回</span>
        </button>
      </div>

      {/* 图标和标题 */}
      <div className='inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-components-panel-border-subtle bg-background-default-dodge shadow-lg'>
        <RiMailSendFill className='h-6 w-6 text-2xl text-text-accent-light-mode-only' />
      </div>

      <div className='pb-4 pt-2'>
        <h2 className='title-4xl-semi-bold text-text-primary'>{t('login.checkCode.checkYourPhone')}</h2>
        <p className='body-md-regular mt-2 text-text-secondary'>
          验证码已发送到 <strong>{phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}</strong>
          <br />
          {t('login.checkCode.validTime')}
        </p>
      </div>

      {/* 验证码输入 */}
      <div className='flex flex-col gap-2'>
        <label htmlFor="code" className='system-md-semibold text-text-secondary'>{t('login.checkCode.verificationCode')}</label>
        <Input
          id="code"
          value={code}
          onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
          maxLength={6}
          className='mt-1 text-center text-lg tracking-widest'
          placeholder={t('login.checkCode.verificationCodePlaceholder') as string}
          autoFocus
        />
      </div>

      {/* 验证按钮 */}
      <Button
        loading={loading}
        disabled={loading || code.length !== 6}
        className='w-full'
        variant='primary'
        onClick={handleVerifyCode}
      >
        {t('login.checkCode.verify')}
      </Button>

      {/* 重新发送倒计时 */}
      <Countdown onResend={handleResendCode} />

      <div className='py-2'>
        <div className='h-px bg-gradient-to-r from-background-gradient-mask-transparent via-divider-regular to-background-gradient-mask-transparent'></div>
      </div>
    </div>
  )
}
