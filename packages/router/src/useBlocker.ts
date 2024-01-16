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

const useBlocker = (when: ShouldBlock): BlockerContextValue => {
  const { navigation, register, unregister } = useNavigation()
  const [blockState, setBlockState] = useState<BlockState>(BlockState.UNBLOCKED)
  const [blockedLocation, setBlockeedLocation] = useState<BlockedLocation>(null)

  const block = (blocked: boolean, location: Location): boolean => {
    setBlockState(blocked ? BlockState.BLOCKED : BlockState.UNBLOCKED)
    setBlockeedLocation(blocked ? location : null)
    return blocked
  }

  const navigationBlocker = useCallback(
    (from: Location, to: Location, method: NavigationMethod) => {
      if (typeof when !== 'function') {
        return block(!!when, to)
      } else {
        return block(when({ from, to, method }), to)
      }
    },
    [when]
  )

  const unloadBlocker = useCallback(
    (ev: BeforeUnloadEvent) => {
      let blocks = false
      if (typeof when !== 'function') {
        blocks = block(!!when, navigation.to)
      } else {
        const { from, to } = navigation
        blocks = block(when({ from, to, method: NavigationMethod.UNLOAD }), to)
      }
      if (blocks) {
        ev.preventDefault()
      }
    },
    [navigation, when]
  )

  useEffect(() => {
    window.addEventListener('beforeunload', unloadBlocker)
    const interceptorId = register(navigationBlocker)
    return () => {
      window.removeEventListener('beforeunload', unloadBlocker)
      unregister(interceptorId)
    }
  }, [register, unregister, unloadBlocker, navigationBlocker])

  const confirm = () => {
    setBlockState(BlockState.UNBLOCKED)
  }

  const abort = () => {
    setBlockState(BlockState.UNBLOCKED)
  }

  return {
    state: BlockState[blockState],
    location: blockedLocation,
    confirm,
    abort,
  }
}

export { useBlocker }
