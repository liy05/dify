'use client'
import Link from 'next/link'
import useSWR from 'swr'
import { RiRobot2Line } from '@remixicon/react'
import Loading from '@/app/components/base/loading'
import { type AgentCategory, fetchAgentCategories } from '@/service/agent-config'
import useDocumentTitle from '@/hooks/use-document-title'

const HomePage = () => {
  useDocumentTitle('AI服务平台')

  // 从API加载智能体配置
  const { data: categoriesData, error } = useSWR(
    '/agent-categories',
    fetchAgentCategories,
  )

  // 只显示有智能体的分类
  const categoriesWithAgents = categoriesData?.categories?.filter(
    (cat: AgentCategory) => cat.apps.length > 0,
  ) || []

  // 错误状态
  if (error) {
    return (
      <div className="h-full bg-gray-50 px-6 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="py-24 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
              <RiRobot2Line className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-base text-gray-500">
              加载智能体失败
            </p>
          </div>
        </div>
      </div>
    )
  }

  // 加载状态
  if (!categoriesData) {
    return (
      <div className="h-full bg-gray-50 px-6 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-center py-24">
            <Loading />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-gray-50 px-6 py-8">
      <div className="mx-auto max-w-7xl">
        {/* 智能体分类展示 */}
        {categoriesWithAgents.length > 0 ? (
          <div className="space-y-12">
            {categoriesWithAgents.map((category: AgentCategory) => (
              <div key={category.id} className="mb-12">
                {/* 分类标题 */}
                <div className="mb-6">
                  <div className="mb-2 flex items-center">
                    <div className="mr-3 flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                      <span className="text-sm font-bold text-white">🎯</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {category.name}
                    </h2>

                  </div>
                  {category.description && (
                    <p className="ml-9 text-gray-600">{category.description}</p>
                  )}
                </div>

                {/* 工具卡片网格 */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {category.apps.map(agent => (
                    <Link
                      key={agent.id}
                      href={`/chat/${agent.site_code || agent.id}`}
                      className="group block"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-md">
                        <div className="flex items-center space-x-3">
                          {/* 工具图标 */}
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-base text-white shadow-sm transition-transform duration-300 group-hover:scale-110">
                            {agent.icon || '🤖'}
                          </div>

                          {/* 工具信息 */}
                          <div className="min-w-0 flex-1">
                            <h3 className="mb-1 line-clamp-1 text-sm font-semibold leading-tight text-gray-900 transition-colors group-hover:text-blue-600">
                              {agent.name}
                            </h3>

                            {agent.description && (
                              <p className="line-clamp-1 text-xs leading-relaxed text-gray-500">
                                {agent.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* 空状态 - 没有配置智能体时显示 */
          <div className="py-24 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-sm">
              <RiRobot2Line className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-gray-900">
              暂无智能体
            </h3>
            <p className="text-gray-500">
              还没有配置任何智能体工具
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default HomePage
