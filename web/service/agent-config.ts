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
  name: string
  description?: string
  mode: string
  icon_type?: string
  icon?: string
  icon_background?: string
  icon_url?: string
  site_code?: string
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

export const addAppToCategory = (categoryId: string, data: AddAppToCategoryRequest) => {
  return post(`/agent-categories/${categoryId}/apps`, { body: data })
}

export const removeAppFromCategory = (categoryId: string, appId: string) => {
  return del(`/agent-categories/${categoryId}/apps/${appId}`)
}
