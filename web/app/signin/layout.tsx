'use client'
import Header from './_header'

import cn from '@/utils/classnames'
import { useGlobalPublicStore } from '@/context/global-public-context'
import useDocumentTitle from '@/hooks/use-document-title'

export default function SignInLayout({ children }: any) {
  const { systemFeatures } = useGlobalPublicStore()
  useDocumentTitle('')
  return <>
    <div className={cn('relative flex min-h-screen w-full justify-center')}>
      {/* 背景渐变 */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"></div>

      {/* 装饰性几何图形 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-gradient-to-br from-blue-200/30 to-purple-200/30 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-gradient-to-tr from-indigo-200/30 to-pink-200/30 blur-3xl"></div>
        <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-cyan-200/20 to-blue-200/20 blur-3xl"></div>
      </div>

      {/* 主要内容区域 */}
      <div className="relative z-10 mx-auto flex w-full max-w-lg p-6">
        <div className={cn('flex w-full flex-col rounded-3xl border border-white/20 bg-white/80 shadow-2xl backdrop-blur-xl')}>
          <Header />
          <div className={cn('flex w-full grow flex-col items-center justify-start px-10 pb-12 pt-4')}>
            <div className='w-full max-w-sm'>
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  </>
}
