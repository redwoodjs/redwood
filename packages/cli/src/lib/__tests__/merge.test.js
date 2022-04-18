import path from 'path'

import fs from 'fs-extra'

import { merge } from '../merge'

describe('Import behavior', () => {
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

  it('merges multiple imports with the same source', () => {
    const base = "import { foo } from 'source'"
    const ext = "import { bar } from 'source'\nimport { baz } from 'source'"
    const merged = "import { foo, bar, baz } from 'source'\n"
    expect(merge(base, ext)).toBe(merged)
  })

  it('merges multiple default imports with the same source', () => {
    const base = "import default1 from 'source'"
    const ext = "import default2 from 'source'\nimport { foo } from 'source'"
    const merged =
      "import default1, { foo } from 'source'\nimport default2 from 'source'\n"
    expect(merge(base, ext)).toBe(merged)
  })

  it('merges multiple types of imports with the same source', () => {
    const base =
      "import default1 from 'source'\nimport * as namespace from 'source'"
    const ext = "import default2 from 'source'\nimport { foo } from 'source'"
    const merged =
      "import default1, { foo } from 'source'\nimport default2 from 'source'\nimport * as namespace from 'source'\n"
    expect(merge(base, ext)).toBe(merged)
  })
})

describe('Object behavior', () => {
  it('merges basic objects without conflicts', () => {
    const base = 'const x = { foo: "foo" }'
    const ext = 'const x = { bar: "bar" }'
    const merged = `\
const x = {
  foo: 'foo',
  bar: 'bar',
}
`
    expect(merge(base, ext)).toBe(merged)
  })
  it('deduplicates object properties', () => {
    const base = 'const x = { foo: "foo", bar: "bar" }'
    const ext = 'const x = { bar: "bar", baz: "baz" }'
    const merged = `\
const x = {
  foo: 'foo',
  bar: 'bar',
  baz: 'baz',
}
`
    expect(merge(base, ext)).toBe(merged)
  })
  it('merges nested object properties', () => {
    const base = 'const x = { foo: { nest: "nest" } }'
    const ext = 'const x = { foo: { bird: "bird" } }'
    const merged = `\
const x = {
  foo: {
    nest: 'nest',
    bird: 'bird',
  },
}
`
    expect(merge(base, ext)).toBe(merged)
  })
  it('deduplicates nested object properties', () => {
    const base = 'const x = { foo: { nest: "nest", bird: "bird" } }'
    const ext = 'const x = { foo: { bird: "bird" } }'
    const merged = `\
const x = {
  foo: {
    nest: 'nest',
    bird: 'bird',
  },
}
`
    expect(merge(base, ext)).toBe(merged)
  })
  it('merges nested arrays', () => {
    const base = 'const x = { foo: { arr: [1, 2, 3] } }'
    const ext = 'const x = { foo: { arr: [3, 4, 5] } }'
    const merged = `\
const x = {
  foo: {
    arr: [1, 2, 3, 4, 5],
  },
}
`
    expect(merge(base, ext)).toBe(merged)
  })
  it('merges deeply nested objects', () => {
    const base = 'const x = { foo: { bar: { baz: { bat: [1] } } } }'
    const ext = 'const x = { foo: { bar: { baz: { bat: [2] } } } }'
    const merged = `\
const x = {
  foo: {
    bar: {
      baz: {
        bat: [1, 2],
      },
    },
  },
}
`
    expect(merge(base, ext)).toBe(merged)
  })
})

describe('Array behavior', () => {
  it('merges arrays without duplicates', () => {
    const base = 'const x = [1, 2, 3]'
    const ext = 'const x = [4, 5, 6]'
    const merged = 'const x = [1, 2, 3, 4, 5, 6]\n'
    expect(merge(base, ext)).toBe(merged)
  })
  it('does not merge arrays with different identities', () => {
    const base = 'const x = [1, 2, 3]'
    const ext = 'const y = [4, 5, 6]'
    const merged = 'const x = [1, 2, 3]\nconst y = [4, 5, 6]\n'
    expect(merge(base, ext)).toBe(merged)
  })
  it('deduplicates values of arrays with the same identity', () => {
    const base = 'const x = [1, 2, 3]'
    const ext = 'const x = [3, 4, 5]'
    const merged = 'const x = [1, 2, 3, 4, 5]\n'
    expect(merge(base, ext)).toBe(merged)
  })
  it('Does not merge variable declarations with different types of initalizers', () => {
    const base = 'const x = [1, 2, 3]'
    const ext = 'const x = { foo: "foo" }'
    const merged = `\
const x = [1, 2, 3]
const x = {
  foo: 'foo',
}
`
    expect(merge(base, ext)).toBe(merged)
  })
})

describe('nop behavior', () => {
  it('does not merge strings', () => {
    const base = 'const x = "foo"'
    const ext = 'const x = "bar"'
    // TODO: File issue with babel. For the life of me I can't figure out why
    // `stringNode.insertAfter(otherStringNode)` yields
    // (otherStringNode, stringNode). Need a minimal reproduction.
    const merged = "const x = ('bar', 'foo')\n"
    expect(merge(base, ext)).toBe(merged)
  })
  it('does not merge nested strings', () => {
    const base = 'const x = { foo: { bar: "baz" } }'
    const ext = 'const x = { foo: { bar: "bat" } }'
    // As above. Why is 'bat' first here? Perplexing.
    const merged = `\
const x = {
  foo: {
    bar: ('bat', 'baz'),
  },
}
`
    const test = merge(base, ext)
    expect(test).toBe(merged)
  })
  it('does not merge functions', () => {
    const base = 'const x = (x, y) => x + y'
    const ext = 'const x = (x, y) => x - y'
    const merged = 'const x = (x, y) => x + y\n\nconst x = (x, y) => x - y\n'
    expect(merge(base, ext)).toBe(merged)
  })
})

describe('Comment behavior', () => {
  it('deduplicates comments on identical declarations', () => {
    const base = `\
// This is a test
const x = [1, 2, 3]
`
    const ext = `\
// This is a test
const x = [4, 5, 6]
`
    const merged = `\
// This is a test
const x = [1, 2, 3, 4, 5, 6]
`
    expect(merge(base, ext)).toBe(merged)
  })

  it('deduplicates comments on identical declarations, even if they have different types', () => {
    const base = `\
// This is a test
const x = [1, 2, 3]
`
    const ext = `\
/* This is a test */
const x = [4, 5, 6]
`
    const merged = `\
// This is a test
const x = [1, 2, 3, 4, 5, 6]
`
    expect(merge(base, ext)).toBe(merged)
  })

  it('Assumes comments pertain to the subsequent expression; trailing comments are disregarded', () => {
    const base = `\
import { foo } from 'source'
// This is a test
const x = [1, 2, 3]
`
    const ext = `\
import { bar } from 'source'
// This is a test
const x = [4, 5, 6]
`
    const merged = `\
import { foo, bar } from 'source'
// This is a test
const x = [1, 2, 3, 4, 5, 6]
`
    expect(merge(base, ext)).toBe(merged)
  })
})

describe('Integration tests', () => {
  const baseDir = './src/lib/__tests__/fixtures/merge'
  const tests = fs.readdirSync(baseDir).map((caseDir) => {
    return ['it.txt', 'base.jsx', 'ext.jsx', 'expected.jsx'].map((file) =>
      fs.readFileSync(path.join(baseDir, caseDir, file), { encoding: 'utf-8' })
    )
  })
  test.each(tests)('%s', (_it, base, ext, expected) => {
    const merged = merge(base, ext)
    if (merged !== expected) {
      console.log(merged)
    }
    expect(merged).toBe(expected)
  })
})
