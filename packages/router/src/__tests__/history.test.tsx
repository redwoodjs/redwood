import { navigate } from '../history'

describe('navigate', () => {
  it('does not add to the history if they are already at that location', () => {
    expect(global.history.length).toEqual(1)
    navigate('/test-1')
    expect(global.history.length).toEqual(2)
    navigate('/test-1')
    expect(global.history.length).toEqual(2)
  })

  it('does add to the history if they are already at that location', () => {
    expect(global.history.length).toEqual(2)
    navigate('/test-2')
    expect(global.history.length).toEqual(3)
    navigate('/test-3')
    expect(global.history.length).toEqual(4)
  })
})
