import { Suspense } from 'react'

// @TODO(STREAMING): We are directly importing from Apollo here
// because useBgQuery, and useReadQuery are Apollo 3.8+ specific
import { NetworkStatus, QueryReference, useApolloClient } from '@apollo/client'
import {
  useBackgroundQuery,
  useReadQuery,
} from '@apollo/experimental-nextjs-app-support/ssr'

/**
 * This is part of how we let users swap out their GraphQL client while staying compatible with Cells.
 */
import { CellErrorBoundary } from './CellErrorBoundary'
import {
  SuspenseCellQueryResult,
  CreateCellProps,
  DataObject,
  SuperSuccessProps,
} from './cellTypes'
import { isDataEmpty } from './isCellEmpty'

/**
 * Creates a Cell ~~ with Apollo Client only ~~
 * using the hooks useBackgroundQuery and useReadQuery
 */
export function createCell<
  CellProps extends Record<string, unknown>,
  CellVariables extends Record<string, unknown>
>({
  QUERY,
  beforeQuery = (props) => ({
    // By default, we assume that the props are the gql-variables.
    variables: props as unknown as CellVariables,
    /**
     * We're duplicating these props here due to a suspected bug in Apollo Client v3.5.4
     * (it doesn't seem to be respecting `defaultOptions` in `RedwoodApolloProvider`.)
     *
     * @see {@link https://github.com/apollographql/apollo-client/issues/9105}
     */
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  }),
  afterQuery = (data) => ({ ...data }),
  isEmpty = isDataEmpty,
  Loading = () => <>Loading...</>,
  Failure,
  Empty,
  Success,
  displayName = 'Cell',
}: CreateCellProps<CellProps, CellVariables>): React.FC<CellProps> {
  function SuperSuccess(props: SuperSuccessProps) {
    const { RWJS_cellQueryRef, suspenseQueryResult, userProps } = props

    const { data, networkStatus } = useReadQuery<DataObject>(RWJS_cellQueryRef)
    const afterQueryData = afterQuery(data as DataObject)

    const queryResultWithNetworkStatus = {
      ...suspenseQueryResult,
      networkStatus,
    }

    if (isEmpty(data, { isDataEmpty }) && Empty) {
      return (
        // @ts-expect-error HELP, cant make queryResult type work
        <Empty
          {...userProps}
          {...afterQueryData}
          queryResult={queryResultWithNetworkStatus}
        />
      )
    }

    return (
      // @ts-expect-error HELP, cant make queryResult type work
      <Success
        {...afterQueryData}
        {...userProps}
        queryResult={queryResultWithNetworkStatus}
      />
    )
  }

  SuperSuccess.displayName = displayName

  // @NOTE: Note that we are returning a HoC here!
  return (props: CellProps) => {
    /**
     * Right now, Cells don't render `children`.
     */
    const { children: _, ...variables } = props
    const options = beforeQuery(variables as CellProps)
    const query = typeof QUERY === 'function' ? QUERY(options) : QUERY
    const [queryRef, other] = useBackgroundQuery(query, options)

    const client = useApolloClient()

    const suspenseQueryResult: SuspenseCellQueryResult = {
      client,
      ...other,
      called: !!queryRef,
      // @MARK set this to loading here, gets over-ridden in SuperSuccess
      networkStatus: NetworkStatus.loading,
    }

    // @TODO(STREAMING) removed prerender handling here
    // Until we decide how/if we do prerendering

    const FailureComponent = (fprops: any) => {
      if (!Failure) {
        return (
          <>
            <h2>Cell rendering failure. No Error component supplied. </h2>
            <pre>{fprops.error}</pre>
          </>
        )
      }

      return <Failure {...fprops} queryResult={suspenseQueryResult} />
    }

    return (
      <CellErrorBoundary fallback={FailureComponent}>
        <Suspense fallback={<Loading {...props} />}>
          <SuperSuccess
            userProps={props}
            RWJS_cellQueryRef={queryRef as QueryReference<DataObject>}
            suspenseQueryResult={suspenseQueryResult}
          />
        </Suspense>
      </CellErrorBoundary>
    )
  }
}
