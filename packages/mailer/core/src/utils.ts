import type { MailAddress } from './types'

export function convertAddress(address: MailAddress): string {
  if (typeof address === 'string') {
    return address
  }
  if (address.name === undefined) {
    return address.address
  }
  return `${address.name} <${address.address}>`
}

export function convertAddresses(addresses: MailAddress[]): string[] {
  const result: string[] = []
  for (let i = 0; i < addresses.length; i++) {
    result.push(convertAddress(addresses[i]))
  }
  return result
}
