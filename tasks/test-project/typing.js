/**
 * @typedef ExecaResult
 * @type {object}
 * @property {string} stdout
 * @property {string} stderr
 * @property {number} exitCode
 */

/**
 * @typedef TuiTaskDef
 * @type {object}
 * @property {number} step 0 based step number.
 * @property {string} title Title of this task.
 * @property {string=} content Reactive content.
 * @property {() => string|boolean=} skip Function that returns a string to
 *   show when skipping this task, or just true|false to indicate whether the
 *   task should be skipped or not.
 * @property {() => boolean=} enabled Whether this task is enabled or not.
 *   Disabled tasks don't show up in the list.
 * @property {() => Promise<ExecaResult> | Promise<TuiTaskList> | Promise<void> | void} task
 *   The task to run.
 */

/**
 * @typedef TuiTaskList
 * @type {Array<Omit<TuiTaskDef, 'step'>>}
 */

/**
 * @param {Promise<ExecaResult | TuiTaskList | void> | void} promise
 * @return {promise is Promise<ExecaResult | TuiTaskList | void>}
 */
export function isPromise(promise) {
  return (
    typeof promise !== 'undefined' &&
    'then' in /** @type Promise<ExecaResult | void> */ (promise)
  )
}

/**
 * @param {ExecaResult|TuiTaskList|void} result
 * @return {result is ExecaResult}
 */
export function isExecaResult(result) {
  return typeof result === 'object' && 'exitCode' in result
}
