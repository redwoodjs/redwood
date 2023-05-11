import React from 'react'

import {
  ShieldExclamationIcon,
  CloudArrowUpIcon,
  MagnifyingGlassIcon,
  PresentationChartLineIcon,
} from '@heroicons/react/24/outline'

const features = [
  {
    name: 'Cloud Sync',
    description:
      'Sync your dev data to the cloud, allowing you to track your apps development across time, team members and git branches.',
    icon: CloudArrowUpIcon,
  },
  {
    name: 'More Understanding',
    description:
      "We'll be expanding what insights and data we extract from your tracing to build you an even clearer picture of your app.",
    icon: MagnifyingGlassIcon,
  },
  {
    name: 'Security Insights',
    description:
      'Get warnings when your app does something risky like access passwords from the database.',
    icon: ShieldExclamationIcon,
  },
  {
    name: 'Visualisations',
    description:
      'Understand your data at glace with simple but powerful visualisations which highlight the trends and outliers.',
    icon: PresentationChartLineIcon,
  },
]

function ComingSoon() {
  return (
    <div className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-slate-600">
            Coming soon...
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-rich-black sm:text-4xl">
            Everything you need to understand your app while you dev
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            It shouldn&apos;t just be in production that you can monitor your
            app with power and with ease. Development can be better when
            you&apos;re able to understand exactly what is happening and
            identify how your app is performing or breaking.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
          <dl className="grid max-w-xl grid-cols-1 gap-y-10 gap-x-8 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
            {features.map((feature) => (
              <div key={feature.name} className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-rich-black">
                  <div className="absolute top-0 left-0 flex h-10 w-10 items-center justify-center rounded-lg bg-rich-black">
                    <feature.icon
                      className="h-6 w-6 text-white"
                      aria-hidden="true"
                    />
                  </div>
                  {feature.name}
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  {feature.description}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  )
}

export default ComingSoon
