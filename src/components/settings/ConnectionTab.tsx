'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Project, ConnectionType } from '@/types'

interface ConnectionTabProps {
  project: Project
  onSave: (data: Partial<Project>) => Promise<void>
}

export default function ConnectionTab({ project, onSave }: ConnectionTabProps) {
  const [connectionType, setConnectionType] = useState<ConnectionType>(
    project.connection_type
  )
  const [supabaseUrl, setSupabaseUrl] = useState(project.supabase_url ?? '')
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(
    project.supabase_anon_key ?? ''
  )
  const [supabaseServiceRoleKey, setSupabaseServiceRoleKey] = useState(
    project.supabase_service_role_key ?? ''
  )
  const [storageBucket, setStorageBucket] = useState(
    project.storage_bucket ?? 'images'
  )
  const [apiEndpoint, setApiEndpoint] = useState(project.api_endpoint ?? '')
  const [apiKey, setApiKey] = useState(project.api_key ?? '')
  const [apiMethod, setApiMethod] = useState(project.api_method ?? 'POST')

  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  async function handleTestConnection() {
    setIsTesting(true)
    setTestResult(null)
    try {
      const res = await fetch(
        `/api/projects/${project.id}/test-connection`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            connection_type: connectionType,
            supabase_url: supabaseUrl,
            supabase_anon_key: supabaseAnonKey,
            supabase_service_role_key: supabaseServiceRoleKey,
            api_endpoint: apiEndpoint,
            api_key: apiKey,
            api_method: apiMethod,
          }),
        }
      )
      const data = await res.json()
      if (res.ok) {
        setTestResult({ success: true, message: 'เชื่อมต่อสำเร็จ' })
      } else {
        setTestResult({
          success: false,
          message: data.error || 'เชื่อมต่อไม่สำเร็จ',
        })
      }
    } catch {
      setTestResult({ success: false, message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ' })
    } finally {
      setIsTesting(false)
    }
  }

  async function handleSave() {
    setIsSaving(true)
    try {
      await onSave({
        connection_type: connectionType,
        ...(connectionType === 'supabase'
          ? {
              supabase_url: supabaseUrl || null,
              supabase_anon_key: supabaseAnonKey || null,
              supabase_service_role_key: supabaseServiceRoleKey || null,
              storage_bucket: storageBucket || null,
              api_endpoint: null,
              api_key: null,
              api_method: null,
            }
          : {
              supabase_url: null,
              supabase_anon_key: null,
              supabase_service_role_key: null,
              storage_bucket: null,
              api_endpoint: apiEndpoint || null,
              api_key: apiKey || null,
              api_method: apiMethod || null,
            }),
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Connection Type Radio */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700">
          ประเภทการเชื่อมต่อ
        </label>
        <div className="flex gap-4 mt-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="connection_type"
              value="supabase"
              checked={connectionType === 'supabase'}
              onChange={() => setConnectionType('supabase')}
              className="accent-primary cursor-pointer"
            />
            <span className="text-sm text-foreground">Supabase Direct</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="connection_type"
              value="rest_api"
              checked={connectionType === 'rest_api'}
              onChange={() => setConnectionType('rest_api')}
              className="accent-primary cursor-pointer"
            />
            <span className="text-sm text-foreground">REST API</span>
          </label>
        </div>
      </div>

      {/* Supabase Fields */}
      {connectionType === 'supabase' && (
        <>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">
              Supabase URL
            </label>
            <Input
              type="text"
              placeholder="https://xxxxx.supabase.co"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              className="h-[42px] rounded-lg px-3.5 text-sm border-[#E2E8F0]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">
              Anon Key
            </label>
            <Input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIs..."
              value={supabaseAnonKey}
              onChange={(e) => setSupabaseAnonKey(e.target.value)}
              className="h-[42px] rounded-lg px-3.5 text-sm border-[#E2E8F0]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">
              Service Role Key
            </label>
            <Input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIs..."
              value={supabaseServiceRoleKey}
              onChange={(e) => setSupabaseServiceRoleKey(e.target.value)}
              className="h-[42px] rounded-lg px-3.5 text-sm border-[#E2E8F0]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">
              Storage Bucket
            </label>
            <Input
              type="text"
              placeholder="images"
              value={storageBucket}
              onChange={(e) => setStorageBucket(e.target.value)}
              className="h-[42px] rounded-lg px-3.5 text-sm border-[#E2E8F0]"
            />
          </div>
        </>
      )}

      {/* REST API Fields */}
      {connectionType === 'rest_api' && (
        <>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">
              API Endpoint
            </label>
            <Input
              type="text"
              placeholder="https://api.example.com/posts"
              value={apiEndpoint}
              onChange={(e) => setApiEndpoint(e.target.value)}
              className="h-[42px] rounded-lg px-3.5 text-sm border-[#E2E8F0]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">
              API Key
            </label>
            <Input
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="h-[42px] rounded-lg px-3.5 text-sm border-[#E2E8F0]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">
              Method
            </label>
            <div className="flex gap-4 mt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="api_method"
                  value="POST"
                  checked={apiMethod === 'POST'}
                  onChange={() => setApiMethod('POST')}
                  className="accent-primary cursor-pointer"
                />
                <span className="text-sm text-foreground">POST</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="api_method"
                  value="PUT"
                  checked={apiMethod === 'PUT'}
                  onChange={() => setApiMethod('PUT')}
                  className="accent-primary cursor-pointer"
                />
                <span className="text-sm text-foreground">PUT</span>
              </label>
            </div>
          </div>
        </>
      )}

      {/* Test Connection */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          onClick={handleTestConnection}
          disabled={isTesting}
          className="h-10 px-4 gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">cable</span>
          {isTesting ? 'กำลังทดสอบ...' : 'ทดสอบการเชื่อมต่อ'}
        </Button>
        {testResult && (
          <span
            className={cn(
              'text-sm',
              testResult.success ? 'text-emerald-600' : 'text-red-500'
            )}
          >
            {testResult.success ? '\u2705 ' : '\u274C '}
            {testResult.message}
          </span>
        )}
      </div>

      {/* Save */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="h-10 px-5 cursor-pointer"
        >
          {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
        </Button>
      </div>
    </div>
  )
}
