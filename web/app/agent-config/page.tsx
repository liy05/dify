'use client'
import React, { useState } from 'react'
import { RiAddLine, RiCloseLine, RiDeleteBinLine, RiEditLine } from '@remixicon/react'
import useSWR, { mutate } from 'swr'
import Button from '@/app/components/base/button'
import Input from '@/app/components/base/input'
import Modal from '@/app/components/base/modal'
import Loading from '@/app/components/base/loading'
import Toast from '@/app/components/base/toast'
import { useAppFullList } from '@/service/use-apps'
import type { App } from '@/types/app'
import {
  type AddItemToCategoryRequest,
  type AgentCategory,
  addAppToCategory,
  addItemToCategory,
  createAgentCategory,
  deleteAgentCategory,
  fetchAgentCategories,
  removeItemFromCategory,
  updateAgentCategory,
} from '@/service/agent-config'
import AddItemModal from './add-item-modal'

const AgentConfigPage = () => {
  // SWR数据获取
  const { data: categoriesData, error: categoriesError, mutate: mutateCategories } = useSWR(
    '/agent-categories',
    fetchAgentCategories,
  )
  const { data: appsData, error: appsError } = useAppFullList()

  // 状态管理
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [showAddAgent, setShowAddAgent] = useState(false)
  const [editingCategory, setEditingCategory] = useState<AgentCategory | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryDesc, setNewCategoryDesc] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const categories = categoriesData?.categories || []
  const availableApps = appsData?.data || []

  // 添加新分类
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return

    setIsLoading(true)
    try {
      await createAgentCategory({
        name: newCategoryName.trim(),
        description: newCategoryDesc.trim(),
      })

      await mutateCategories()
      setNewCategoryName('')
      setNewCategoryDesc('')
      setShowAddCategory(false)
      Toast.notify({
        type: 'success',
        message: '分类创建成功',
      })
    }
 catch (error) {
      console.error('创建分类失败:', error)
      Toast.notify({
        type: 'error',
        message: '创建分类失败',
      })
    }
 finally {
      setIsLoading(false)
    }
  }

  // 删除分类
  const handleDeleteCategory = async (categoryId: string) => {
    // eslint-disable-next-line no-alert
    if (!confirm('确定要删除这个分类吗？这将移除分类下的所有智能体配置。')) return

    setIsLoading(true)
    try {
      await deleteAgentCategory(categoryId)
      await mutateCategories()
      Toast.notify({
        type: 'success',
        message: '分类删除成功',
      })
    }
 catch (error) {
      console.error('删除分类失败:', error)
      Toast.notify({
        type: 'error',
        message: '删除分类失败',
      })
    }
 finally {
      setIsLoading(false)
    }
  }

  // 编辑分类
  const handleEditCategory = (category: AgentCategory) => {
    setEditingCategory(category)
    setNewCategoryName(category.name)
    setNewCategoryDesc(category.description || '')
  }

  // 保存编辑的分类
  const handleSaveCategory = async () => {
    if (!editingCategory || !newCategoryName.trim()) return

    setIsLoading(true)
    try {
      await updateAgentCategory(editingCategory.id, {
        name: newCategoryName.trim(),
        description: newCategoryDesc.trim(),
      })

      await mutateCategories()
      setEditingCategory(null)
      setNewCategoryName('')
      setNewCategoryDesc('')
      Toast.notify({
        type: 'success',
        message: '分类更新成功',
      })
    }
 catch (error) {
      console.error('更新分类失败:', error)
      Toast.notify({
        type: 'error',
        message: '更新分类失败',
      })
    }
 finally {
      setIsLoading(false)
    }
  }

  // 添加项目到分类
  const handleAddItem = async (data: AddItemToCategoryRequest) => {
    if (!selectedCategoryId) return

    setIsLoading(true)
    try {
      await addItemToCategory(selectedCategoryId, data)
      await mutateCategories()
      setShowAddAgent(false)
      Toast.notify({
        type: 'success',
        message: '项目添加成功',
      })
    }
 catch (error) {
      console.error('添加项目失败:', error)
      Toast.notify({
        type: 'error',
        message: '添加项目失败',
      })
    }
 finally {
      setIsLoading(false)
    }
  }

  // 添加智能体到分类（保留兼容性）
  const handleAddAgent = async (app: App) => {
    if (!selectedCategoryId) return

    setIsLoading(true)
    try {
      await addAppToCategory(selectedCategoryId, {
        app_id: app.id,
      })

      await mutateCategories()
      Toast.notify({
        type: 'success',
        message: '智能体添加成功',
      })
    }
 catch (error) {
      console.error('添加智能体失败:', error)
      Toast.notify({
        type: 'error',
        message: '添加智能体失败',
      })
    }
 finally {
      setIsLoading(false)
    }
  }

  // 从分类中移除项目
  const handleRemoveAgent = async (categoryId: string, agentId: string) => {
    setIsLoading(true)
    try {
      await removeItemFromCategory(categoryId, agentId)
      await mutateCategories()
      Toast.notify({
        type: 'success',
        message: '项目移除成功',
      })
    }
 catch (error) {
      console.error('移除项目失败:', error)
      Toast.notify({
        type: 'error',
        message: '移除项目失败',
      })
    }
 finally {
      setIsLoading(false)
    }
  }

  // 错误处理
  if (categoriesError || appsError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-body">
        <div className="text-center">
          <p className="mb-4 text-red-500">加载数据失败</p>
          <Button onClick={() => {
            mutateCategories()
            mutate('/apps')
          }}>
            重试
          </Button>
        </div>
      </div>
    )
  }

  // 加载状态
  if (!categoriesData || !appsData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-body">
        <Loading />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-body">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-text-primary">智能体配置</h1>
          <p className="text-text-secondary">管理智能体分类，配置首页展示的智能体</p>
        </div>

        {/* 分类管理 */}
        <div className="mb-8 rounded-xl bg-background-default p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-text-primary">分类管理</h2>
            <Button
              variant="primary"
              onClick={() => setShowAddCategory(true)}
              disabled={isLoading}
            >
              <RiAddLine className="mr-2 h-4 w-4" />
              添加分类
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categories.map(category => (
              <div key={category.id} className="rounded-lg border border-divider-subtle p-4">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-text-primary">{category.name}</h3>
                    {category.description && (
                      <p className="mt-1 text-sm text-text-secondary">{category.description}</p>
                    )}
                  </div>
                  <div className="ml-4 flex gap-2">
                    <Button
                      variant="tertiary"
                      size="small"
                      onClick={() => handleEditCategory(category)}
                      disabled={isLoading}
                    >
                      <RiEditLine className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="tertiary"
                      size="small"
                      onClick={() => handleDeleteCategory(category.id)}
                      className="text-red-500 hover:text-red-600"
                      disabled={isLoading}
                    >
                      <RiDeleteBinLine className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="mb-3 text-sm text-text-tertiary">
                  已配置智能体: {category.apps?.length || 0}
                </div>

                <div className="space-y-2">
                  {category.apps?.map(agent => (
                    <div key={agent.id} className="flex items-center justify-between rounded bg-background-section-burn p-2">
                      <div className="flex items-center">
                        <span className="mr-2">{agent.icon || '🤖'}</span>
                        <div className="flex flex-col">
                          <span className="text-sm text-text-secondary">{agent.name}</span>
                          {agent.item_type !== 'app' && (
                            <span className="text-xs text-text-tertiary">
                              {agent.item_type === 'markdown' ? '📄 Markdown说明' : '🔗 外部链接'}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="tertiary"
                        size="small"
                        onClick={() => handleRemoveAgent(category.id, agent.id)}
                        className="text-red-500 hover:text-red-600"
                        disabled={isLoading}
                      >
                        <RiCloseLine className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}

                  <Button
                    variant="secondary"
                    size="small"
                    className="w-full"
                    onClick={() => {
                      setSelectedCategoryId(category.id)
                      setShowAddAgent(true)
                    }}
                    disabled={isLoading}
                  >
                    <RiAddLine className="mr-1 h-4 w-4" />
                    添加项目
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 添加分类弹窗 */}
      <Modal
        isShow={showAddCategory}
        onClose={() => setShowAddCategory(false)}
        title="添加新分类"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-text-secondary">
              分类名称
            </label>
            <Input
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
              placeholder="请输入分类名称"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-text-secondary">
              分类描述
            </label>
            <Input
              value={newCategoryDesc}
              onChange={e => setNewCategoryDesc(e.target.value)}
              placeholder="请输入分类描述（可选）"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowAddCategory(false)}
              disabled={isLoading}
            >
              取消
            </Button>
            <Button
              variant="primary"
              onClick={handleAddCategory}
              disabled={isLoading}
            >
              {isLoading ? '添加中...' : '添加'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 编辑分类弹窗 */}
      <Modal
        isShow={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        title="编辑分类"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-text-secondary">
              分类名称
            </label>
            <Input
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
              placeholder="请输入分类名称"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-text-secondary">
              分类描述
            </label>
            <Input
              value={newCategoryDesc}
              onChange={e => setNewCategoryDesc(e.target.value)}
              placeholder="请输入分类描述（可选）"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setEditingCategory(null)}
              disabled={isLoading}
            >
              取消
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveCategory}
              disabled={isLoading}
            >
              {isLoading ? '保存中...' : '保存'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 添加项目弹窗 */}
      <AddItemModal
        isShow={showAddAgent}
        onClose={() => setShowAddAgent(false)}
        onAddItem={handleAddItem}
        availableApps={availableApps}
        isLoading={isLoading}
      />
    </div>
  )
}

export default AgentConfigPage
