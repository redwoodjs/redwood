import { describe, expect, test } from 'vitest'

import { CookieJar } from './CookieJar'

describe('CookieJar', () => {
  // Grabbed from github
  const cookieJar = new CookieJar(
    'color_mode=%7B%22color_mode%22%3A%22light%22%2C%22light_theme%22%3A%7B%22name%22%3A%22light%22%2C%22color_mode%22%3A%22light%22%7D%2C%22dark_theme%22%3A%7B%22name%22%3A%22dark_dimmed%22%2C%22color_mode%22%3A%22dark%22%7D%7D; preferred_color_mode=dark; tz=Asia%2FBangkok'
  )

  test('instatitates cookie jar from a cookie string', () => {
    expect(cookieJar.get('color_mode')).toStrictEqual({
      value: JSON.stringify({
        color_mode: 'light',
        light_theme: { name: 'light', color_mode: 'light' },
        dark_theme: { name: 'dark_dimmed', color_mode: 'dark' },
      }),
    })

    expect(cookieJar.get('preferred_color_mode')).toStrictEqual({
      value: 'dark',
    })

    expect(cookieJar.get('tz')).toStrictEqual({
      value: 'Asia/Bangkok',
    })
  })

  describe('Helper methods like JS Map', () => {
    test('has', () => {
      expect(cookieJar.has('color_mode')).toBe(true)
      expect(cookieJar.has('bazinga')).toBe(false)
    })

    test('size', () => {
      expect(cookieJar.size).toBe(3)
    })

    test('entries', () => {
      const iterator = cookieJar.entries()

      expect(iterator.next().done).toBe(false)
      expect(iterator.next().done).toBe(false)

      const finalItem = iterator.next()
      expect(finalItem.done).toBe(false)
      expect(finalItem.value).toStrictEqual(['tz', { value: 'Asia/Bangkok' }])

      expect(iterator.next().done).toBe(true)
    })
  })
})
