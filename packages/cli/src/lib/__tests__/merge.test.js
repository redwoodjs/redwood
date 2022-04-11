import { merge } from '../merge'

it('deduplicates identical import namespace identifiers', () => {
  const base = "import * as React from 'react'"
  const ext = "import * as React from 'react'"
  const merged = "import * as React from 'react'\n"
  expect(merge(base, ext)).toBe(merged)
})

it('deduplicates identical import specifiers', () => {
  const base = "import { foo } from 'source'"
  const ext = "import { foo } from 'source'"
  const merged = "import { foo } from 'source'\n"
  expect(merge(base, ext)).toBe(merged)
})

it('merges import specifiers from the same source into one import', () => {
  const base = "import { bar } from 'source'"
  const ext = "import { foo } from 'source'"
  const merged = "import { bar, foo } from 'source'\n"
  expect(merge(base, ext)).toBe(merged)
})

it('deduplicates identical import specifiers from the same source', () => {
  const base = "import { bar, baz } from 'source'"
  const ext = "import { foo, bar } from 'source'"
  const merged = "import { bar, baz, foo } from 'source'\n"
  expect(merge(base, ext)).toBe(merged)
})

it('merges import default specifiers and import specifiers', () => {
  const base = "import def from 'source'"
  const ext = "import { foo } from 'source'"
  const merged = "import def, { foo } from 'source'\n"
  expect(merge(base, ext)).toBe(merged)
})

it('merges import default specifiers alongisde import specifiers with import specifiers', () => {
  const base = "import def, { foo } from 'source'"
  const ext = "import { bar } from 'source'"
  const merged = "import def, { foo, bar } from 'source'\n"
  expect(merge(base, ext)).toBe(merged)
})

it('merges import default specifiers and import specifiers, even if it must reorder them', () => {
  const base = "import { foo } from 'source'"
  const ext = "import def from 'source'"
  const merged = "import def, { foo } from 'source'\n"
  expect(merge(base, ext)).toBe(merged)
})

it('does not merge import namespace identifiers with conflicting local names', () => {
  const base = "import * as One from 'source'"
  const ext = "import * as Two from 'source'"
  const merged =
    "import * as One from 'source'\nimport * as Two from 'source'\n"
  expect(merge(base, ext)).toBe(merged)
})

it('does not merge default specifiers with conflicting local names', () => {
  const base = "import One from 'source'"
  const ext = "import Two from 'source'"
  const merged = "import One from 'source'\nimport Two from 'source'\n"
  expect(merge(base, ext)).toBe(merged)
})

it('does not merge side-effect imports and default imports', () => {
  const base = "import 'source'"
  const ext = "import Def from 'source'"
  const merged = "import 'source'\nimport Def from 'source'\n"
  expect(merge(base, ext)).toBe(merged)
})

it('does not merge side-effect imports and namespace imports', () => {
  const base = "import 'source'"
  const ext = "import * as Name from 'source'"
  const merged = "import 'source'\nimport * as Name from 'source'\n"
  expect(merge(base, ext)).toBe(merged)
})

it('does not merge side-effect imports import specifiers', () => {
  const base = "import 'source'"
  const ext = "import { foo, bar } from 'source'"
  const merged = "import 'source'\nimport { foo, bar } from 'source'\n"
  expect(merge(base, ext)).toBe(merged)
})

it('adds extension side-effect imports', () => {
  const base = "import def, { foo, bar } from 'source'"
  const ext = "import 'source'"
  const merged = "import def, { foo, bar } from 'source'\nimport 'source'\n"
  expect(merge(base, ext)).toBe(merged)
})

it('merges import default specifiers and import namespace identifiers', () => {
  const base = "import src from 'source'"
  const ext = "import * as Source from 'source'"
  const merged = "import src, * as Source from 'source'\n"
  expect(merge(base, ext)).toBe(merged)
})

it('merges import default specifiers and import namespace identifiers, even if it must reorder them', () => {
  const base = "import * as Source from 'source'"
  const ext = "import src from 'source'"
  const merged = "import src, * as Source from 'source'\n"
  expect(merge(base, ext)).toBe(merged)
})
