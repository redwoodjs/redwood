import React from 'react'

import { useQuery, gql } from '@apollo/client'
import { XCircleIcon } from '@heroicons/react/20/solid'
import {
  EnvelopeIcon,
  KeyIcon,
  UserCircleIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'

import LoadingSpinner from '../Components/LoadingSpinner'

const QUERY_GET_CONFIG = gql`
  query GetConfig {
    studioConfig {
      authProvider
      userId
      email
      roles
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
    <div className="overflow-hidden bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-base font-semibold leading-6 text-gray-900">
          {' '}
          Studio Configuration Settings
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          These are the various config options the studio is currently using.
          You can update some of these values from within your `redwood.toml`
          file under the `studio` section and others you can update directly
          within the various studio webpages.
        </p>
      </div>
      <div className="border-t border-gray-200 h-screen">
        <dl>
          {data?.studioConfig && (
            <>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <KeyIcon className="h-6 w-6 mr-2" aria-hidden="true" /> Auth
                  Provider
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  {data?.studioConfig.authProvider}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <UserCircleIcon className="h-6 w-6 mr-2" aria-hidden="true" />
                  Impersonated User Id
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  {data?.studioConfig.userId}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <EnvelopeIcon className="h-6 w-6 mr-2" aria-hidden="true" />
                  Impersonated Email
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  {data?.studioConfig.email}
                </dd>
              </div>

              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <UserGroupIcon className="h-6 w-6 mr-2" aria-hidden="true" />{' '}
                  Impersonated Roles
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  {data?.studioConfig.roles}
                </dd>
              </div>
            </>
          )}
        </dl>
      </div>
    </div>
  )
}

export default Config
