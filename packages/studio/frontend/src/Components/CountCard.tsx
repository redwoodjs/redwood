import React from 'react'

import { EllipsisHorizontalIcon } from '@heroicons/react/24/outline'
import { NavLink } from 'react-router-dom'

import LoadingSpinner from './LoadingSpinner'

function CountCard({
  title,
  icon: Icon,
  colouring,
  link,
  loading,
  value,
  error,
}: {
  title: string
  icon: React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement>>
  colouring: string
  link: string
  loading: boolean
  value: any
  error: any
}) {
  return (
    <div className="relative overflow-hidden rounded-lg bg-white px-4 pt-5 pb-12 shadow sm:px-6 sm:pt-6">
      <dt>
        <div className={`absolute rounded-md ${colouring} p-3`}>
          <Icon className="h-6 w-6 text-white" aria-hidden="true" />
        </div>
        <p className="ml-16 truncate text-sm font-medium text-gray-500">
          {title}
        </p>
      </dt>
      <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
        <p className="text-2xl font-semibold text-gray-900">
          {value ? (
            value
          ) : error ? (
            'error'
          ) : loading ? (
            <LoadingSpinner />
          ) : (
            <EllipsisHorizontalIcon className="h-6 w-6" aria-hidden="true" />
          )}
        </p>
        <div className="absolute inset-x-0 bottom-0 bg-gray-50 px-4 py-4 sm:px-6">
          <div className="text-sm">
            <NavLink
              to={link}
              className="font-medium text-slate-600 hover:text-slate-500"
            >
              {' '}
              View all
              <span className="sr-only"> {title} stats</span>
            </NavLink>
          </div>
        </div>
      </dd>
    </div>
  )
}

export default CountCard
