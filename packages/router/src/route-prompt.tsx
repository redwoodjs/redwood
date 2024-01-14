import React, { useCallback, useEffect } from 'react'

import { useNavigation } from './navigation'

interface RoutePromptProps extends React.HTMLAttributes<HTMLDivElement> {
  when?: boolean
}

/**
 * Renders a component when the user tries to navigate away from the page
 * and shows a message to the user on tab close or reload.
 */
const RoutePrompt = React.forwardRef<HTMLDivElement, RoutePromptProps>(
  ({ when, children, ...props }, ref) => {
    const { blocked, block } = useNavigation()

    const confirm = useCallback(
      (e: BeforeUnloadEvent) => {
        if (when) {
          e.preventDefault()
        }
      },
      [when]
    )

    useEffect(() => {
      block(!!when)
      window.addEventListener('beforeunload', confirm)
      return () => {
        block(false)
        window.removeEventListener('beforeunload', confirm)
      }
    }, [block, when, confirm])

    if (!blocked) {
      return null
    } else {
      return (
        <div ref={ref} {...props}>
          {children}
        </div>
      )
    }
  }
)
RoutePrompt.displayName = 'RoutePrompt'

export default RoutePrompt

interface RoutePromptButton extends React.HTMLAttributes<HTMLButtonElement> {
  onClick?: () => void
}

const RoutePromptConfirm = React.forwardRef<
  HTMLButtonElement,
  RoutePromptButton
>(({ onClick, children, ...props }, ref) => {
  const { confirm } = useNavigation()

  const handleClick = () => {
    if (onClick) {
      onClick()
    }
    confirm()
  }

  return (
    <button ref={ref} onClick={handleClick} {...props}>
      {children}
    </button>
  )
})
RoutePromptConfirm.displayName = 'RoutePromptConfirm'

const RoutePromptAbort = React.forwardRef<HTMLButtonElement, RoutePromptButton>(
  ({ onClick, children, ...props }, ref) => {
    const { abort } = useNavigation()

    const handleClick = () => {
      if (onClick) {
        onClick()
      }
      abort()
    }

    return (
      <button ref={ref} onClick={handleClick} {...props}>
        {children}
      </button>
    )
  }
)
RoutePromptAbort.displayName = 'RoutePromptAbort'

export { RoutePromptConfirm, RoutePromptAbort }
