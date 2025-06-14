'use client'
import { useGlobalPublicStore } from '@/context/global-public-context'
import { useFavicon, useTitle } from 'ahooks'

export default function useDocumentTitle(title: string) {
  const isPending = useGlobalPublicStore(s => s.isGlobalPending)
  const systemFeatures = useGlobalPublicStore(s => s.systemFeatures)
  let titleStr = ''
  let favicon = ''
  if (isPending === false) {
    if (systemFeatures.branding.enabled) {
      titleStr = title || systemFeatures.branding.application_title
      favicon = systemFeatures.branding.favicon
    }
    else {
      titleStr = title || 'AI服务平台'
      favicon = '/favicon.ico'
    }
  }
  useTitle(titleStr)
  useFavicon(favicon)
}
