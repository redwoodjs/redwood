import { appendFileUnique } from '../fs'

describe('appendFileUnique', () => {
  let CONTENTS = undefined

  const myHost = {
    readFileSync: () => CONTENTS,
    appendFileSync: (_path, contents) => (CONTENTS += contents),
  }

  beforeEach(() => {
    CONTENTS = `
    export const dog = () => {}
    export const cat = () => {}
`
  })

  it('mock works properly', () => {
    appendFileUnique('test.txt', 'export const pie = () => {}', myHost)
    expect(CONTENTS).toMatchInlineSnapshot(`
      "
          export const dog = () => {}
          export const cat = () => {}
      export const pie = () => {}"
    `)
  })

  it('contents of a file should remain unique', () => {
    appendFileUnique('test.txt', 'export const dog = () => {}', myHost)
    expect(CONTENTS).toMatchInlineSnapshot(`
      "
          export const dog = () => {}
          export const cat = () => {}
      "
    `)
  })
})
