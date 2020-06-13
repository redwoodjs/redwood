import storage from 'node-persist'

const storageDir = 'node_modules/.localstorage'
const VERSION_INFO_KEY = 'versions'
const HISTORY_KEY = 'history'

export async function initStorage() {
  await storage.init({
    dir: storageDir,
  })
}

export async function setVersions(versions) {
  return setJSON(VERSION_INFO_KEY, versions)
}

export async function getVersions() {
  return getJSON(VERSION_INFO_KEY)
}

export async function resetHistory() {
  await storage.removeItem(HISTORY_KEY)
}

export async function setHistory(history) {
  return setJSON(HISTORY_KEY, history)
}
export async function getHistory() {
  return (
    (await getJSON(HISTORY_KEY)) || {
      rwRunCounter: 0,
      messageCounter: 0,
    }
  )
}

async function getJSON(key) {
  const stored = await storage.getItem(key)
  try {
    return JSON.parse(stored)
  } catch (e) {
    return undefined
  }
}

async function setJSON(key, value) {
  await storage.setItem(key, JSON.stringify(value))
}
