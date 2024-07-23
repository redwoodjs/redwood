export class RscCache {
  private static cache = new Map<string, Thenable<React.ReactElement>>()

  static get(key: string): any {
    const value = this.cache.get(key)
    console.log('RscCache.get', key, value)
    return value
  }

  static set(key: string, value: any) {
    console.log('RscCache.set', key, value)
    this.cache.set(key, value)
  }
}
