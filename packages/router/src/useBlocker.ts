import { useCallback, useEffect, useState } from 'react'

import type { Location } from './location'
import type { NavigationAction } from './navigation'
import { NavigationMethod } from './navigation'
import { useNavigation } from './navigation'

enum BlockState {
  UNBLOCKED,
  BLOCKED,
}

type BlockedLocation = Location | null

export interface BlockerContextValue {
  state: string
  location: BlockedLocation
  confirm: () => void
  abort: () => void
}

export type BlockerFunction = (args: {
  from: Location
  to: Location
  method: NavigationMethod
}) => boolean

export type BlockedAction = NavigationAction

export type ShouldBlock = boolean | BlockerFunction

type ConfirmFn = () => void

const useBlocker = (when: ShouldBlock): BlockerContextValue => {
  const { navigation, register, unregister } = useNavigation()
  const [blockState, setBlockState] = useState<BlockState>(BlockState.UNBLOCKED)
  const [blockedLocation, setBlockeedLocation] = useState<BlockedLocation>(null)
  const [confirmBlocked, setConfirmBlocked] = useState<ConfirmFn | null>(null)

  const block = (
    blocked: boolean,
    location: Location,
    confirm?: ConfirmFn
  ): boolean => {
    setBlockState(blocked ? BlockState.BLOCKED : BlockState.UNBLOCKED)
    setBlockeedLocation(blocked ? location : null)
    setConfirmBlocked(blocked ? confirm || null : null)
    return blocked
  }

  const navigationBlocker = useCallback(
    (
      from: Location,
      to: Location,
      method: NavigationMethod,
      confirm?: ConfirmFn
    ) => {
      if (typeof when !== 'function') {
        return block(!!when, to, confirm)
      } else {
        return block(when({ from, to, method }), to, confirm)
      }
    },
    [when]
  )

  const unloadBlocker = useCallback(
    (ev: BeforeUnloadEvent) => {
      let blocks = false
      if (typeof when !== 'function') {
        blocks = !!when
      } else {
        const { from, to } = navigation
        blocks = when({ from, to, method: NavigationMethod.UNLOAD })
      }
      if (blocks) {
        ev.preventDefault()
      }
    },
    [navigation, when]
  )

  useEffect(() => {
    window.addEventListener('beforeunload', unloadBlocker)
    const blockerId = register(navigationBlocker)
    return () => {
      window.removeEventListener('beforeunload', unloadBlocker)
      unregister(blockerId)
    }
  }, [register, unregister, unloadBlocker, navigationBlocker])

  const confirm = useCallback(() => {
    setBlockState(BlockState.UNBLOCKED)
    confirmBlocked?.()
  }, [confirmBlocked])

  const abort = () => {
    setBlockState(BlockState.UNBLOCKED)
    setConfirmBlocked(null)
  }

  return {
    state: BlockState[blockState],
    location: blockedLocation,
    confirm,
    abort,
  }
}

export { useBlocker }
