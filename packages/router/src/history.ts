const createHistory = () => {
  const listeners = []

  return {
    listen: (listener) => {
      listeners.push(listener)
      window.addEventListener('popstate', () => {
        listener()
      })
    },
    navigate: (to) => {
      window.history.pushState({}, null, to)
      listeners.forEach((listener) => listener())
    },
  }
}

const gHistory = createHistory()

const navigate = gHistory.navigate

export { gHistory, navigate }
