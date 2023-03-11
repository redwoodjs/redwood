import React from 'react'

import { useQuery, gql } from '@apollo/client'
import { XCircleIcon } from '@heroicons/react/20/solid'

import LoadingSpinner from '../Components/LoadingSpinner'

const QUERY_GET_CONFIG = gql`
  query GetConfig {
    dashboardConfig {
      authProvider
      impersonateUser {
        id
        email
        roles
      }
    }
  }
`

function Config() {
  const { loading, error, data } = useQuery(QUERY_GET_CONFIG, {
    pollInterval: 10_000,
  })

  if (error) {
    return (
      <div className="mx-auto py-6 px-4 max-w-[95%] md:max-w-[80%] sm:px-6 lg:px-8">
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircleIcon
                className="h-5 w-5 text-red-400"
                aria-hidden="true"
              />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                There were an error
              </h3>
              <div className="mt-2 text-sm text-red-700">
                {JSON.stringify(error)}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="mx-auto py-6 px-4 max-w-[95%] md:max-w-[80%] sm:px-6 lg:px-8 flex justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="mx-auto py-6 px-4 max-w-[95%] md:max-w-[80%] sm:px-6 lg:px-8">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center -mx-4 sm:-mx-6 lg:-mx-8">
          <div className="sm:flex-auto">
            <h1 className="text-base font-semibold leading-6 text-gray-900">
              Dashboard Config
            </h1>
            <p className="mt-2 text-sm text-gray-700">
              These are the various config options the dashboard is currently
              using. You can update some of these values from within your
              `redwood.toml` file under the `dashboard` section and others you
              can update directly within the various dashboard webpages.
            </p>
          </div>
        </div>
        <pre className="mt-4 -my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8 bg-white rounded-md">
          {JSON.stringify(data.dashboardConfig, null, 2)}
        </pre>
      </div>
    </div>
  )
}

export default Config
