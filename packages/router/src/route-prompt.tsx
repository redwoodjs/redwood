import React, { useEffect } from 'react'

import { useNavigation } from './NavigationContext'

interface RoutePromptProps extends React.HTMLAttributes<HTMLDivElement> {
  when?: boolean
}

const RoutePrompt = React.forwardRef<HTMLDivElement, RoutePromptProps>(
  ({ when, children, ...props }, ref) => {
    const { blocked, block, unblock } = useNavigation()

    // The browser will display a generic message in the language of the browser.
    // eg. "Reload page? Changes you made may not be saved."
    // https://caniuse.com/mdn-api_window_beforeunload_event_generic_string_displayed
    // custom messages are deprecated and should not be used
    const confirm = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }

    useEffect(() => {
      if (when) {
        block()
        window.addEventListener('beforeunload', confirm)
      }
      return () => {
        unblock()
        window.removeEventListener('beforeunload', confirm)
      }
    }, [block, unblock, when])

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
  const { unblock } = useNavigation()

  const handleClick = () => {
    if (onClick) {
      onClick()
    }
    unblock()
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
    const { flush, unblock } = useNavigation()

    const handleClick = () => {
      if (onClick) {
        onClick()
      }
      flush()
      unblock()
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
