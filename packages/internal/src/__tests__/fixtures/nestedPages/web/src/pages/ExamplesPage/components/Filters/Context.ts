export interface FiltersContext {
  filters: {
    tags: string[]
  }
  dispatch: React.Dispatch<any>
}

export const defaultState = {
  filters: { tags: [] },
  dispatch() {},
}

export default React.createContext<FiltersContext>(defaultState)
