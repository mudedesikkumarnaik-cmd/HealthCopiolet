import type { ReactNode } from 'react'
import { AlertTriangle, Bot, RefreshCw, UserRound } from 'lucide-react'
import type { ChatMessage as ChatMessageModel } from '@/types/health'
import { formatTime } from '@/utils/formatters'
import { cn } from '@/utils/cn'

function renderInline(text: string, keyBase: string): ReactNode[] {
  const parts: ReactNode[] = []
  const regex = /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|_[^_]+_)/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index))
    const token = match[0]
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token)
    if (link) {
      parts.push(
        <a
          key={`${keyBase}-a${key}`}
          href={link[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-brand-700 underline decoration-brand-300 underline-offset-2 hover:text-brand-800 dark:text-brand-300"
        >
          {link[1]}
        </a>,
      )
    } else if (token.startsWith('**')) {
      parts.push(
        <strong key={`${keyBase}-b${key}`} className="font-semibold text-ink">
          {token.slice(2, -2)}
        </strong>,
      )
    } else {
      parts.push(
        <em key={`${keyBase}-i${key}`} className="not-italic text-muted">
          {token.slice(1, -1)}
        </em>,
      )
    }
    key += 1
    lastIndex = match.index + token.length
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return parts
}

/** Turns the assistant's simple markdown-ish text into accessible HTML nodes. */
export function renderRichText(content: string, keyBase = 'msg'): ReactNode[] {
  const blocks = content.split('\n')
  const nodes: ReactNode[] = []
  let list: Array<{ kind: 'ul' | 'ol'; items: ReactNode[] }> = []
  let index = 0

  const flushList = () => {
    if (list.length === 0) return
    for (const group of list) {
      const ListTag = group.kind === 'ul' ? 'ul' : 'ol'
      const className = group.kind === 'ul' ? 'list-disc' : 'list-decimal'
      nodes.push(
        <ListTag key={`${keyBase}-list${index}`} className={cn('my-2 ml-5 space-y-1', className)}>
          {group.items.map((item, itemIndex) => (
            <li key={`${keyBase}-li${index}-${itemIndex}`}>{item}</li>
          ))}
        </ListTag>,
      )
      index += 1
    }
    list = []
  }

  for (const raw of blocks) {
    const line = raw.trim()
    if (!line) {
      flushList()
      continue
    }
    if (line.startsWith('### ')) {
      flushList()
      nodes.push(
        <h4 key={`${keyBase}-h${index}`} className="mb-1 mt-3 text-sm font-bold text-ink">
          {renderInline(line.slice(4), `${keyBase}-h${index}`)}
        </h4>,
      )
      index += 1
    } else if (/^[-•]\s+/.test(line)) {
      const item = line.replace(/^[-•]\s+/, '')
      const last = list[list.length - 1]
      if (last && last.kind === 'ul') last.items.push(renderInline(item, `${keyBase}-u${index}`))
      else list.push({ kind: 'ul', items: [renderInline(item, `${keyBase}-u${index}`)] })
    } else if (/^\d+[.)]\s+/.test(line)) {
      const item = line.replace(/^\d+[.)]\s+/, '')
      const last = list[list.length - 1]
      if (last && last.kind === 'ol') last.items.push(renderInline(item, `${keyBase}-o${index}`))
      else list.push({ kind: 'ol', items: [renderInline(item, `${keyBase}-o${index}`)] })
    } else {
      flushList()
      nodes.push(
        <p key={`${keyBase}-p${index}`} className="my-1.5 first:mt-0 last:mb-0">
          {renderInline(line, `${keyBase}-p${index}`)}
        </p>,
      )
      index += 1
    }
  }
  flushList()
  return nodes
}

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 px-1 py-2" role="status" aria-label="Assistant is preparing a response">
      <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-brand-600 text-white">
        <Bot aria-hidden="true" className="size-4" />
      </span>
      <span className="inline-flex items-center gap-1 rounded-2xl rounded-bl-md border border-line bg-surface px-3.5 py-2.5 shadow-card">
        <span className="size-1.5 animate-pulse-soft rounded-full bg-brand-500" />
        <span className="size-1.5 animate-pulse-soft rounded-full bg-brand-500 [animation-delay:200ms]" />
        <span className="size-1.5 animate-pulse-soft rounded-full bg-brand-500 [animation-delay:400ms]" />
      </span>
    </div>
  )
}

export function ChatMessage({
  message,
  onRetry,
}: {
  message: ChatMessageModel
  onRetry?: (messageId: string) => void
}) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex items-start justify-end gap-2.5 px-1 py-1.5">
        <div className="max-w-[85%] sm:max-w-[75%]">
          <div className="rounded-2xl rounded-tr-md bg-brand-600 px-4 py-2.5 text-sm text-white shadow-card dark:bg-brand-500 dark:text-brand-950">
            {message.attachment ? (
              <img
                src={message.attachment.dataUrl}
                alt={message.attachment.name || 'Photo you shared'}
                className="mb-2 max-h-56 w-full rounded-xl object-cover ring-1 ring-white/30"
              />
            ) : null}
            {message.content ? (
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
            ) : null}
          </div>
          <p className="mt-1 text-right text-[0.68rem] text-muted">{formatTime(message.createdAt)}</p>
        </div>
        <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-surface-2 text-muted">
          <UserRound aria-hidden="true" className="size-4" />
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-2.5 px-1 py-1.5">
      <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-brand-600 text-white dark:bg-brand-500 dark:text-brand-950">
        <Bot aria-hidden="true" className="size-4" />
      </span>
      <div className="min-w-0 max-w-[88%] sm:max-w-[80%]">
        <div className="rounded-2xl rounded-tl-md border border-line bg-surface px-4 py-3 text-sm text-ink-soft shadow-card">
          {message.error ? (
            <div className="flex items-start gap-2 text-rose-600 dark:text-rose-300">
              <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <div>
                <p className="font-semibold">The assistant could not reply this time.</p>
                <p className="mt-0.5 text-xs">{message.content}</p>
                {onRetry ? (
                  <button
                    type="button"
                    onClick={() => onRetry(message.id)}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-surface-2"
                  >
                    <RefreshCw aria-hidden="true" className="size-3.5" />
                    Try again
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="[overflow-wrap:anywhere]">{renderRichText(message.content)}</div>
          )}
        </div>
        <p className="mt-1 text-[0.68rem] text-muted">{formatTime(message.createdAt)}</p>
      </div>
    </div>
  )
}