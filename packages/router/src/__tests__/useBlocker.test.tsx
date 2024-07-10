import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import * as history from '../history'
import { useBlocker } from '../useBlocker'

vi.mock('./history', () => ({
  block: vi.fn(),
  unblock: vi.fn(),
}))

describe('useBlocker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize in IDLE state', () => {
    const { result } = renderHook(() => useBlocker({ when: true }))
    expect(result.current.state).toBe('IDLE')
  })

  it('should call block when "when" is true', () => {
    renderHook(() => useBlocker({ when: true }))
    expect(history.block).toHaveBeenCalled()
  })

  it('should call unblock when "when" is false', () => {
    renderHook(() => useBlocker({ when: false }))
    expect(history.unblock).toHaveBeenCalled()
  })

  it('should change state to BLOCKED when blocker is triggered', () => {
    const { result } = renderHook(() => useBlocker({ when: true }))

    act(() => {
      const blockCallback = history.block.mock.calls[0][1]
      blockCallback({ retry: vi.fn() })
    })

    expect(result.current.state).toBe('BLOCKED')
  })

  it('should not block navigation when "when" is false', () => {
    const retryMock = vi.fn()
    const { result } = renderHook(() => useBlocker({ when: false }))

    act(() => {
      const blockCallback = history.block.mock.calls[0][1]
      blockCallback({ retry: retryMock })
    })

    expect(retryMock).toHaveBeenCalled()
    expect(result.current.state).toBe('IDLE')
  })

  it('should confirm navigation when confirm is called', () => {
    const retryMock = vi.fn()
    const { result } = renderHook(() => useBlocker({ when: true }))

    act(() => {
      const blockCallback = history.block.mock.calls[0][1]
      blockCallback({ retry: retryMock })
    })

    act(() => {
      result.current.confirm()
    })

    expect(retryMock).toHaveBeenCalled()
    expect(result.current.state).toBe('IDLE')
  })

  it('should abort navigation when abort is called', () => {
    const retryMock = vi.fn()
    const { result } = renderHook(() => useBlocker({ when: true }))

    act(() => {
      const blockCallback = history.block.mock.calls[0][1]
      blockCallback({ retry: retryMock })
    })

    act(() => {
      result.current.abort()
    })

    expect(retryMock).not.toHaveBeenCalled()
    expect(result.current.state).toBe('IDLE')
  })

  it('should clean up by calling unblock on unmount', () => {
    const { unmount } = renderHook(() => useBlocker({ when: true }))
    unmount()
    expect(history.unblock).toHaveBeenCalled()
  })
})
