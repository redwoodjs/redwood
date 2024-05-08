import cookie from 'cookie'

export type CookieParams = {
  value: string
  options?: cookie.CookieSerializeOptions
}

/** Specialized cookie map, that lets you set cookies with options */
export class CookieJar {
  private map = new Map<string, CookieParams>()

  // This allows CookieJar to be used in MWRequest.cookie also
  // note that options are not available when constructed this way
  constructor(cookieString?: string | null) {
    if (cookieString) {
      const parsedCookies = cookie.parse(cookieString)

      this.map = new Map(
        Object.entries(parsedCookies).map(([key, value]) => {
          return [key, { value }]
        }),
      )
    }
  }

  public set(
    name: string,
    value: string,
    options?: cookie.CookieSerializeOptions,
  ) {
    this.map.set(name, {
      value,
      options,
    })

    return this
  }

  public get(name: string) {
    return this.map.get(name)?.value
  }

  public getWithOptions(name: string) {
    return this.map.get(name)
  }

  public has(name: string) {
    return this.map.has(name)
  }

  /**
   * Won't delete a cookie from the jar, but will set it to expire
   * and set an empty value
   */
  public unset(name: string) {
    return this.map.set(name, {
      value: '',
      options: {
        expires: new Date(0),
      },
    })
  }

  /** Clear all cookies, or remove a specific cookie from the jar */
  public clear(name?: string) {
    if (name) {
      this.map.delete(name)
    } else {
      this.map.clear()
    }
  }

  public entries() {
    return this.map.entries()
  }

  public [Symbol.iterator]() {
    return this.map[Symbol.iterator]()
  }

  public get size() {
    return this.map.size
  }
}
