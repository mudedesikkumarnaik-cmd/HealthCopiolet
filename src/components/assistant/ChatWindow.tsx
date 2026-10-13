import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { AlertTriangle, Bot, MessageSquarePlus, Sparkles } from 'lucide-react'
import type { ChatThread } from '@/types/health'
import type { ChatAttachment } from '@/types/health'
import { Button } from '@/components/common/Button'
import { ChatComposer } from './ChatComposer'
import { ChatMessage, TypingIndicator } from './ChatMessage'
import { SuggestedQuestions } from './SuggestedQuestions'
import { useDismissable } from '@/hooks/useDismissable'

export interface ChatWindowProps {
  thread: ChatThread
  isTyping: boolean
  assistantEnabled: boolean
  providerLabel: string
  suggestedQuestions: string[]
  onSend: (text: string, attachment?: ChatAttachment) => void
  onStartNewChat: () => void
  onClearChat: () => void
  onRetry: (messageId: string) => void
  children?: ReactNode
}

export function ConversationEmpty() {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
        <Bot aria-hidden="true" className="size-7" />
      </span>
      <div>
        <p className="font-semibold text-ink">Start a new conversation</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
          Ask about your records, health terms or visit preparation. Type, speak or attach a photo —
          every reply is general educational information.
        </p>
      </div>
    </div>
  )
}

export function ChatWindow({
  thread,
  isTyping,
  assistantEnabled,
  providerLabel,
  suggestedQuestions,
  onSend,
  onStartNewChat,
  onClearChat,
  onRetry,
}: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  useDismissable(menuRef, menuOpen, () => setMenuOpen(false))

  const messages = thread.messages

  useEffect(() => {
    const node = scrollRef.current
    if (!node) return
    node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' })
  }, [messages.length, isTyping])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Thread toolbar */}
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-ink">
            {thread.title || 'New conversation'}
          </h2>
          <p className="flex items-center gap-1.5 text-[0.68rem] text-muted">
            <Sparkles aria-hidden="true" className="size-3 text-brand-600 dark:text-brand-300" />
            {providerLabel}
          </p>
        </div>
        <div className="relative flex items-center gap-2" ref={menuRef}>
          <Button variant="secondary" size="sm" onClick={onStartNewChat} leftIcon={<MessageSquarePlus className="size-4" />}>
            New chat
          </Button>
          {messages.length > 0 ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMenuOpen((open) => !open)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
              >
                More
              </Button>
              {menuOpen ? (
                <div className="absolute right-0 top-11 z-20 w-48 animate-fade-in rounded-xl border border-line bg-surface p-1 shadow-pop">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false)
                      onClearChat()
                    }}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10"
                  >
                    Clear this conversation
                  </button>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        aria-live="polite"
        aria-relevant="additions"
        className="hc-scroll flex-1 space-y-1 overflow-y-auto bg-canvas/40 px-3 py-4 sm:px-4"
      >
        {messages.length === 0 ? <ConversationEmpty /> : null}
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} onRetry={onRetry} />
        ))}
        {isTyping ? <TypingIndicator /> : null}
      </div>

      {/* Composer + suggestions */}
      <div className="border-t border-line bg-surface px-4 py-3">
        {!assistantEnabled ? (
          <AssistantDisabledNotice />
        ) : messages.length === 0 ? (
          <SuggestedQuestions
            questions={suggestedQuestions.slice(0, 4)}
            onPick={onSend}
            disabled={isTyping || !assistantEnabled}
            className="mb-3"
          />
        ) : null}
        <ChatComposer onSend={onSend} disabled={isTyping || !assistantEnabled || !thread} />
      </div>
    </div>
  )
}

function AssistantDisabledNotice() {
  return (
    <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
      <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <p>
        The AI assistant is currently turned off in
        <span className="font-semibold"> Settings → AI Preferences</span>. Re-enable it there to
        continue chatting.
      </p>
    </div>
  )
}