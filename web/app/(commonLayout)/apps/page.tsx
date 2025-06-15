'use client'
import { useRouter } from 'next/navigation'
import { RiAddLine, RiDiscordFill, RiGithubFill } from '@remixicon/react'
import Button from '@/app/components/base/button'
import AppCard from './AppCard'
import { useApps } from '@/service/use-apps'
import Link from 'next/link'

const AppsPage = () => {
  const router = useRouter()
  const { apps, isLoading } = useApps()

  const handleCreateApp = () => {
    router.push('/apps/create')
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-6 py-4">
        <h1 className="text-lg font-medium">应用</h1>
        <Button
          variant="primary"
          onClick={handleCreateApp}
        >
          <RiAddLine className="mr-1 h-4 w-4" />
          创建应用
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mb-2 text-lg">加载中...</div>
            </div>
          </div>
        ) : apps.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mb-2 text-lg">还没有应用</div>
              <div className="text-sm text-gray-500">
                点击右上角的"创建应用"按钮开始创建
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {apps.map(app => (
              <AppCard key={app.id} app={app} />
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-center space-x-4 border-t border-gray-200 bg-white px-6 py-4">
        <Link
          href="https://discord.gg/FngNHpbcY7"
          target="_blank"
          className="flex items-center text-gray-500 hover:text-gray-700"
        >
          <RiDiscordFill className="mr-1 h-5 w-5" />
          Discord
        </Link>
        <Link
          href="https://github.com/langgenius/dify"
          target="_blank"
          className="flex items-center text-gray-500 hover:text-gray-700"
        >
          <RiGithubFill className="mr-1 h-5 w-5" />
          GitHub
        </Link>
      </div>
    </div>
  )
}

export default AppsPage
