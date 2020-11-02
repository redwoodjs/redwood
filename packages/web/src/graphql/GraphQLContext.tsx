export interface IGraphQLContextState {
  headers?: Record<string, string>
}

const GraphQLContext = React.createContext(
  (undefined as unknown) as IGraphQLContextState
)

export const GraphQLProvider: React.FC<IGraphQLContextState> = ({
  children,
  headers,
}) => {
  return (
    <GraphQLContext.Provider value={{ headers }}>
      {children}
    </GraphQLContext.Provider>
  )
}

export function useGraphQLState() {
  const context = React.useContext(GraphQLContext)

  if (context === undefined) {
    throw new Error('useGraphQLState must be used within a GraphQLProvider')
  }

  return context
}
