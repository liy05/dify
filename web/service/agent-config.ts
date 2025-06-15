import { del, get, post, put } from './base'

// 智能体分类接口
export type AgentCategory = {
  id: string
  name: string
  description?: string
  position: number
  apps: AgentItem[]
  created_at: string
  updated_at: string
}

// 智能体项目接口
export type AgentItem = {
  id: string
  item_type: 'app' | 'markdown' | 'url'
  name: string
  description?: string
  mode?: string
  icon_type?: string
  icon?: string
  icon_background?: string
  icon_url?: string
  site_code?: string
  app_id?: string
  markdown_content?: string
  url?: string
}

// API响应接口
export type AgentCategoryListResponse = {
  categories: AgentCategory[]
}

export type CreateCategoryRequest = {
  name: string
  description?: string
  position?: number
}

export type UpdateCategoryRequest = {
  name: string
  description?: string
  position?: number
}

export type AddItemToCategoryRequest = {
  item_type: 'app' | 'markdown' | 'url'
  app_id?: string // 当类型为app时必需
  name?: string // 当类型不为app时必需
  description?: string
  icon?: string
  icon_background?: string
  markdown_content?: string // 当类型为markdown时必需
  url?: string // 当类型为url时必需
  position?: number
}

export type AddAppToCategoryRequest = {
  app_id: string
  position?: number
}

// API服务函数
export const fetchAgentCategories = () => {
  return get<AgentCategoryListResponse>('/agent-categories')
}

export const createAgentCategory = (data: CreateCategoryRequest) => {
  return post<AgentCategory>('/agent-categories', { body: data })
}

export const updateAgentCategory = (categoryId: string, data: UpdateCategoryRequest) => {
  return put<AgentCategory>(`/agent-categories/${categoryId}`, { body: data })
}

export const deleteAgentCategory = (categoryId: string) => {
  return del(`/agent-categories/${categoryId}`)
}

export const addItemToCategory = (categoryId: string, data: AddItemToCategoryRequest) => {
  return post(`/agent-categories/${categoryId}/apps`, { body: data })
}

export const addAppToCategory = (categoryId: string, data: AddAppToCategoryRequest) => {
  // 兼容旧的接口，转换为新的格式
  const itemData: AddItemToCategoryRequest = {
    item_type: 'app',
    app_id: data.app_id,
    position: data.position,
  }
  return post(`/agent-categories/${categoryId}/apps`, { body: itemData })
}

export const removeItemFromCategory = (categoryId: string, itemId: string) => {
  return del(`/agent-categories/${categoryId}/apps/${itemId}`)
}

export const removeAppFromCategory = (categoryId: string, appId: string) => {
  return del(`/agent-categories/${categoryId}/apps/${appId}`)
}
