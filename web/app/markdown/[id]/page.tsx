'use client'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import Button from '@/app/components/base/button'
import Loading from '@/app/components/base/loading'
import { fetchAgentCategories } from '@/service/agent-config'
import type { AgentItem } from '@/service/agent-config'

const MarkdownPage = () => {
  const params = useParams()
  const id = params.id as string
  const [item, setItem] = useState<AgentItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadItem = async () => {
      try {
        const data = await fetchAgentCategories()
        // 在所有分类中查找指定ID的项目
        let foundItem: AgentItem | null = null
        for (const category of data.categories) {
          const targetItem = category.apps?.find(app => app.id === id)
          if (targetItem) {
            foundItem = targetItem
            break
          }
        }

        if (foundItem && foundItem.item_type === 'markdown')
          setItem(foundItem)
         else
          setError('Markdown内容不存在或类型错误')
      }
 catch (_) {
        setError('加载失败')
      }
 finally {
        setLoading(false)
      }
    }

    if (id)
      loadItem()
  }, [id])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loading />
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-red-500">{error || '内容不存在'}</p>
          <Button onClick={() => window.history.back()}>
            返回
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <div className="bg-white shadow-sm">
        <div className="mx-auto max-w-4xl px-6 py-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{item.icon || '📄'}</span>
            <h1 className="text-xl font-semibold text-gray-900">{item.name}</h1>
          </div>
          {item.description && (
            <p className="mt-2 text-gray-600">{item.description}</p>
          )}
        </div>
      </div>

      {/* 内容 */}
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="rounded-lg bg-white p-8 shadow-sm">
          <div className="prose-gray prose max-w-none prose-headings:text-gray-900 prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:text-gray-700 prose-strong:text-gray-900 prose-code:rounded prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-pre:rounded-lg prose-pre:bg-gray-100 prose-pre:p-4">
            <ReactMarkdown>
              {item.markdown_content || '暂无内容'}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MarkdownPage
