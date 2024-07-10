import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { gHistory, navigate, back, block, unblock } from '../history'

describe('gHistory', () => {
  beforeEach(() => {
    globalThis.history.pushState({}, '', '/')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

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

  describe('back', () => {
    it('goes back in history', () => {
      navigate('/test-1')
      navigate('/test-2')
      const spy = vi.spyOn(globalThis.history, 'back')
      back()
      expect(spy).toHaveBeenCalledTimes(1)
    })

    it('calls listeners after going back', () => {
      const listener = vi.fn()
      const listenerId = gHistory.listen(listener)
      navigate('/test')
      back()
      expect(listener).toHaveBeenCalledTimes(2)
      gHistory.remove(listenerId)
    })
  })

  describe('block', () => {
    it('adds a blocker', () => {
      const blocker = vi.fn()
      block('test-blocker', blocker)
      navigate('/test')
      expect(blocker).toHaveBeenCalledTimes(1)
    })

    it('allows navigation after retry', () => {
      const blocker = vi.fn(({ retry }) => retry())
      block('test-blocker', blocker)
      navigate('/test')
      expect(blocker).toHaveBeenCalledTimes(1)
      expect(globalThis.location.pathname).toBe('/test')
    })

    it("prevents navigation when blocker doesn't call retry", () => {
      const blocker = vi.fn()
      block('test-blocker', blocker)
      navigate('/test')
      expect(blocker).toHaveBeenCalledTimes(1)
      expect(globalThis.location.pathname).not.toBe('/test')
    })

    it('adds beforeunload listener when first blocker is added', () => {
      const addEventListenerSpy = vi.spyOn(globalThis, 'addEventListener')
      block('test-blocker', vi.fn())
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'beforeunload',
        expect.any(Function),
      )
    })

    it('adds beforeunload listener only once', () => {
      const addEventListenerSpy = vi.spyOn(globalThis, 'addEventListener')
      block('test-blocker-1', vi.fn())
      block('test-blocker-2', vi.fn())
      expect(addEventListenerSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('unblock', () => {
    it('removes a blocker', () => {
      const blocker = vi.fn()
      block('test-blocker', blocker)
      unblock('test-blocker')
      navigate('/test')
      expect(blocker).not.toHaveBeenCalled()
    })

    it('allows navigation after unblocking', () => {
      const blocker = vi.fn()
      block('test-blocker', blocker)
      unblock('test-blocker')
      navigate('/test')
      expect(globalThis.location.pathname).toBe('/test')
    })

    it('removes beforeunload listener when last blocker is removed', () => {
      const removeEventListenerSpy = vi.spyOn(globalThis, 'removeEventListener')
      block('test-blocker', vi.fn())
      unblock('test-blocker')
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'beforeunload',
        expect.any(Function),
      )
    })

    it("doesn't remove beforeunload listener when there are other blockers", () => {
      const removeEventListenerSpy = vi.spyOn(globalThis, 'removeEventListener')
      block('test-blocker-1', vi.fn())
      block('test-blocker-2', vi.fn())
      unblock('test-blocker-1')
      expect(removeEventListenerSpy).not.toHaveBeenCalled()
    })
  })
})
