import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/navigation'
import { useContext } from 'use-context-selector'
import Button from '@/app/components/base/button'
import { getSocialAuthUrl } from '@/service/common'
import I18NContext from '@/context/i18n'

export default function SocialAuth() {
  const { t } = useTranslation()
  const router = useRouter()
  const { locale } = useContext(I18NContext)

  const handleSocialLogin = async (provider: string) => {
    try {
      const url = await getSocialAuthUrl(provider, locale)
      if (url)
        router.push(url)
    }
    catch (error) {
      console.error(error)
    }
  }

  return (
    <div className='flex flex-col gap-3'>
      <Button
        className='w-full'
        variant='secondary'
        onClick={() => handleSocialLogin('google')}
      >
        {t('login.continueWithGoogle')}
      </Button>
      <Button
        className='w-full'
        variant='secondary'
        onClick={() => handleSocialLogin('github')}
      >
        {t('login.continueWithGithub')}
      </Button>
    </div>
  )
}
