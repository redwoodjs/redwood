'use server'

export const globalValues = {
  num: undefined as number,
}

export async function updateRandom() {
  globalValues.num = Math.round(Math.random() * 1000)

  return globalValues.num
}
