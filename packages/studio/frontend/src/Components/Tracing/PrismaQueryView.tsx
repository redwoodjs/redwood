import React from 'react'

function PrismQueryView({ prismaQueries }: { prismaQueries: [any] }) {
  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center -mx-4 sm:-mx-6 lg:-mx-8">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900">
            Prisma Queries
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all Prisma queries executed during this trace.
          </p>
        </div>
      </div>
      <div className="mt-4 flow-root">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 lg:pl-8"
                  >
                    Model
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Method
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Duration (ms)
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 pr-4 sm:pr-6 lg:pr-8"
                  >
                    DB Statement
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {prismaQueries.map((prismaQuery) => (
                  <tr key={prismaQuery.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 lg:pl-8">
                      {prismaQuery.model}
                    </td>
                    <td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500">
                      {prismaQuery.method}
                    </td>
                    <td className="text-right whitespace-nowrap py-4 px-3 text-sm text-gray-500">
                      {prismaQuery.duration_ms}
                    </td>
                    <td className="whitespace-pre-wrap py-4 px-3 text-sm text-gray-500 flex-wrap sm:pr-6 lg:pr-8">
                      {prismaQuery.db_statement}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrismQueryView
