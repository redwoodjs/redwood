export class RscCache {
  private cache = new Map<string, Thenable<React.ReactElement>>()

  get(key: string): any {
    const value = this.cache.get(key)
    console.log('RscCache.get', key, value)
    return value
  }

  set(key: string, value: any) {
    console.log('RscCache.set', key, value)
    this.cache.set(key, value)
  }
}
