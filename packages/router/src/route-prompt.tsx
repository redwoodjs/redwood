import React, { useEffect } from "react"
import { gHistory } from './history'

 interface RoutePromptProps extends React.HTMLAttributes<HTMLDivElement> {
  when?: boolean
}

const RoutePrompt = React.forwardRef<
  HTMLDivElement,
  RoutePromptProps
>(({ when, children, ...props }, ref) => {

  useEffect(() => {
    if (!!when) gHistory.block()
    return () => gHistory.unblock();
  }, [when])

  if (!gHistory.blocked) return null
  else {
    return (
      <div ref={ref} {...props}>
        {children}
      </div>
    )
  }
})
RoutePrompt.displayName = 'RoutePrompt'

 interface RoutePromptButton extends React.HTMLAttributes<HTMLButtonElement> {
  onClick?: () => void
}

 const RoutePromptConfirm = React.forwardRef<
  HTMLButtonElement,
  RoutePromptButton
>(({ onClick, children, ...props }, ref) => {
  const handleClick = () => {
    if (onClick) onClick()
    gHistory.unblock()
  };

  return (
    <button ref={ref} onClick={handleClick} {...props} >
      {children}
    </button>
  )
})
RoutePromptConfirm.displayName = 'RoutePromptConfirm'

 const RoutePromptAbort = React.forwardRef<
  HTMLButtonElement,
  RoutePromptButton
>(({ onClick, children, ...props }, ref) => {
  const handleClick = () => {
    if (onClick) onClick()
    gHistory.flush()
    gHistory.unblock()
  };

  return (
    <button ref={ref} onClick={handleClick} {...props} >
      {children}
    </button>
  )
})
RoutePromptAbort.displayName = 'RoutePromptAbort'

export {RoutePrompt, RoutePromptConfirm, RoutePromptAbort}



