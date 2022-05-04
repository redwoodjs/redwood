import { mapRwCorsOptionsToYoga } from '../cors'

describe('mapRwCorsOptionsToYoga', () => {
  it('Handles single endpoint, headers and method', () => {
    const output = mapRwCorsOptionsToYoga({
      origin: 'http://localhost:8910',
      allowedHeaders: 'X-Bazinga',
      methods: 'PATCH',
      credentials: true,
    }) //?

    expect(output).toEqual({
      credetials: true,
      allowedHeaders: ['X-Bazinga'],
      allowedMethods: ['PATCH'],
      origin: ['http://localhost:8910'],
    })
  })

  it('Handles options as an array', () => {
    const output = mapRwCorsOptionsToYoga({
      origin: ['http://localhost:8910'],
      credentials: false,
      allowedHeaders: ['X-Bazinga', 'X-Kittens', 'Authorization'],
      methods: ['PATCH', 'PUT', 'POST'],
    }) //?

    expect(output).toEqual({
      credetials: false,
      origin: ['http://localhost:8910'],
      allowedMethods: ['PATCH', 'PUT', 'POST'],
      allowedHeaders: ['X-Bazinga', 'X-Kittens', 'Authorization'],
    })
  })

  it('Handles multiple endpoints', () => {
    const output = mapRwCorsOptionsToYoga({
      origin: ['https://bazinga.com', 'https://softkitty.mew'],
      credentials: true,
      allowedHeaders: ['X-Bazinga', 'X-Kittens', 'Authorization'],
      methods: ['PATCH', 'PUT', 'POST'],
    })

    expect(output).toEqual({
      credetials: true,
      origin: ['https://bazinga.com', 'https://softkitty.mew'],
      allowedMethods: ['PATCH', 'PUT', 'POST'],
      allowedHeaders: ['X-Bazinga', 'X-Kittens', 'Authorization'],
    })
  })
})
