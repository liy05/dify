'use client'
import type { FC } from 'react'
import classNames from '@/utils/classnames'
import useTheme from '@/hooks/use-theme'
import { useGlobalPublicStore } from '@/context/global-public-context'

export type LogoStyle = 'default' | 'monochromeWhite'

export const logoPathMap: Record<LogoStyle, string> = {
  default: '/logo/logo.svg',
  monochromeWhite: '/logo/logo-monochrome-white.svg',
}

export type LogoSize = 'large' | 'medium' | 'small'

export const logoSizeMap: Record<LogoSize, string> = {
  large: 'w-16 h-7',
  medium: 'w-12 h-[22px]',
  small: 'w-9 h-4',
}

type DifyLogoProps = {
  style?: LogoStyle
  size?: LogoSize
  className?: string
}

const DifyLogo: FC<DifyLogoProps> = ({
  style = 'default',
  size = 'medium',
  className,
}) => {
  const { theme } = useTheme()
  const themedStyle = (theme === 'dark' && style === 'default') ? 'monochromeWhite' : style
  const { systemFeatures } = useGlobalPublicStore()
  const hasBrandingLogo = Boolean(systemFeatures.branding.enabled && systemFeatures.branding.workspace_logo)

  return (
    <div className="flex items-center">
      <svg
        width={size === 'large' ? 32 : size === 'medium' ? 24 : 20}
        height={size === 'large' ? 32 : size === 'medium' ? 24 : 20}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={classNames('mr-3', className)}
      >
        <rect
          width="32"
          height="32"
          rx="8"
          fill={themedStyle === 'monochromeWhite' ? '#FFFFFF' : '#3B82F6'}
        />
        <path
          d="M8 12h4l4 8h-2l-1-2h-4l-1 2H6l4-8zm2 2l-1 2h2l-1-2z"
          fill="white"
        />
        <path
          d="M18 12h2v8h-2v-8z"
          fill="white"
        />
      </svg>
      <span className={classNames(
        'font-bold whitespace-nowrap',
        size === 'large' ? 'text-xl' : size === 'medium' ? 'text-lg' : 'text-base',
        themedStyle === 'monochromeWhite' ? 'text-white' : 'text-gray-900',
      )}>
        AI服务平台
      </span>
    </div>
  )
}

export default DifyLogo
