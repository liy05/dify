'use client'
import type { FC } from 'react'
import React, { useState } from 'react'
import Modal from '@/app/components/base/modal'
import Button from '@/app/components/base/button'
import Input from '@/app/components/base/input'
import Textarea from '@/app/components/base/textarea'
import AppIcon from '@/app/components/base/app-icon'
import AppIconPicker from '@/app/components/base/app-icon-picker'
import type { AppIconSelection } from '@/app/components/base/app-icon-picker'
import type { App } from '@/types/app'
import type { AddItemToCategoryRequest } from '@/service/agent-config'
import { useToastContext } from '@/app/components/base/toast'

type Props = {
  isShow: boolean
  onClose: () => void
  onAddItem: (data: AddItemToCategoryRequest) => Promise<void>
  availableApps: App[]
  isLoading: boolean
}

const AddItemModal: FC<Props> = ({
  isShow,
  onClose,
  onAddItem,
  availableApps,
  isLoading,
}) => {
  const { notify } = useToastContext()
  const [itemType, setItemType] = useState<'app' | 'markdown' | 'url'>('app')
  const [selectedAppId, setSelectedAppId] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [appIcon, setAppIcon] = useState<AppIconSelection>({
    type: 'emoji',
    icon: '📄',
    background: '#FFEAD5',
  })
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [markdownContent, setMarkdownContent] = useState('')
  const [url, setUrl] = useState('')

  const handleReset = () => {
    setItemType('app')
    setSelectedAppId('')
    setName('')
    setDescription('')
    setAppIcon({
      type: 'emoji',
      icon: '📄',
      background: '#FFEAD5',
    })
    setMarkdownContent('')
    setUrl('')
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  const handleIconSelect = (iconSelection: AppIconSelection) => {
    setAppIcon(iconSelection)
    setShowIconPicker(false)
  }

  // 根据类型设置默认图标
  React.useEffect(() => {
    if (itemType === 'markdown') {
      setAppIcon({
        type: 'emoji',
        icon: '📄',
        background: '#FFEAD5',
      })
    }
 else if (itemType === 'url') {
      setAppIcon({
        type: 'emoji',
        icon: '🔗',
        background: '#E0F2FE',
      })
    }
  }, [itemType])

  const handleSubmit = async () => {
    const data: AddItemToCategoryRequest = {
      item_type: itemType,
    }

    if (itemType === 'app') {
      if (!selectedAppId) {
        notify({ type: 'error', message: '请选择应用' })
        return
      }
      data.app_id = selectedAppId
    }
 else {
      if (!name.trim()) {
        notify({ type: 'error', message: '请输入名称' })
        return
      }
      data.name = name.trim()
      data.description = description.trim()

      // 设置图标
      if (appIcon.type === 'emoji') {
        data.icon = appIcon.icon
        data.icon_background = appIcon.background
      }

      if (itemType === 'markdown') {
        if (!markdownContent.trim()) {
          notify({ type: 'error', message: '请输入Markdown内容' })
          return
        }
        data.markdown_content = markdownContent.trim()
      }
 else if (itemType === 'url') {
        if (!url.trim()) {
          notify({ type: 'error', message: '请输入URL地址' })
          return
        }
        data.url = url.trim()
      }
    }

    await onAddItem(data)
    handleReset()
  }

  return (
    <>
      <Modal
        isShow={isShow}
        onClose={handleClose}
        title="添加项目"
        className="max-w-2xl"
      >
        <div className="space-y-4">
          {/* 类型选择 */}
          <div>
            <label className="mb-2 block text-sm font-medium text-text-secondary">
              项目类型
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="app"
                  checked={itemType === 'app'}
                  onChange={e => setItemType(e.target.value as 'app')}
                  className="mr-2"
                />
                应用
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="markdown"
                  checked={itemType === 'markdown'}
                  onChange={e => setItemType(e.target.value as 'markdown')}
                  className="mr-2"
                />
                Markdown说明
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="url"
                  checked={itemType === 'url'}
                  onChange={e => setItemType(e.target.value as 'url')}
                  className="mr-2"
                />
                外部链接
              </label>
            </div>
          </div>

          {/* 应用选择 */}
          {itemType === 'app' && (
            <div>
              <label className="mb-2 block text-sm font-medium text-text-secondary">
                选择应用
              </label>
              <div className="grid max-h-60 grid-cols-1 gap-2 overflow-y-auto md:grid-cols-2">
                {availableApps.map(app => (
                  <div
                    key={app.id}
                    className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                      selectedAppId === app.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-divider-subtle hover:border-blue-300 hover:bg-blue-50'
                    }`}
                    onClick={() => setSelectedAppId(app.id)}
                  >
                    <div className="flex items-start">
                      <span className="mr-2 text-lg">{app.icon || '🤖'}</span>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-text-primary">{app.name}</h4>
                        {app.description && (
                          <p className="mt-1 text-xs text-text-secondary">{app.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 自定义项目信息 */}
          {itemType !== 'app' && (
            <>
              {/* 图标选择 */}
              <div>
                <label className="mb-2 block text-sm font-medium text-text-secondary">
                  图标
                </label>
                <div
                  className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-lg border border-divider-subtle hover:border-blue-300"
                  onClick={() => setShowIconPicker(true)}
                >
                  <AppIcon
                    size="medium"
                    iconType={appIcon.type}
                    icon={appIcon.type === 'emoji' ? appIcon.icon : ''}
                    background={appIcon.type === 'emoji' ? appIcon.background : ''}
                    imageUrl={appIcon.type === 'image' ? appIcon.url : ''}
                  />
                </div>
              </div>

              {/* 名称 */}
              <div>
                <label className="mb-2 block text-sm font-medium text-text-secondary">
                  名称 *
                </label>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="请输入名称"
                />
              </div>

              {/* 描述 */}
              <div>
                <label className="mb-2 block text-sm font-medium text-text-secondary">
                  描述
                </label>
                <Input
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="请输入描述"
                />
              </div>

              {/* Markdown内容 */}
              {itemType === 'markdown' && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-text-secondary">
                    Markdown内容 *
                  </label>
                  <Textarea
                    value={markdownContent}
                    onChange={e => setMarkdownContent(e.target.value)}
                    placeholder="请输入Markdown内容，支持Markdown语法"
                    rows={10}
                    className="font-mono text-sm"
                  />
                  <div className="mt-2 text-xs text-text-tertiary">
                    支持Markdown语法：**粗体**、*斜体*、`代码`、[链接](url)、# 标题等
                  </div>
                </div>
              )}

              {/* URL */}
              {itemType === 'url' && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-text-secondary">
                    URL地址 *
                  </label>
                  <Input
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="请输入完整的URL地址，如：https://example.com"
                    type="url"
                  />
                </div>
              )}
            </>
          )}
        </div>

        <div className="mt-6 flex justify-end space-x-2">
          <Button
            variant="secondary"
            onClick={handleClose}
          >
            取消
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={isLoading}
          >
            添加
          </Button>
        </div>
      </Modal>

      {/* 图标选择器 */}
      {showIconPicker && (
        <AppIconPicker
          onSelect={handleIconSelect}
          onClose={() => setShowIconPicker(false)}
        />
      )}
    </>
  )
}

export default AddItemModal
