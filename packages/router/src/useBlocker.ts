import { useCallback, useEffect, useState } from 'react'

import { useNavigation, type HistoryAction, ActionType } from './navigation'

enum BlockerState {
  UNBLOCKED,
  BLOCKED,
  PROCEEDING,
}

export interface BlockerContextValue {
  state: string
  proceed: () => void
  reset: () => void
}

export type BlockerFunction = (args: { from: string; to: string }) => boolean

export type ShouldBlock = boolean | BlockerFunction

type BlockedAction = HistoryAction

/*
const handleIntercept: NavigationInterceptorFn = (from, to, action) => {
      console.log('intercepting')
      console.log('from', from)
      console.log('to', to)
      console.log('action', action)
      setTo(action)
      const blockWhen = typeof when === 'function' ? when({ from, to }) : when
      const shouldBlock = blockWhen && blockerState !== BlockerState.PROCEEDING
      setBlockerState(
        shouldBlock ? BlockerState.BLOCKED : BlockerState.UNBLOCKED
      )
      return shouldBlock
    }*/

const useBlocker = (_when: ShouldBlock): BlockerContextValue => {
  const { register, unregister } = useNavigation()
  const [blockerState, setBlockerState] = useState<BlockerState>(
    BlockerState.UNBLOCKED
  )
  const [blockedAction, _setBockedAction] = useState<BlockedAction | null>(null)

  useEffect(() => {
    //test always block
    const interceptorId = register(() => {
      return true
    })
    return () => {
      unregister(interceptorId)
    }
  }, [register, unregister])

  const proceed = useCallback(() => {
    console.log('proceeding')
    setBlockerState(BlockerState.PROCEEDING)
    if (blockedAction) {
      const { type, data, unused, url } = blockedAction
      if (type === ActionType.PUSH) {
        window.history.pushState(data, unused, url)
      } else {
        window.history.replaceState(data, unused, url)
      }
    }
  }, [blockedAction])

  const reset = () => {
    console.log('resetting')
    setBlockerState(BlockerState.UNBLOCKED)
  }

  return {
    state: BlockerState[blockerState],
    proceed,
    reset,
  }
}

export { useBlocker }
