'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// ===== Helpers =====

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9ก-๙-]/g, '')
}

// ===== Types =====

type ConnectionType = 'supabase' | 'rest_api'

interface FormData {
  // Step 1
  name: string
  domain: string
  slug: string
  // Step 2
  connection_type: ConnectionType
  supabase_url: string
  supabase_anon_key: string
  supabase_service_role_key: string
  storage_bucket: string
  api_endpoint: string
  api_key: string
  api_method: string
  // Step 3
  brand_voice: string
  writing_rules: string
  site_inventory: string
  cover_image_style: string
}

// ===== Step Indicator =====

const steps = [
  { number: 1, label: 'ข้อมูลทั่วไป' },
  { number: 2, label: 'การเชื่อมต่อ' },
  { number: 3, label: 'ตั้งค่าเนื้อหา' },
]

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center w-full pt-8">
      {steps.map((step, i) => (
        <div key={step.number} className="flex items-center">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'flex items-center justify-center rounded-full size-7 shrink-0 text-[13px] font-semibold font-[Inter,system-ui,sans-serif]',
                currentStep >= step.number
                  ? 'bg-primary text-white'
                  : 'bg-[#E2E8F0] text-[#94A3B8]'
              )}
            >
              {step.number}
            </div>
            <span
              className={cn(
                'text-sm',
                currentStep >= step.number
                  ? 'text-primary font-semibold'
                  : 'text-[#94A3B8]'
              )}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className="w-20 h-0.5 bg-[#E2E8F0] shrink-0 mx-3" />
          )}
        </div>
      ))}
    </div>
  )
}

// ===== Main Form =====

export default function NewProjectForm() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<FormData>({
    name: '',
    domain: '',
    slug: '',
    connection_type: 'supabase',
    supabase_url: '',
    supabase_anon_key: '',
    supabase_service_role_key: '',
    storage_bucket: 'images',
    api_endpoint: '',
    api_key: '',
    api_method: 'POST',
    brand_voice: '',
    writing_rules: '',
    site_inventory: '',
    cover_image_style: '',
  })

  function updateField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      // Auto-generate slug from name
      if (key === 'name') {
        next.slug = generateSlug(value as string)
      }
      return next
    })
  }

  function handleNext() {
    if (currentStep === 1 && !form.name.trim()) {
      setError('กรุณากรอกชื่อโปรเจค')
      return
    }
    setError(null)
    setTestResult(null)
    setCurrentStep((s) => Math.min(s + 1, 3))
  }

  function handleBack() {
    setError(null)
    setTestResult(null)
    setCurrentStep((s) => Math.max(s - 1, 1))
  }

  async function handleTestConnection() {
    setIsTesting(true)
    setTestResult(null)
    try {
      // We need a project ID to test, but since it's not created yet,
      // we send connection data directly for testing
      const res = await fetch('/api/projects/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connection_type: form.connection_type,
          supabase_url: form.supabase_url,
          supabase_anon_key: form.supabase_anon_key,
          supabase_service_role_key: form.supabase_service_role_key,
          api_endpoint: form.api_endpoint,
          api_key: form.api_key,
          api_method: form.api_method,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setTestResult({ success: true, message: 'เชื่อมต่อสำเร็จ' })
      } else {
        setTestResult({ success: false, message: data.error || 'เชื่อมต่อไม่สำเร็จ' })
      }
    } catch {
      setTestResult({ success: false, message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ' })
    } finally {
      setIsTesting(false)
    }
  }

  async function handleSubmit() {
    setIsSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          slug: form.slug.trim() || generateSlug(form.name),
          domain: form.domain.trim() || undefined,
          connection_type: form.connection_type,
          // Supabase fields
          ...(form.connection_type === 'supabase' && {
            supabase_url: form.supabase_url.trim() || undefined,
            supabase_anon_key: form.supabase_anon_key.trim() || undefined,
            supabase_service_role_key: form.supabase_service_role_key.trim() || undefined,
            storage_bucket: form.storage_bucket.trim() || undefined,
          }),
          // REST API fields
          ...(form.connection_type === 'rest_api' && {
            api_endpoint: form.api_endpoint.trim() || undefined,
            api_key: form.api_key.trim() || undefined,
            api_method: form.api_method,
          }),
          // Content config
          brand_voice: form.brand_voice.trim() || undefined,
          writing_rules: form.writing_rules.trim() || undefined,
          site_inventory: form.site_inventory.trim() || undefined,
          cover_image_style: form.cover_image_style.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'เกิดข้อผิดพลาด')
        return
      }

      router.push(`/projects/${data.id}/dashboard`)
    } catch {
      setError('เกิดข้อผิดพลาดในการสร้างโปรเจค')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Bar */}
      <header className="flex items-center justify-center w-full h-14 relative px-6 bg-white border-b border-[#E2E8F0] shrink-0">
        <span className="text-base font-semibold text-foreground">
          สร้างโปรเจคใหม่
        </span>
        <Link
          href="/projects"
          className="flex items-center gap-1.5 absolute left-6 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span className="text-sm">กลับไปโปรเจค</span>
        </Link>
      </header>

      {/* Step Indicator */}
      <StepIndicator currentStep={currentStep} />

      {/* Form Card */}
      <div className="w-full max-w-[640px] mx-auto mt-6 rounded-xl bg-white border border-[#E2E8F0] p-8">
        {/* Error message */}
        {error && (
          <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Step 1: ข้อมูลทั่วไป */}
        {currentStep === 1 && (
          <div className="flex flex-col gap-5">
            {/* ชื่อโปรเจค */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">
                ชื่อโปรเจค <span className="text-red-400">*</span>
              </label>
              <Input
                type="text"
                placeholder="เช่น Best Solutions"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="h-[42px] rounded-lg px-3.5 text-sm border-[#E2E8F0]"
              />
            </div>

            {/* Domain */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">
                Domain
              </label>
              <Input
                type="text"
                placeholder="example.com"
                value={form.domain}
                onChange={(e) => updateField('domain', e.target.value)}
                className="h-[42px] rounded-lg px-3.5 text-sm border-[#E2E8F0]"
              />
              <p className="text-[11px] text-[#94A3B8] leading-[14px]">
                ไม่จำเป็นต้องกรอก
              </p>
            </div>

            {/* Slug */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">
                Slug
              </label>
              <Input
                type="text"
                value={form.slug}
                onChange={(e) => updateField('slug', e.target.value)}
                className="h-[42px] rounded-lg px-3.5 text-sm border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B]"
              />
              <p className="text-[11px] text-[#94A3B8] leading-[14px]">
                สร้างอัตโนมัติจากชื่อ
              </p>
            </div>

            {/* Footer */}
            <div className="flex justify-end mt-1 pt-1">
              <Button
                onClick={handleNext}
                className="h-10 px-5 gap-2 cursor-pointer"
              >
                ถัดไป
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: การเชื่อมต่อ */}
        {currentStep === 2 && (
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
                    checked={form.connection_type === 'supabase'}
                    onChange={() => updateField('connection_type', 'supabase')}
                    className="accent-primary cursor-pointer"
                  />
                  <span className="text-sm text-foreground">Supabase Direct</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="connection_type"
                    value="rest_api"
                    checked={form.connection_type === 'rest_api'}
                    onChange={() => updateField('connection_type', 'rest_api')}
                    className="accent-primary cursor-pointer"
                  />
                  <span className="text-sm text-foreground">REST API</span>
                </label>
              </div>
            </div>

            {/* Supabase Fields */}
            {form.connection_type === 'supabase' && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Supabase URL
                  </label>
                  <Input
                    type="text"
                    placeholder="https://xxxxx.supabase.co"
                    value={form.supabase_url}
                    onChange={(e) => updateField('supabase_url', e.target.value)}
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
                    value={form.supabase_anon_key}
                    onChange={(e) => updateField('supabase_anon_key', e.target.value)}
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
                    value={form.supabase_service_role_key}
                    onChange={(e) => updateField('supabase_service_role_key', e.target.value)}
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
                    value={form.storage_bucket}
                    onChange={(e) => updateField('storage_bucket', e.target.value)}
                    className="h-[42px] rounded-lg px-3.5 text-sm border-[#E2E8F0]"
                  />
                </div>
              </>
            )}

            {/* REST API Fields */}
            {form.connection_type === 'rest_api' && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    API Endpoint
                  </label>
                  <Input
                    type="text"
                    placeholder="https://api.example.com/posts"
                    value={form.api_endpoint}
                    onChange={(e) => updateField('api_endpoint', e.target.value)}
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
                    value={form.api_key}
                    onChange={(e) => updateField('api_key', e.target.value)}
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
                        checked={form.api_method === 'POST'}
                        onChange={() => updateField('api_method', 'POST')}
                        className="accent-primary cursor-pointer"
                      />
                      <span className="text-sm text-foreground">POST</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="api_method"
                        value="PUT"
                        checked={form.api_method === 'PUT'}
                        onChange={() => updateField('api_method', 'PUT')}
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
                  {testResult.message}
                </span>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-between mt-1 pt-1">
              <Button
                variant="ghost"
                onClick={handleBack}
                className="h-10 px-4 gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                ย้อนกลับ
              </Button>
              <Button
                onClick={handleNext}
                className="h-10 px-5 gap-2 cursor-pointer"
              >
                ถัดไป
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: ตั้งค่าเนื้อหา */}
        {currentStep === 3 && (
          <div className="flex flex-col gap-5">
            {/* Brand Voice */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">
                Brand Voice
              </label>
              <textarea
                placeholder="เช่น เป็นกันเอง ใช้ภาษาเข้าใจง่าย เน้นความน่าเชื่อถือ"
                value={form.brand_voice}
                onChange={(e) => updateField('brand_voice', e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-[#E2E8F0] bg-transparent px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none resize-none"
              />
            </div>

            {/* Writing Rules */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">
                Writing Rules
              </label>
              <textarea
                placeholder='เช่น ห้ามใช้ ":" ในเนื้อหา, ห้ามใช้ "สำหรับ SME" ใน heading'
                value={form.writing_rules}
                onChange={(e) => updateField('writing_rules', e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-[#E2E8F0] bg-transparent px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none resize-none"
              />
            </div>

            {/* Site Inventory */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">
                Site Inventory
              </label>
              <textarea
                placeholder="รายการหน้าในเว็บไซต์สำหรับ internal linking เช่น /services, /about"
                value={form.site_inventory}
                onChange={(e) => updateField('site_inventory', e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-[#E2E8F0] bg-transparent px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none resize-none"
              />
            </div>

            {/* Cover Image Style */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">
                Cover Image Style
              </label>
              <textarea
                placeholder="เช่น minimal flat illustration, pastel colors, tech theme"
                value={form.cover_image_style}
                onChange={(e) => updateField('cover_image_style', e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-[#E2E8F0] bg-transparent px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none resize-none"
              />
            </div>

            {/* Footer */}
            <div className="flex justify-between mt-1 pt-1">
              <Button
                variant="ghost"
                onClick={handleBack}
                className="h-10 px-4 gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                ย้อนกลับ
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="h-10 px-5 gap-2 cursor-pointer"
              >
                {isSubmitting ? 'กำลังสร้าง...' : 'สร้างโปรเจค'}
                {!isSubmitting && (
                  <span className="material-symbols-outlined text-[16px]">check</span>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
