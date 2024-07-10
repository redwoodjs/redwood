import { useEffect, useCallback, useState, useRef, useId } from 'react'

import { block, unblock, type BlockerCallback } from './history'

type BlockerState = 'IDLE' | 'BLOCKED'

interface UseBlockerOptions {
  when: boolean
}

export function useBlocker({ when }: UseBlockerOptions) {
  const [blockerState, setBlockerState] = useState<BlockerState>('IDLE')
  const [pendingNavigation, setPendingNavigation] = useState<
    (() => void) | null
  >(null)
  const blockerId = useId()

  const blocker: BlockerCallback = useCallback(
    ({ retry }) => {
      if (when) {
        setBlockerState('BLOCKED')
        setPendingNavigation(() => retry)
      } else {
        retry()
      }
    },
    [when],
  )

  useEffect(() => {
    if (when) {
      block(blockerId, blocker)
    } else {
      unblock(blockerId)
    }
    return () => unblock(blockerId)
  }, [when, blocker, blockerId])

  const confirm = useCallback(() => {
    setBlockerState('IDLE')
    if (pendingNavigation) {
      pendingNavigation()
      setPendingNavigation(null)
    }
  }, [pendingNavigation])

  const abort = useCallback(() => {
    setBlockerState('IDLE')
    setPendingNavigation(null)
  }, [])

  return { state: blockerState, confirm, abort }
}
