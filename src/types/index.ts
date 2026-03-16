// ===== Connection =====

export type ConnectionType = 'supabase' | 'rest_api'

// ===== Project =====

export interface Project {
  id: string
  name: string
  slug: string
  domain: string | null

  // Connection
  connection_type: ConnectionType
  supabase_url: string | null
  supabase_anon_key: string | null
  supabase_service_role_key: string | null
  storage_bucket: string | null

  api_endpoint: string | null
  api_key: string | null
  api_method: string | null

  // Brand & Content
  brand_voice: string | null
  writing_rules: string | null
  site_inventory: string | null
  cover_image_style: string | null

  // Meta
  status: 'active' | 'archived'
  created_at: string
  updated_at: string
}

// ===== Keyword =====

export type KeywordStatus =
  | 'pending'
  | 'generating-brief'
  | 'brief-ready'
  | 'generating-article'
  | 'draft'
  | 'review'
  | 'published'

export type ContentType = 'Blog' | 'Pillar Page' | 'Landing Page'
export type Priority = 'High' | 'Medium'

export interface Keyword {
  id: string
  project_id: string | null
  title: string
  primary_keyword: string
  slug: string
  cluster: string
  content_type: ContentType
  priority: Priority
  status: KeywordStatus
  article_id: string | null
  created_at: string
  updated_at: string
}

// ===== Article =====

export interface Article {
  id: string
  project_id: string | null
  keyword_id: string | null
  slug: string
  title: string | null
  primary_keyword: string | null
  cluster: string | null
  content_type: ContentType | null
  priority: Priority | null
  status: string
  brief_md: string | null
  content_md: string | null
  content_html: string | null
  meta_title: string | null
  meta_description: string | null
  excerpt: string | null
  tags: string[] | null
  cover_image_url: string | null
  cover_image_prompt: string | null
  supabase_post_id: string | null
  token_usage: { brief: number; article: number; total: number } | null
  created_at: string
  updated_at: string
}

// ===== Cover Image =====

export interface CoverImage {
  id: string
  project_id: string | null
  article_id: string | null
  prompt: string
  image_url: string | null
  fal_request_id: string | null
  status: 'pending' | 'generating' | 'completed' | 'failed'
  width: number
  height: number
  created_at: string
}

// ===== Cluster Group =====

export interface ClusterGroup {
  name: string
  keywords: Keyword[]
  total: number
  published: number
  draft: number
  pending: number
}
