import React from 'react'

export default function CustomIcons({ customs }: { customs: any[] }) {
  if (customs.length === 0) {
    return <></>
  }

  return (
    <>
      {customs.map((custom, index) => {
        const Icon = custom.icon
        return (
          <div
            key={custom.value}
            className={`flex items-center text-sm ${custom.colour} md:ml-0 sm:ml-6 md:mt-0 sm:mt-2`}
          >
            <Icon
              className={`h-5 w-5 flex-shrink-0 ${custom.colour} ${
                index > 0 ? 'md:ml-2 sm:ml-0' : ''
              }`}
              aria-hidden="true"
            />
            {custom.value}
          </div>
        )
      })}
    </>
  )
}
