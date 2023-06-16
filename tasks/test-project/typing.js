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
 * @property {string=} parent The parent task to this task.
 * @property {string} title Title of this task.
 * @property {string=} content Reactive content.
 * @property {() => string|boolean=} skip Function that returns a string to
 *   show when skipping this task, or just true|false to indicate whether the
 *   task should be skipped or not.
 * @property {() => boolean=} enabled Whether this task is enabled or not.
 *   Disabled tasks don't show up in the list.
 * @property {() => Promise<unknown> | void} task
 *   The task to run. Will be passed an instance of TUI when called.
 */

/**
 * @typedef TuiTaskList
 * @type {Array<Omit<TuiTaskDef, 'step'>>}
 */

/**
 * @param {Promise<unknown> | void} promise
 * @return {promise is Promise<unknown>}
 */
function isAwaitable(promise) {
  return (
    typeof promise !== 'undefined' &&
    'then' in /** @type Promise<unknown> */ (promise)
  )
}

module.exports = {
  isAwaitable,
}
