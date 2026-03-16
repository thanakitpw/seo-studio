'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Papa from 'papaparse'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { generateSlug } from '@/lib/slug'

interface ImportCsvModalProps {
  projectId: string
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

interface ParsedRow {
  title: string
  primary_keyword: string
  slug: string
  cluster: string
  content_type: string
  priority: string
  isDuplicate: boolean
}

export default function ImportCsvModal({
  projectId,
  open,
  onClose,
  onSuccess,
}: ImportCsvModalProps) {
  const [step, setStep] = useState(1)
  const [file, setFile] = useState<File | null>(null)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [existingSlugs, setExistingSlugs] = useState<Set<string>>(new Set())
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStep(1)
      setFile(null)
      setRows([])
      setExistingSlugs(new Set())
      setImporting(false)
      setImportResult(null)
      setError('')
      setDragOver(false)
    }
  }, [open])

  // Fetch existing slugs for duplicate detection
  const fetchExistingSlugs = useCallback(async () => {
    try {
      const res = await fetch(`/api/keywords?project_id=${projectId}&limit=100`)
      if (res.ok) {
        const json = await res.json()
        const slugs = new Set<string>(
          (json.data || []).map((k: { slug: string }) => k.slug)
        )
        setExistingSlugs(slugs)
        return slugs
      }
    } catch {
      // ignore
    }
    return new Set<string>()
  }, [projectId])

  const parseFile = useCallback(
    async (csvFile: File) => {
      const slugs = await fetchExistingSlugs()

      Papa.parse(csvFile, {
        header: true,
        skipEmptyLines: true,
        complete(results) {
          const requiredCols = ['Title', 'Primary Keyword', 'Cluster', 'Content Type', 'Priority']
          const headers = results.meta.fields || []
          const missing = requiredCols.filter((c) => !headers.includes(c))

          if (missing.length > 0) {
            setError(`ไม่พบคอลัมน์: ${missing.join(', ')}`)
            return
          }

          const parsed: ParsedRow[] = (
            results.data as Record<string, string>[]
          ).map((row) => {
            const title = (row['Title'] || '').trim()
            const slug = generateSlug(title)
            return {
              title,
              primary_keyword: (row['Primary Keyword'] || '').trim(),
              slug,
              cluster: (row['Cluster'] || '').trim(),
              content_type: (row['Content Type'] || '').trim(),
              priority: (row['Priority'] || '').trim(),
              isDuplicate: slugs.has(slug),
            }
          })

          // Also mark internal duplicates (same slug appearing more than once)
          const seenSlugs = new Set<string>()
          for (const row of parsed) {
            if (seenSlugs.has(row.slug)) {
              row.isDuplicate = true
            } else {
              seenSlugs.add(row.slug)
            }
          }

          setRows(parsed)
          setError('')
          setStep(2)
        },
        error() {
          setError('ไม่สามารถอ่านไฟล์ CSV ได้')
        },
      })
    },
    [fetchExistingSlugs]
  )

  const handleFileSelect = (selectedFile: File | undefined) => {
    if (!selectedFile) return
    if (!selectedFile.name.endsWith('.csv')) {
      setError('กรุณาเลือกไฟล์ .csv เท่านั้น')
      return
    }
    setFile(selectedFile)
    setError('')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const droppedFile = e.dataTransfer.files[0]
    handleFileSelect(droppedFile)
  }

  const handleImport = async () => {
    const toImport = rows.filter((r) => !r.isDuplicate && r.title)
    if (toImport.length === 0) return

    setImporting(true)
    setStep(3)
    setError('')

    try {
      const res = await fetch('/api/keywords/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          keywords: toImport.map((r) => ({
            title: r.title,
            primary_keyword: r.primary_keyword,
            slug: r.slug,
            cluster: r.cluster,
            content_type: r.content_type,
            priority: r.priority,
          })),
        }),
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || 'เกิดข้อผิดพลาดในการ import')
      }

      const result = await res.json()
      setImportResult(result)
      setImporting(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
      setImporting(false)
      setStep(2)
    }
  }

  const handleClose = () => {
    if (importResult) {
      onSuccess()
    }
    onClose()
  }

  if (!open) return null

  const totalRows = rows.length
  const duplicateCount = rows.filter((r) => r.isDuplicate).length
  const importableCount = rows.filter((r) => !r.isDuplicate && r.title).length

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose()
      }}
    >
      <div className="w-full max-w-[560px] rounded-xl bg-white shadow-xl">
        {/* ===== Step 1: Upload ===== */}
        {step === 1 && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <div className="flex items-center gap-2.5">
                <span
                  className="material-symbols-outlined text-[#6467f2]"
                  style={{ fontSize: '22px' }}
                >
                  upload_file
                </span>
                <h2 className="text-lg font-semibold text-slate-800">
                  อัปโหลดไฟล์ CSV
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="cursor-pointer rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  close
                </span>
              </button>
            </div>

            {/* Progress */}
            <div className="px-6 pb-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>ขั้นตอน 1 จาก 3</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-1/3 rounded-full bg-[#6467f2] transition-all" />
              </div>
            </div>

            {/* Drop zone */}
            <div className="px-6 pb-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOver(true)
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors',
                  dragOver
                    ? 'border-[#6467f2] bg-[#6467f2]/5'
                    : file
                      ? 'border-emerald-300 bg-emerald-50'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                )}
              >
                <span
                  className={cn(
                    'material-symbols-outlined',
                    file ? 'text-emerald-500' : 'text-slate-400'
                  )}
                  style={{ fontSize: '40px' }}
                >
                  {file ? 'check_circle' : 'cloud_upload'}
                </span>
                {file ? (
                  <div>
                    <p className="text-sm font-medium text-slate-700">{file.name}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-slate-600">
                      ลากไฟล์มาวางที่นี่ หรือคลิกเลือกไฟล์
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">รองรับ .csv</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files?.[0])}
                />
              </div>

              {/* Template link */}
              <a
                href="/api/keywords/template"
                className="mt-3 inline-flex cursor-pointer items-center gap-1 text-sm text-[#6467f2] hover:underline"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                  download
                </span>
                ดาวน์โหลด Template CSV
              </a>

              {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
            </div>

            {/* Footer */}
            <Separator />
            <div className="flex items-center justify-end gap-3 px-6 py-4">
              <Button
                variant="outline"
                onClick={handleClose}
                className="cursor-pointer"
              >
                ยกเลิก
              </Button>
              <Button
                onClick={() => file && parseFile(file)}
                disabled={!file}
                className="cursor-pointer gap-1.5"
              >
                ถัดไป
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                  arrow_forward
                </span>
              </Button>
            </div>
          </>
        )}

        {/* ===== Step 2: Preview ===== */}
        {step === 2 && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <div className="flex items-center gap-2.5">
                <span
                  className="material-symbols-outlined text-[#6467f2]"
                  style={{ fontSize: '22px' }}
                >
                  preview
                </span>
                <h2 className="text-lg font-semibold text-slate-800">
                  ตรวจสอบข้อมูล
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="cursor-pointer rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  close
                </span>
              </button>
            </div>

            {/* Progress */}
            <div className="px-6 pb-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>ขั้นตอน 2 จาก 3</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-2/3 rounded-full bg-[#6467f2] transition-all" />
              </div>
            </div>

            {/* Summary */}
            <div className="px-6 pb-3">
              <p className="text-sm text-slate-600">
                พบ <span className="font-semibold text-slate-800">{totalRows}</span> คำหลัก
                {duplicateCount > 0 && (
                  <>
                    {' '}· ซ้ำ{' '}
                    <span className="font-semibold text-amber-600">{duplicateCount}</span>
                  </>
                )}
                {' '}· จะ import{' '}
                <span className="font-semibold text-[#6467f2]">{importableCount}</span>
              </p>
            </div>

            {/* Preview Table */}
            <div className="px-6 pb-3">
              <div className="max-h-[240px] overflow-auto rounded-lg border border-slate-200">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-slate-500">
                        Title
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-slate-500">
                        Keyword
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-slate-500">
                        Cluster
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-slate-500">
                        Type
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-slate-500">
                        Priority
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 5).map((row, i) => (
                      <tr
                        key={i}
                        className={cn(
                          'border-t border-slate-100',
                          row.isDuplicate && 'border-l-2 border-l-amber-400 bg-amber-50'
                        )}
                      >
                        <td className="max-w-[140px] truncate px-3 py-2 text-slate-700">
                          {row.title}
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {row.primary_keyword}
                        </td>
                        <td className="px-3 py-2 text-slate-600">{row.cluster}</td>
                        <td className="px-3 py-2 text-slate-600">{row.content_type}</td>
                        <td className="px-3 py-2 text-slate-600">{row.priority}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {rows.length > 5 && (
                <p className="mt-1.5 text-xs text-slate-400">
                  แสดง 5 จาก {rows.length} รายการ
                </p>
              )}
            </div>

            {/* Duplicate warning */}
            {duplicateCount > 0 && (
              <div className="px-6 pb-3">
                <p className="text-sm text-amber-600">
                  <span className="material-symbols-outlined mr-1 align-text-bottom" style={{ fontSize: '14px' }}>
                    warning
                  </span>
                  {duplicateCount} slug ซ้ำจะถูกข้ามอัตโนมัติ
                </p>
              </div>
            )}

            {error && (
              <div className="px-6 pb-3">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}

            {/* Footer */}
            <Separator />
            <div className="flex items-center justify-between px-6 py-4">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="cursor-pointer gap-1.5"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                  arrow_back
                </span>
                ย้อนกลับ
              </Button>
              <Button
                onClick={handleImport}
                disabled={importableCount === 0}
                className="cursor-pointer gap-1.5"
              >
                Import {importableCount} คำหลัก
              </Button>
            </div>
          </>
        )}

        {/* ===== Step 3: Importing / Success ===== */}
        {step === 3 && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <div className="flex items-center gap-2.5">
                <span
                  className="material-symbols-outlined text-[#6467f2]"
                  style={{ fontSize: '22px' }}
                >
                  {importing ? 'sync' : 'check_circle'}
                </span>
                <h2 className="text-lg font-semibold text-slate-800">
                  {importing ? 'กำลัง Import...' : 'Import สำเร็จ'}
                </h2>
              </div>
              {!importing && (
                <button
                  onClick={handleClose}
                  className="cursor-pointer rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    close
                  </span>
                </button>
              )}
            </div>

            {/* Progress */}
            <div className="px-6 pb-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>ขั้นตอน 3 จาก 3</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-full rounded-full bg-[#6467f2] transition-all" />
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col items-center justify-center px-6 pb-6 pt-4">
              {importing ? (
                <div className="flex flex-col items-center gap-3 py-8">
                  <span
                    className="material-symbols-outlined animate-spin text-[#6467f2]"
                    style={{ fontSize: '48px' }}
                  >
                    progress_activity
                  </span>
                  <p className="text-sm text-slate-500">กำลัง Import คำหลัก...</p>
                </div>
              ) : importResult ? (
                <div className="flex flex-col items-center gap-3 py-8">
                  <span
                    className="material-symbols-outlined text-emerald-500"
                    style={{ fontSize: '48px' }}
                  >
                    check_circle
                  </span>
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-700">
                      Import สำเร็จ {importResult.imported} คำหลัก
                    </p>
                    {importResult.skipped > 0 && (
                      <p className="mt-1 text-xs text-slate-400">
                        ข้าม {importResult.skipped} รายการ (slug ซ้ำ)
                      </p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Footer */}
            {!importing && (
              <>
                <Separator />
                <div className="flex items-center justify-end px-6 py-4">
                  <Button onClick={handleClose} className="cursor-pointer">
                    ปิด
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
