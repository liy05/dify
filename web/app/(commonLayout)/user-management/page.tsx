'use client'
import React, { useCallback, useState } from 'react'
import useSWR from 'swr'
import {
  RiAddLine,
  RiDeleteBinLine,
  RiDownloadLine,
  RiEditLine,
  RiEyeLine,
  RiEyeOffLine,
  RiUploadLine,
} from '@remixicon/react'
import Button from '@/app/components/base/button'
import Input from '@/app/components/base/input'
import Modal from '@/app/components/base/modal'
import Toast from '@/app/components/base/toast'
import { useAppContext } from '@/context/app-context'
import { del, get, post, put } from '@/service/base'
import type { Member } from '@/models/common'

// 用户管理相关的类型定义
type UserWithRole = {
  wechat_work_id?: string
  phone?: string
} & Member

type UserListResponse = {
  users: UserWithRole[]
  total: number
}

type CreateUserData = {
  name: string
  email: string
  password?: string
  role: string
  wechat_work_id?: string
  phone?: string
}

// API 函数
const fetchUsers = async (params: { page: number; limit: number; keyword?: string }): Promise<UserListResponse> => {
  return get('/workspaces/current/users', { params })
}

const createUser = async (data: CreateUserData) => {
  return post('/workspaces/current/users', { body: data })
}

const updateUser = async (userId: string, data: Partial<CreateUserData>) => {
  return put(`/workspaces/current/users/${userId}`, { body: data })
}

const deleteUser = async (userId: string) => {
  return del(`/workspaces/current/users/${userId}`)
}

const importUsers = async (file: File) => {
  console.log('DEBUG: importUsers called with file:', file)
  console.log('DEBUG: File name:', file.name)
  console.log('DEBUG: File type:', file.type)
  console.log('DEBUG: File size:', file.size)

  const formData = new FormData()
  formData.append('file', file)

  // 打印FormData内容
  console.log('DEBUG: FormData entries:')
  for (const [key, value] of formData.entries())
    console.log(`  ${key}:`, value)

  // 确保文件存在且不为空
  if (!file || file.size === 0)
    throw new Error('请选择有效的CSV文件')

  // 检查文件类型
  if (file.type !== 'text/csv' && !file.name.toLowerCase().endsWith('.csv'))
    throw new Error('请选择CSV文件')

  try {
    console.log('DEBUG: Sending request to /workspaces/current/users/import')

    // 获取认证令牌
    const token = localStorage.getItem('console_token')

    // 使用fetch直接发送请求
    const response = await fetch('/console/api/workspaces/current/users/import', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        // 不设置Content-Type，让浏览器自动设置multipart/form-data边界
      },
      body: formData,
    })

    console.log('DEBUG: Response status:', response.status)
    console.log('DEBUG: Response headers:', response.headers)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('DEBUG: Error response:', errorText)
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const result = await response.json()
    console.log('DEBUG: Response received:', result)
    return result
  }
 catch (error) {
    console.error('Import users error:', error)
    throw error
  }
}

// 用户表单组件
const UserForm: React.FC<{
  user?: UserWithRole
  onSubmit: (data: CreateUserData) => void
  onCancel: () => void
  isLoading?: boolean
}> = ({ user, onSubmit, onCancel, isLoading = false }) => {
  const [formData, setFormData] = useState<CreateUserData>({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'normal',
    wechat_work_id: user?.wechat_work_id || '',
    phone: user?.phone || '',
  })
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email) {
      Toast.notify({ type: 'error', message: '请填写必填字段' })
      return
    }
    onSubmit(formData)
  }

  const handleInputChange = (field: keyof CreateUserData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          姓名 <span className="text-red-500">*</span>
        </label>
        <Input
          value={formData.name}
          onChange={e => handleInputChange('name', e.target.value)}
          placeholder="请输入姓名"
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          邮箱 <span className="text-red-500">*</span>
        </label>
        <Input
          type="email"
          value={formData.email}
          onChange={e => handleInputChange('email', e.target.value)}
          placeholder="请输入邮箱"
          required
          disabled={!!user} // 编辑时不允许修改邮箱
        />
      </div>

      {!user && (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            密码
          </label>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={e => handleInputChange('password', e.target.value)}
              placeholder="请输入密码（可选）"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <RiEyeOffLine className="h-4 w-4" /> : <RiEyeLine className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          角色
        </label>
        <select
          value={formData.role}
          onChange={e => handleInputChange('role', e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="normal">普通用户</option>
          <option value="editor">编辑者</option>
          <option value="admin">管理员</option>
          <option value="dataset_operator">数据集操作员</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          企业微信ID
        </label>
        <Input
          value={formData.wechat_work_id}
          onChange={e => handleInputChange('wechat_work_id', e.target.value)}
          placeholder="请输入企业微信ID"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          手机号码
        </label>
        <Input
          value={formData.phone}
          onChange={e => handleInputChange('phone', e.target.value)}
          placeholder="请输入手机号码"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button onClick={onCancel} disabled={isLoading}>
          取消
        </Button>
        <Button type="submit" variant="primary" loading={isLoading}>
          {user ? '更新' : '创建'}
        </Button>
      </div>
    </form>
  )
}

// 导入用户组件
const ImportUsersModal: React.FC<{
  onClose: () => void
  onSuccess: () => void
}> = ({ onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) {
      setError('请选择文件')
      return
    }

    if (selectedFile.size === 0) {
      setError('文件不能为空')
      return
    }

    if (selectedFile.type !== 'text/csv' && !selectedFile.name.toLowerCase().endsWith('.csv')) {
      setError('请选择CSV文件')
      return
    }

    setFile(selectedFile)
  }

  const handleImport = async () => {
    if (!file) {
      setError('请选择文件')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await importUsers(file) as { success_count: number; failed_count: number }
      Toast.notify({
        type: 'success',
        message: `导入完成：成功 ${result.success_count} 个，失败 ${result.failed_count} 个`,
      })
      onSuccess()
      onClose()
    }
 catch (error: any) {
      console.error('Import error:', error)
      setError(error.message || '导入失败，请重试')
      Toast.notify({ type: 'error', message: error.message || '导入失败' })
    }
 finally {
      setIsLoading(false)
    }
  }

  const downloadTemplate = () => {
    const csvContent = 'name,email,password,role,wechat_work_id,phone\n示例用户,example@company.com,password123,normal,wx001,13800138000'
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'user_import_template.csv'
    link.click()
  }

  return (
    <Modal isShow onClose={onClose} title="批量导入用户">
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-sm text-gray-600">
            请上传CSV格式的用户文件。文件应包含以下列：name, email, password, role, wechat_work_id, phone
          </p>
          <Button onClick={downloadTemplate} className="mb-4">
            <RiDownloadLine className="mr-2 h-4 w-4" />
            下载模板
          </Button>
        </div>

        <div>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {error && (
          <div className="text-sm text-red-500">
            {error}
          </div>
        )}

        {file && (
          <div className="text-sm text-gray-600">
            已选择文件: {file.name}
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <Button onClick={onClose} disabled={isLoading}>
            取消
          </Button>
          <Button onClick={handleImport} variant="primary" loading={isLoading}>
            导入
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// 主要的用户管理页面组件
const UserManagementPage: React.FC = () => {
  const { isCurrentWorkspaceOwner, isCurrentWorkspaceManager, currentWorkspace, userProfile } = useAppContext()
  const [currentPage, setCurrentPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [userToDelete, setUserToDelete] = useState<UserWithRole | null>(null)

  const pageSize = 20

  // 检查权限 - 使用isCurrentWorkspaceManager，它包含了owner和admin
  const hasAccess = isCurrentWorkspaceManager

  // 必须在条件性返回之前调用所有Hook
  const { data, error, mutate } = useSWR(
    hasAccess ? { page: currentPage, limit: pageSize, keyword } : null,
    fetchUsers,
    { revalidateOnFocus: false },
  )

  const handleSearch = useCallback((value: string) => {
    setKeyword(value)
    setCurrentPage(1)
  }, [])

  if (!hasAccess) {
    return (
      <div className="flex h-0 shrink-0 grow flex-col overflow-y-auto bg-background-body">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <h2 className="system-xl-semibold mb-2 text-text-primary">访问受限</h2>
            <p className="system-sm-regular mb-4 text-text-tertiary">只有管理员和所有者可以访问用户管理功能</p>

            {/* 调试信息 */}
            <div className="bg-background-default-wash mx-auto max-w-md rounded-xl border border-divider-subtle p-4 text-left">
              <h3 className="system-sm-medium mb-2 text-text-secondary">调试信息：</h3>
              <pre className="system-xs-regular whitespace-pre-wrap text-text-tertiary">
                {JSON.stringify({
                  isCurrentWorkspaceOwner,
                  isCurrentWorkspaceManager,
                  currentWorkspace: currentWorkspace || null,
                  hasAccess,
                  workspaceRole: currentWorkspace?.role,
                  workspaceId: currentWorkspace?.id,
                  workspaceName: currentWorkspace?.name,
                  userId: userProfile?.id,
                  userName: userProfile?.name,
                  userEmail: userProfile?.email,
                }, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleCreateUser = async (userData: CreateUserData) => {
    setIsLoading(true)
    try {
      await createUser(userData)
      Toast.notify({ type: 'success', message: '用户创建成功' })
      setShowCreateModal(false)
      mutate()
    }
 catch {
      Toast.notify({ type: 'error', message: '用户创建失败' })
    }
 finally {
      setIsLoading(false)
    }
  }

  const handleEditUser = async (userData: CreateUserData) => {
    if (!selectedUser) return

    setIsLoading(true)
    try {
      await updateUser(selectedUser.id, userData)
      Toast.notify({ type: 'success', message: '用户更新成功' })
      setShowEditModal(false)
      setSelectedUser(null)
      mutate()
    }
 catch {
      Toast.notify({ type: 'error', message: '用户更新失败' })
    }
 finally {
      setIsLoading(false)
    }
  }

  const handleDeleteUser = (user: UserWithRole) => {
    setUserToDelete(user)
    setShowDeleteModal(true)
  }

  const confirmDeleteUser = async () => {
    if (!userToDelete) return
    try {
      await deleteUser(userToDelete.id)
      Toast.notify({ type: 'success', message: '用户删除成功' })
      mutate()
    }
 catch {
      Toast.notify({ type: 'error', message: '用户删除失败' })
    }
 finally {
      setShowDeleteModal(false)
      setUserToDelete(null)
    }
  }

  const getRoleText = (role: string) => {
    const roleMap: Record<string, string> = {
      owner: '所有者',
      admin: '管理员',
      editor: '编辑者',
      normal: '普通用户',
      dataset_operator: '数据集操作员',
    }
    return roleMap[role] || role
  }

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      active: '活跃',
      pending: '待激活',
      banned: '已禁用',
      closed: '已关闭',
    }
    return statusMap[status] || status
  }

  const getStatusClass = (status: string) => {
    if (status === 'active')
      return 'bg-util-colors-green-green-50 text-util-colors-green-green-600'

    if (status === 'pending')
      return 'bg-util-colors-yellow-yellow-50 text-util-colors-yellow-yellow-600'

    return 'bg-util-colors-red-red-50 text-util-colors-red-red-600'
  }

  if (error) {
    return (
      <div className="flex h-0 shrink-0 grow flex-col overflow-y-auto bg-background-body">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <h2 className="system-xl-semibold mb-2 text-text-primary">加载失败</h2>
            <p className="system-sm-regular text-text-tertiary">无法加载用户数据，请刷新页面重试</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-0 shrink-0 grow flex-col overflow-y-auto bg-background-body">
      {/* 顶部工具栏 */}
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-y-2 bg-background-body px-12 pb-2 pt-4 leading-[56px]">
        <div>
          <h1 className="system-2xl-semibold text-text-primary">用户管理</h1>
          <p className="system-sm-regular text-text-tertiary">管理当前工作空间的用户账户</p>
        </div>

        <div className="flex items-center gap-2">
          <Input
            showLeftIcon
            showClearIcon
            wrapperClassName="w-[200px]"
            value={keyword}
            onChange={e => handleSearch(e.target.value)}
            onClear={() => handleSearch('')}
            placeholder="搜索用户..."
          />
          <div className="h-4 w-[1px] bg-divider-regular" />
          <Button onClick={() => setShowImportModal(true)}>
            <RiUploadLine className="mr-2 h-4 w-4" />
            批量导入
          </Button>
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            <RiAddLine className="mr-2 h-4 w-4" />
            新增用户
          </Button>
        </div>
      </div>

      {/* 用户列表 */}
      <div className="mx-12 mb-6 mt-2 overflow-hidden rounded-xl border border-components-panel-border bg-components-panel-bg">
        <table className="min-w-full">
          <thead className="bg-background-default-wash border-b border-divider-subtle">
            <tr>
              <th className="system-xs-medium px-4 py-3 text-left text-text-tertiary">
                用户信息
              </th>
              <th className="system-xs-medium px-4 py-3 text-left text-text-tertiary">
                联系方式
              </th>
              <th className="system-xs-medium px-4 py-3 text-left text-text-tertiary">
                角色
              </th>
              <th className="system-xs-medium px-4 py-3 text-left text-text-tertiary">
                状态
              </th>
              <th className="system-xs-medium px-4 py-3 text-left text-text-tertiary">
                最后活跃
              </th>
              <th className="system-xs-medium px-4 py-3 text-right text-text-tertiary">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-divider-subtle">
            {(data?.users || []).map((user) => {
              return (
                <tr key={user.id} className="hover:bg-background-default-wash">
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <div className="h-8 w-8 shrink-0">
                        <img
                          className="h-8 w-8 rounded-full"
                          src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                          alt={user.name}
                        />
                      </div>
                      <div className="ml-3">
                        <div className="system-sm-medium text-text-primary">{user.name}</div>
                        <div className="system-xs-regular text-text-tertiary">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="system-sm-regular text-text-secondary">
                      {user.phone && <div className="flex items-center gap-1"><span>📱</span>{user.phone}</div>}
                      {user.wechat_work_id && <div className="flex items-center gap-1"><span>💬</span>{user.wechat_work_id}</div>}
                      {!user.phone && !user.wechat_work_id && <span className="text-text-quaternary">-</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="system-xs-medium inline-flex items-center rounded-md bg-util-colors-blue-blue-50 px-2 py-1 text-util-colors-blue-blue-600">
                      {getRoleText(user.role)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`system-xs-medium inline-flex items-center rounded-md px-2 py-1 ${getStatusClass(user.status)}`}>
                      {getStatusText(user.status)}
                    </span>
                  </td>
                  <td className="system-sm-regular px-4 py-3 text-text-tertiary">
                    {user.last_active_at ? new Date(user.last_active_at).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          setSelectedUser(user)
                          setShowEditModal(true)
                        }}
                        className="hover:bg-background-default-wash rounded-md p-1 text-text-tertiary hover:text-text-secondary"
                      >
                        <RiEditLine className="h-4 w-4" />
                      </button>
                      {user.role !== 'owner' && (
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="hover:bg-background-default-wash rounded-md p-1 text-text-tertiary hover:text-util-colors-red-red-600"
                        >
                          <RiDeleteBinLine className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* 分页 */}
        {data && data.total > pageSize && (
          <div className="flex items-center justify-between border-t border-divider-subtle px-4 py-3">
            <div className="flex w-full items-center justify-between">
              <div>
                <p className="system-sm-regular text-text-tertiary">
                  显示 <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> 到{' '}
                  <span className="font-medium">{Math.min(currentPage * pageSize, data.total)}</span> 条，
                  共 <span className="font-medium">{data.total}</span> 条记录
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  size="small"
                >
                  上一页
                </Button>
                <Button
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={currentPage * pageSize >= data.total}
                  size="small"
                >
                  下一页
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 创建用户模态框 */}
      {showCreateModal && (
        <Modal isShow onClose={() => setShowCreateModal(false)} title="新增用户">
          <UserForm
            onSubmit={handleCreateUser}
            onCancel={() => setShowCreateModal(false)}
            isLoading={isLoading}
          />
        </Modal>
      )}

      {/* 编辑用户模态框 */}
      {showEditModal && selectedUser && (
        <Modal isShow onClose={() => setShowEditModal(false)} title="编辑用户">
          <UserForm
            user={selectedUser}
            onSubmit={handleEditUser}
            onCancel={() => setShowEditModal(false)}
            isLoading={isLoading}
          />
        </Modal>
      )}

      {/* 导入用户模态框 */}
      {showImportModal && (
        <ImportUsersModal
          onClose={() => setShowImportModal(false)}
          onSuccess={() => mutate()}
        />
      )}

      {showDeleteModal && userToDelete && (
        <Modal isShow onClose={() => setShowDeleteModal(false)} title="确认删除">
          <div className="flex flex-col gap-4">
            <p>确定要删除用户 {userToDelete.name} 吗？</p>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setShowDeleteModal(false)}>取消</Button>
              <Button variant="warning" onClick={confirmDeleteUser}>删除</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default UserManagementPage
