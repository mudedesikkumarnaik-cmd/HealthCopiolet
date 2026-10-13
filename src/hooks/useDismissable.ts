import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'

/**
 * Calls `handler` when a pointer event happens outside `ref`, or when Escape is
 * pressed. Used by the header dropdown menus.
 */
export function useDismissable<T extends HTMLElement>(
  ref: RefObject<T | null>,
  active: boolean,
  onDismiss: () => void,
): void {
  const handlerRef = useRef(onDismiss)
  useEffect(() => {
    handlerRef.current = onDismiss
  })

  useEffect(() => {
    if (!active) return
    const handlePointer = (event: MouseEvent | TouchEvent) => {
      const node = ref.current
      if (!node) return
      if (event.target instanceof Node && !node.contains(event.target)) handlerRef.current()
    }
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handlerRef.current()
    }
    document.addEventListener('mousedown', handlePointer)
    document.addEventListener('touchstart', handlePointer)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handlePointer)
      document.removeEventListener('touchstart', handlePointer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [ref, active])
}
