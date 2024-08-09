import { describe, expect, vi, it } from 'vitest'

// import * as worker from '../worker'

// so that registerApiSideBabelHook() doesn't freak out about redwood.toml
vi.mock('@redwoodjs/babel-config')

describe('worker', () => {
  it('placeholder', () => {
    expect(true).toBeTruthy()
  })
})
