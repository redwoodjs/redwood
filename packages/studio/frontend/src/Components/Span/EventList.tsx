import React from 'react'

export default function EventList({ events }: { events: JSON }) {
  const data = Object.entries(events).map(([name, value]) => ({
    name,
    value,
  }))

  return (
    <>
      <div>
        <div className="px-4 sm:px-0">
          <h3 className="text-base font-semibold leading-7 text-gray-900">
            Span Events
          </h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500 border-b border-gray-200 pb-3">
            All events recorded during this span.
          </p>
        </div>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle ">
            <table className="min-w-full divide-y divide-gray-300 border-b border-gray-200">
              <tbody className="divide-y divide-gray-200">
                {data.map((d) => (
                  <tr key={d.name}>
                    <td className="whitespace-nowrap py-2 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                      {d.name}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500">
                      {d.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
