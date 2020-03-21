import { matchPath } from '../util'

const coreParamTypes = {
  Int: {
    constraint: /\d+/,
    transform: Number,
  },
}

describe('matchPath', () => {
  it('matches paths correctly', () => {
    expect(matchPath('/post/{id:Int}', '/post/7', coreParamTypes)).toEqual({
      match: true,
      params: { id: 7 },
    })

    expect(
      matchPath(
        '/blog/{year}/{month}/{day}',
        '/blog/2019/12/07',
        coreParamTypes
      )
    ).toEqual({ match: true, params: { day: '07', month: '12', year: '2019' } })

    expect(matchPath('/about', '/', coreParamTypes)).toEqual({ match: false })
  })

  it('transforms a param based on the specified transform', () => {
    expect(matchPath('/post/{id:Int}', '/post/1337', coreParamTypes)).toEqual({
      match: true,
      params: { id: 1337 },
    })
  })
})
