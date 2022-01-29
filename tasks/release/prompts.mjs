/* eslint-env node, es2021 */
import c from 'ansi-colors'
import boxen from 'boxen'
import prompts from 'prompts'

/**
 * Wrapper around `prompts` to exit on crtl c.
 *
 * @template Name
 * @param {import('prompts').PromptObject<Name>} promptsObject
 * @param {import('prompts').Options} promptsOptions
 */
export function exitOnCancelPrompts(promptsObject, promptsOptions) {
  return prompts(promptsObject, {
    ...promptsOptions,
    onCancel: () => process.exit(1),
  })
}

/**
 * @typedef {'major' | 'minor' | 'patch'} Semver
 * @returns {Promise<Semver>}
 */
export async function promptForSemver() {
  const { semver } = await exitOnCancelPrompts({
    type: 'select',
    name: 'semver',
    message: ask`Which semver are you releasing?`,
    choices: [{ value: 'major' }, { value: 'minor' }, { value: 'patch' }],
    initial: 2,
  })

  return semver
}

/**
 * Wrapper around confirm-type `prompts`.
 *
 * @param {string} message
 * @returns {Promise<boolean>}
 */
export async function confirm(message) {
  const { confirmed } = await exitOnCancelPrompts({
    type: 'confirm',
    name: 'confirmed',
    message,
  })

  return confirmed
}

/**
 * @param {string} message
 */
export function rocketBoxen(message) {
  return boxen(message, {
    padding: 1,
    margin: 1,
    borderStyle: {
      bottomLeft: '🚀',
      bottomRight: '🚀',
      horizontal: '—',
      topLeft: '🚀',
      topRight: '🚀',
      vertical: '🚀',
    },
  })
}

/**
 * @param {string} prefix
 * @returns (string, ...values) => string
 */
function makeStringFormatter(prefix) {
  return function formatter(strings, ...values) {
    const message = strings.reduce(
      (string, nextString, i) =>
        (string += nextString + c.green(values[i] ?? '')),
      ''
    )

    return `${prefix} ${message}`
  }
}

export const ASK = c.bgBlue(c.black('  ASK  '))
export const CHECK = c.bgYellow(c.black(' CHECK '))
export const FIX = c.bgRed(c.black('  FIX  '))
export const OK = c.bgGreen(c.black('  O K  '))
// https://stackoverflow.com/questions/38760554/how-to-print-cross-mark-or-check-mark-in-tcl
export const HEAVY_X = c.red('\u2716')
export const HEAVY_CHECK = c.green('\u2714')

export const ask = makeStringFormatter(ASK)
export const check = makeStringFormatter(CHECK)
export const fix = makeStringFormatter(`${HEAVY_X} ${FIX}`)
export const ok = makeStringFormatter(`${HEAVY_CHECK} ${OK}`)

/**
 * @param {string} message
 * @param {Array<() => Promise<any>>} runs
 */
export async function confirmRuns(message, runs) {
  const confirmed = await confirm(message)

  if (!confirmed) {
    return false
  }

  if (!Array.isArray(runs)) {
    return runs()
  }

  const runResults = []

  for (const run of runs) {
    const runResult = await run()
    runResults.push(runResult)
  }

  return runResults
}
