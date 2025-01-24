export interface TuiTaskDef {
  /** 0 based step number */
  step: number
  /** The parent task to this task. */
  parent?: string
  /** Title of this task. */
  title: string
  /** Reactive content */
  content?: string
  /**
   * Whether this task is enabled or not. Disabled tasks don't show up in the
   * list
   */
  enabled?: boolean | (() => boolean)
  /** The task to run. Will be passed an instance of TUI when called */
  task: () => Promise<unknown> | void
}

interface TuiTaskListItem {
  title: string
  enabled?: boolean | (() => boolean)
  task: () => Promise<unknown> | void
}

export type TuiTaskList = TuiTaskListItem[]

export function isAwaitable(promise: unknown): promise is Promise<unknown> {
  return (
    !!promise &&
    typeof promise === 'object' &&
    'then' in promise &&
    typeof promise.then === 'function'
  )
}

export function isTuiError(
  error: unknown,
): error is { message?: string; exitCode?: number } {
  return error instanceof Object
}
