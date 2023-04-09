import { navigate } from '../history'

describe('navigate', () => {
  describe('does not increase history length', () => {
    it('handles direct matches for pathname, search, and hash', () => {
      expect(globalThis.history.length).toEqual(1)
      navigate('/test-1?search=testing#test')
      expect(globalThis.history.length).toEqual(2)
      navigate('/test-1?search=testing#test')
      expect(globalThis.history.length).toEqual(2)
    })
  })

  describe('increasing history length', () => {
    it('handles pathname', () => {
      expect(globalThis.history.length).toEqual(2)
      navigate('/test-2')
      expect(globalThis.history.length).toEqual(3)
      navigate('/test-3')
      expect(globalThis.history.length).toEqual(4)
    })

    it('handles search', () => {
      expect(globalThis.history.length).toEqual(4)
      navigate('/test-3')
      expect(globalThis.history.length).toEqual(4)
      navigate('/test-3?search=testing')
      expect(globalThis.history.length).toEqual(5)
      navigate('/test-3?search=testing')
      expect(globalThis.history.length).toEqual(5)
    })

    it('handles hash', () => {
      expect(globalThis.history.length).toEqual(5)
      navigate('/test-3')
      expect(globalThis.history.length).toEqual(6)
      navigate('/test-3#testing')
      expect(globalThis.history.length).toEqual(7)
      navigate('/test-3#testing')
      expect(globalThis.history.length).toEqual(7)
    })
  })
})
