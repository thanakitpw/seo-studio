'use client'

import { cn } from '@/lib/utils'

interface ToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  onContentChange: (value: string) => void
}

interface ToolbarAction {
  icon: string
  label: string
  prefix: string
  suffix: string
  block?: boolean
}

const ACTIONS: ToolbarAction[] = [
  { icon: 'format_bold', label: 'Bold', prefix: '**', suffix: '**' },
  { icon: 'format_italic', label: 'Italic', prefix: '_', suffix: '_' },
  { icon: 'link', label: 'Link', prefix: '[', suffix: '](url)' },
  { icon: 'format_list_bulleted', label: 'List', prefix: '- ', suffix: '', block: true },
  { icon: 'image', label: 'Image', prefix: '![alt](', suffix: ')' },
  { icon: 'code', label: 'Code', prefix: '`', suffix: '`' },
  { icon: 'title', label: 'H2', prefix: '## ', suffix: '', block: true },
  { icon: 'format_h3', label: 'H3', prefix: '### ', suffix: '', block: true },
]

export function Toolbar({ textareaRef, onContentChange }: ToolbarProps) {
  const applyAction = (action: ToolbarAction) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const value = textarea.value
    const selected = value.slice(start, end)

    let newValue: string
    let newCursorPos: number

    if (action.block) {
      // For block-level actions, insert at start of line
      const lineStart = value.lastIndexOf('\n', start - 1) + 1
      newValue = value.slice(0, lineStart) + action.prefix + value.slice(lineStart)
      newCursorPos = start + action.prefix.length
    } else if (selected) {
      newValue = value.slice(0, start) + action.prefix + selected + action.suffix + value.slice(end)
      newCursorPos = start + action.prefix.length + selected.length + action.suffix.length
    } else {
      newValue = value.slice(0, start) + action.prefix + action.suffix + value.slice(end)
      newCursorPos = start + action.prefix.length
    }

    onContentChange(newValue)

    // Restore focus and cursor position
    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    })
  }

  return (
    <div className="flex items-center gap-0.5 border-b border-slate-200 bg-slate-50 px-3 py-1.5">
      {ACTIONS.map((action, i) => (
        <button
          key={action.label}
          type="button"
          title={action.label}
          onClick={() => applyAction(action)}
          className={cn(
            'inline-flex items-center justify-center size-8 rounded-md transition-colors',
            'text-slate-600 hover:bg-slate-200 hover:text-slate-900',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6467f2]/50',
            i === 3 && 'ml-2',
            i === 5 && 'ml-2'
          )}
        >
          <span className="material-symbols-outlined text-[18px]">{action.icon}</span>
        </button>
      ))}
    </div>
  )
}
