type Listener = () => void

const createHistory = () => {
  const listeners: Listener[] = []

  return {
    listen: (listener: Listener) => {
      listeners.push(listener)
      window.addEventListener('popstate', () => {
        listener()
      })
    },
    navigate: (to: string) => {
      window.history.pushState({}, '', to)
      listeners.forEach((listener) => listener())
    },
  }
}

const gHistory = createHistory()

const navigate = gHistory.navigate

export { gHistory, navigate }
