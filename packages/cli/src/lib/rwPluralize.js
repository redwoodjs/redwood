import * as plurals from 'pluralize'

const mappings = {
  toSingular: {},
  toPlural: {},
}

/**
 * Find Bar in FooBazBar
 *
 * @type {(str: string) => string }
 */
function lastWord(str) {
  const capitals = str.match(/[A-Z]/g)
  const lastIndex = str.lastIndexOf(capitals?.slice(-1))

  return lastIndex >= 0 ? str.slice(lastIndex) : str
}

/**
 * Returns the plural form of the given word
 *
 * @type {(word: string) => string }
 */
export function pluralize(word) {
  if (mappings.toPlural[word]) {
    return mappings.toPlural[word]
  }

  // Sometimes `word` is a PascalCased multi-word, like FarmEquipment
  // In those cases we only want to pass the last word on to the `pluralize`
  // library
  const singular = lastWord(word)
  const base = word.slice(0, word.length - singular.length)

  if (mappings.toPlural[singular]) {
    return base + mappings.toPlural[singular]
  }

  return base + plurals.plural(singular)
}

/**
 * Returns the singular form of the given word
 *
 * @type {(word: string) => string }
 */
export function singularize(word) {
  if (mappings.toSingular[word]) {
    return mappings.toSingular[word]
  }

  const plural = lastWord(word)
  const base = word.slice(0, word.length - plural.length)

  if (mappings.toSingular[plural]) {
    return base + mappings.toSingular[plural]
  }

  return base + plurals.singular(plural)
}

/** @type {(word: string) => boolean } */
export function isPlural(word) {
  return plurals.isPlural(lastWord(word))
}

/** @type {(word: string) => boolean } */
export function isSingular(word) {
  return plurals.isSingular(lastWord(word))
}

/** @type {(singular: string, plural: string) => undefined } */
export function addSingularPlural(singular, plural) {
  const existingPlural = Object.keys(mappings.toSingular).find(
    (key) => mappings.toSingular[key] === singular
  )
  delete mappings.toSingular[existingPlural]

  mappings.toPlural[singular] = plural
  mappings.toSingular[plural] = singular
}
