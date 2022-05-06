/**
 * At this point, this test primarily validates the functionality of the
 * renderHook example provided in the docs.  It does not currently test the
 * wrapper functionality of RedwoodJS providers
 */
import { useEffect, useState } from 'react'

import { renderHook } from '../index'

// Define a custom hook for testing
const useAccumulator = (initialValue: number) => {
  const [total, setTotal] = useState(initialValue)

  useEffect(() => {
    setTotal(initialValue)
  }, [initialValue])

  const add = (value: number) => {
    const newTotal = total + value
    setTotal(newTotal)
    return newTotal
  }

  return { total, add }
}

describe('useAccumulator hook example in docs', () => {
  it('has the correct initial state', () => {
    const { result } = renderHook(() => useAccumulator(42))
    expect(result.current.total).toBe(42)
  })
  it('adds a value', () => {
    const { result } = renderHook(() => useAccumulator(1))
    result.current.add(5)
    expect(result.current.total).toBe(6)
  })
  it('adds multiple values', () => {
    const { result } = renderHook(() => useAccumulator(0))
    result.current.add(5)
    result.current.add(10)
    expect(result.current.total).toBe(15)
  })
  it('re-initializes the accumulator if passed a new initilizing value', () => {
    const { result, rerender } = renderHook(
      (initialValue) => useAccumulator(initialValue),
      {
        initialProps: 0,
      }
    )
    result.current.add(5)
    rerender(99)
    expect(result.current.total).toBe(99)
  })
})
