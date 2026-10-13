import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Bot, MessageSquarePlus, Sparkles, Trash2 } from 'lucide-react'
import { ChatWindow } from '@/components/assistant/ChatWindow'
import { renderRichText } from '@/components/assistant/ChatMessage'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeading } from '@/components/common/PageHeading'
import { useAppData } from '@/context/DataContext'
import { usePreferences } from '@/context/PreferencesContext'
import { aiService } from '@/services/aiService'
import type { AiContext } from '@/services/aiService'
import { nextAppointment } from '@/services/appointmentsService'
import type { ChatAttachment, ChatMessage } from '@/types/health'
import { cn } from '@/utils/cn'
import { formatDateTime, formatRelativeTime, uid } from '@/utils/formatters'

/** Shown above a reply whenever the user shared a photo. */
const PHOTO_NOTE =
  '**About your photo:** it is kept in this conversation as a record, but this assistant cannot open or scan the image — no diagnosis happens from a picture. To help you understand a **report or a visible symptom**, just **type the key details you can see** (for example “HbA1c 7.2%”, “LDL 160 mg/dL”, or “red itchy rash on my arm for 3 days”) and I will explain each one in plain language — the possible causes, the tests usually done and the medicines commonly discussed.'

interface PendingReply {
  threadId: string
  userPrompt: string
}

export function AssistantPage() {
  const {
    profile,
    records,
    medications,
    appointments,
    chatThreads,
    activeThreadId,
    setActiveThreadId,
    createThread,
    appendMessage,
    updateMessage,
    deleteThread,
  } = useAppData()
  const { preferences } = usePreferences()
  const location = useLocation()

  const assistantEnabled = preferences.ai.assistantEnabled
  const providerInfo = useMemo(() => aiService.getProviderInfo(), [])
  const suggestedQuestions = useMemo(() => aiService.getSuggestedQuestions(), [])

  const [isTyping, setIsTyping] = useState(false)
  const pendingRef = useRef<PendingReply | null>(null)
  const consumedPromptRef = useRef<string | null>(null)

  const aiContext = useMemo<AiContext>(() => {
    const next = nextAppointment(appointments)
    return {
      userName: profile.fullName,
      recordCount: records.length,
      recordTitles: records.slice(0, 5).map((record) => record.title),
      activeMedications: medications.filter((medication) => medication.status === 'active').length,
      medicationNames: medications.slice(0, 6).map((medication) => medication.name),
      nextAppointmentLabel: next ? `${next.title} · ${formatDateTime(next.date)}` : undefined,
      hasUploadedRecords: records.some((record) => record.tags.includes('uploaded')),
    }
  }, [profile.fullName, records, medications, appointments])

  const sortedThreads = useMemo(
    () =>
      [...chatThreads].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
    [chatThreads],
  )

  const activeThread = sortedThreads.find((thread) => thread.id === activeThreadId) ?? null

  const buildHistory = useCallback(
    (threadId: string, extra?: ChatMessage): ChatMessage[] => {
    const thread = chatThreads.find((t) => t.id === threadId)
    const base = thread
      ? thread.messages.filter((message) => !message.pending && !message.error)
      : []
    return extra ? [...base, extra] : base
    },
    [chatThreads],
  )

  const sendMessage = useCallback(
    async (text: string, attachment?: ChatAttachment, options?: { newThread?: boolean }) => {
    const trimmed = text.trim()
    if ((!trimmed && !attachment) || !assistantEnabled || isTyping) return

    const promptText = trimmed || 'I shared a photo and would like some guidance.'

    // Continue the active conversation — every follow-up stays in the same
    // thread. A new thread is created when there is no active conversation (on
    // arrival, after "New chat", or after leaving the page), or when a caller
    // explicitly requests one (the dashboard quick actions).
    let threadId = options?.newThread ? undefined : activeThread?.id
    if (!threadId) {
      threadId = createThread(aiService.titleFromPrompt(promptText)).id
    }
    if (!threadId) return

    const userMessage: ChatMessage = {
      id: uid('msg'),
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
      isDemo: false,
      attachment,
    }
    appendMessage(threadId, userMessage)

    setIsTyping(true)
    pendingRef.current = { threadId, userPrompt: promptText }

    try {
      const reply = await aiService.ask(promptText, buildHistory(threadId, userMessage), aiContext)
      if (pendingRef.current?.threadId === threadId) {
        const content = attachment ? `${PHOTO_NOTE}\n\n${reply.content}` : reply.content
        appendMessage(threadId, {
          id: uid('msg'),
          role: 'assistant',
          content,
          createdAt: new Date().toISOString(),
          isDemo: reply.isDemo,
        })
      }
    } catch (error) {
      if (pendingRef.current?.threadId === threadId) {
        appendMessage(threadId, {
          id: uid('msg'),
          role: 'assistant',
          content: error instanceof Error ? error.message : 'Something went wrong while preparing a reply.',
          createdAt: new Date().toISOString(),
          isDemo: true,
          error: true,
        })
      }
    } finally {
      if (pendingRef.current?.threadId === threadId) {
        pendingRef.current = null
        setIsTyping(false)
      }
    }
  }, [
    assistantEnabled,
    isTyping,
    activeThread,
    chatThreads,
    createThread,
    appendMessage,
    aiContext,
    buildHistory,
  ])

  /**
   * Opening the assistant always starts a fresh conversation; previous chats
   * stay available in the history list. This runs on mount — arriving on the
   * page, or navigating back to it after leaving.
   */
  useEffect(() => {
    // A dashboard quick action carries a prompt and starts its own fresh thread
    // in the effect below; don't clear the active thread when one is pending.
    const prompt = (location.state as { prompt?: string } | null)?.prompt
    if (prompt) return
    setActiveThreadId(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** Applies a loaded `location.state.prompt` (quick action from the dashboard). */
  useEffect(() => {
    const prompt = (location.state as { prompt?: string } | null)?.prompt
    if (!prompt) return
    if (consumedPromptRef.current === prompt) return
    consumedPromptRef.current = prompt
    // Always start a fresh thread so the quick action never lands in a
    // previously active conversation.
    void sendMessage(prompt, undefined, { newThread: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const retryMessage = async (messageId: string) => {
    const thread = sortedThreads.find((t) => t.id === activeThread?.id)
    if (!thread || isTyping) return
    const index = thread.messages.findIndex((message) => message.id === messageId)
    if (index < 0) return
    let prompt: string | undefined
    for (let i = index - 1; i >= 0; i -= 1) {
      if (thread.messages[i].role === 'user') {
        prompt = thread.messages[i].content
        break
      }
    }
    if (!prompt) return

    setIsTyping(true)
    pendingRef.current = { threadId: thread.id, userPrompt: prompt }
    try {
      const reply = await aiService.ask(prompt, buildHistory(thread.id), aiContext)
      updateMessage(thread.id, messageId, {
        content: reply.content,
        isDemo: reply.isDemo,
        error: false,
        pending: false,
      })
    } catch (error) {
      updateMessage(thread.id, messageId, {
        content: error instanceof Error ? error.message : 'The retry did not complete.',
        error: true,
      })
    } finally {
      pendingRef.current = null
      setIsTyping(false)
    }
  }

  const startNewChat = () => {
    // Begin a fresh conversation. The empty thread is created on the first
    // message, so repeatedly pressing this does not leave empty threads behind.
    setActiveThreadId(null)
  }

  const clearActiveConversation = () => {
    if (activeThread) deleteThread(activeThread.id)
  }

  return (
    <PageContainer>
      <PageHeading
        title="AI Health Assistant"
        eyebrow="Assistant"
        description="Ask plain-language questions about your records, medicines, appointments and everyday health routines."
        actions={
          <>
            <Badge tone={providerInfo.isDemo ? 'brand' : 'info'} icon={<Bot className="size-3" />}>
              {providerInfo.label}
            </Badge>
            {providerInfo.model ? (
              <Badge tone="neutral">Model: {providerInfo.model}</Badge>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              onClick={startNewChat}
              leftIcon={<MessageSquarePlus className="size-4" />}
            >
              New conversation
            </Button>
          </>
        }
      />

      {providerInfo.isDemo ? <ProviderSetupNotice guide={providerInfo.setupGuide} /> : null}

      <div className="grid gap-4 lg:grid-cols-[16.5rem_1fr]">
        {/* Thread history — vertical list on desktop, horizontal chips on mobile */}
        <Card className="min-h-0 lg:sticky lg:top-20 lg:max-h-[calc(100dvh-10rem)] lg:self-start lg:flex-col">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-sm font-semibold text-ink">Conversations</h2>
            <span className="text-xs text-muted">{sortedThreads.length}</span>
          </div>
          <div className="hc-scroll flex gap-2 overflow-x-auto p-3 lg:block lg:h-[calc(100%-3.4rem)] lg:space-y-1 lg:overflow-y-auto">
            {sortedThreads.length === 0 ? (
              <p className="px-2 py-6 text-center text-xs text-muted">
                No conversations yet. Ask your first question below.
              </p>
            ) : (
              sortedThreads.map((thread) => {
                const isActive = thread.id === activeThread?.id
                return (
                  <div
                    key={thread.id}
                    className={cn(
                      'group relative flex w-64 shrink-0 items-center gap-2 rounded-xl border px-3 py-2.5 lg:w-auto',
                      isActive
                        ? 'border-brand-200 bg-brand-50/80 dark:border-brand-500/30 dark:bg-brand-500/10'
                        : 'border-transparent hover:border-line hover:bg-surface-2',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveThreadId(thread.id)}
                      className="min-w-0 flex-1 text-left"
                      aria-current={isActive ? 'true' : undefined}
                    >
                      <span className="block truncate text-sm font-medium text-ink">
                        {thread.title || 'New conversation'}
                      </span>
                      <span className="mt-0.5 block truncate text-[0.68rem] text-muted">
                        {thread.messages.length} message{thread.messages.length === 1 ? '' : 's'} ·{' '}
                        {formatRelativeTime(thread.updatedAt)}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteThread(thread.id)}
                      aria-label={`Delete conversation: ${thread.title}`}
                      className="grid size-7 shrink-0 place-items-center rounded-lg text-muted opacity-100 transition-colors hover:bg-rose-50 hover:text-rose-600 lg:opacity-0 lg:group-hover:opacity-100 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
                    >
                      <Trash2 aria-hidden="true" className="size-3.5" />
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </Card>

        {/* Chat area */}
        <Card className="flex min-h-[70dvh] flex-col overflow-hidden lg:min-h-[calc(100dvh-11rem)]">
          <ChatWindow
            thread={activeThread ?? { id: '', title: '', createdAt: '', updatedAt: '', messages: [] }}
            isTyping={isTyping}
            assistantEnabled={assistantEnabled}
            providerLabel={providerInfo.label}
            suggestedQuestions={suggestedQuestions}
            onSend={(text, attachment) => void sendMessage(text, attachment)}
            onStartNewChat={startNewChat}
            onClearChat={clearActiveConversation}
            onRetry={(id) => void retryMessage(id)}
          />
        </Card>
      </div>

      <p className="max-w-3xl text-xs leading-relaxed text-muted">
        <span className="font-semibold">General information only:</span> the assistant gives
        educational information from a built-in library and never provides a diagnosis or a
        prescription. It cannot read your uploaded files or photos. In an emergency, dial{' '}
        <span className="font-semibold">112</span> (India) or your local emergency number.
      </p>
    </PageContainer>
  )
}

function ProviderSetupNotice({ guide }: { guide: string }) {
  return (
    <details className="group rounded-2xl border border-line bg-surface-2/60 px-4 py-3 text-sm">
      <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold text-ink">
        <Sparkles aria-hidden="true" className="size-4 text-brand-600 dark:text-brand-300" />
        You are using the built-in assistant — connect a real AI model
        <span className="ml-auto text-xs font-normal text-muted group-open:hidden">Show</span>
        <span className="ml-auto hidden text-xs font-normal text-muted group-open:inline">Hide</span>
      </summary>
      <div className="mt-2 text-xs leading-relaxed text-ink-soft">{renderRichText(guide)}</div>
    </details>
  )
}