import React, { Fragment, useState } from 'react'

import { Dialog, Transition } from '@headlessui/react'
import { CubeIcon } from '@heroicons/react/20/solid'
import {
  Bars3BottomLeftIcon,
  BellIcon,
  ViewColumnsIcon,
  InformationCircleIcon,
  ChatBubbleLeftEllipsisIcon,
  WindowIcon,
  RadioIcon,
  XMarkIcon,
  WrenchIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  MapIcon,
  InboxIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline'
import { ErrorBoundary } from 'react-error-boundary'
import { Outlet, NavLink } from 'react-router-dom'

import redwooodLogo from '../assets/redwoodjs_diecut_name.svg'
import ErrorPanel from '../Components/Panels/ErrorPanel'
import SearchFilterBar from '../Components/SearchFilterBar'
import SearchFilterContextProvider from '../Context/SearchFilterContextProvider'

const explorerNavigation = [
  { name: 'Traces', to: '/explorer/trace', icon: RadioIcon },
  { name: 'Spans', to: '/explorer/span', icon: CubeIcon },
  { name: 'Maps', to: '/explorer/map', icon: MapIcon },
]

const monitorNavigation = [
  { name: 'Performance', to: '/monitor/performance', icon: ClockIcon },
  { name: 'Errors', to: '/monitor/error', icon: ExclamationTriangleIcon },
]

const apiNavigation = [
  { name: 'GraphiQL Playground', to: '/graphiql', icon: ViewColumnsIcon },
]

const mailNavigation = [
  { name: 'Mail Sink', to: '/mail/sink', icon: InboxIcon },
  { name: 'Template Preview', to: '/mail/preview', icon: EnvelopeIcon },
]

const miscNavigation = [
  { name: 'Settings', to: '/config', icon: WrenchIcon },
  {
    name: 'About',
    to: '/coming-soon',
    icon: InformationCircleIcon,
  },
  {
    name: 'Support & Docs',
    to: 'https://community.redwoodjs.com/t/redwood-studio-experimental/4771',
    icon: ChatBubbleLeftEllipsisIcon,
    other: { target: '_blank', rel: 'noopener noreferrer' },
  },
]

function SidebarContent() {
  return (
    <ul className="flex-grow">
      <li>
        <NavLink
          key="Overview"
          to={'/'}
          className="group flex items-center rounded-md px-2 py-2 text-sm font-medium [&.active]:bg-sinopia text-slate-100 hover:bg-persimmon"
        >
          <WindowIcon
            className="mr-3 h-6 w-6 flex-shrink-0 text-slate-100"
            aria-hidden="true"
          />
          Overview
        </NavLink>
      </li>
      <li>
        <div className="text-xs font-semibold leading-6 text-gray-400">
          Telemetry Explorer
        </div>
        <ul>
          {explorerNavigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              className="group flex items-center rounded-md px-2 py-2 text-sm font-medium [&.active]:bg-sinopia text-slate-100 hover:bg-persimmon"
            >
              <item.icon
                className="mr-3 h-6 w-6 flex-shrink-0 text-slate-100"
                aria-hidden="true"
              />
              {item.name}
            </NavLink>
          ))}
        </ul>
      </li>
      <li>
        <div className="text-xs font-semibold leading-6 text-gray-400">
          Monitoring Dashboards
        </div>
        <ul>
          {monitorNavigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              className="group flex items-center rounded-md px-2 py-2 text-sm font-medium [&.active]:bg-sinopia text-slate-100 hover:bg-persimmon"
            >
              <item.icon
                className="mr-3 h-6 w-6 flex-shrink-0 text-slate-100"
                aria-hidden="true"
              />
              {item.name}
            </NavLink>
          ))}
        </ul>
      </li>
      <li>
        <div className="text-xs font-semibold leading-6 text-gray-400">
          APIs
        </div>
        <ul>
          {apiNavigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              className="group flex items-center rounded-md px-2 py-2 text-sm font-medium [&.active]:bg-sinopia text-slate-100 hover:bg-persimmon"
            >
              <item.icon
                className="mr-3 h-6 w-6 flex-shrink-0 text-slate-100"
                aria-hidden="true"
              />
              {item.name}
            </NavLink>
          ))}
        </ul>
      </li>
      <li>
        <div className="text-xs font-semibold leading-6 text-gray-400">
          Mail
        </div>
        <ul>
          {mailNavigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              className="group flex items-center rounded-md px-2 py-2 text-sm font-medium [&.active]:bg-sinopia text-slate-100 hover:bg-persimmon"
            >
              <item.icon
                className="mr-3 h-6 w-6 flex-shrink-0 text-slate-100"
                aria-hidden="true"
              />
              {item.name}
            </NavLink>
          ))}
        </ul>
      </li>
      <li>
        <div className="text-xs font-semibold leading-6 text-gray-400">
          Misc.
        </div>
        <ul>
          {miscNavigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              {...item.other}
              className="group flex items-center rounded-md px-2 py-2 text-sm font-medium [&.active]:bg-sinopia text-slate-100 hover:bg-persimmon"
            >
              <item.icon
                className="mr-3 h-6 w-6 flex-shrink-0 text-slate-100"
                aria-hidden="true"
              />
              {item.name}
            </NavLink>
          ))}
        </ul>
      </li>
    </ul>
  )
}

export default function MasterLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <>
      <div>
        <Transition.Root show={sidebarOpen} as={Fragment}>
          <Dialog
            as="div"
            className="relative z-40 lg:hidden"
            onClose={setSidebarOpen}
          >
            <Transition.Child
              as={Fragment}
              enter="transition-opacity ease-linear duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition-opacity ease-linear duration-300"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
            </Transition.Child>

            <div className="fixed inset-0 z-40 flex">
              <Transition.Child
                as={Fragment}
                enter="transition ease-in-out duration-300 transform"
                enterFrom="-translate-x-full"
                enterTo="translate-x-0"
                leave="transition ease-in-out duration-300 transform"
                leaveFrom="translate-x-0"
                leaveTo="-translate-x-full"
              >
                <Dialog.Panel className="relative flex w-full max-w-xs flex-1 flex-col bg-rich-black pt-5 pb-4">
                  <Transition.Child
                    as={Fragment}
                    enter="ease-in-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-300"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <div className="absolute top-0 right-0 -mr-12 pt-2">
                      <button
                        type="button"
                        className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                        onClick={() => setSidebarOpen(false)}
                      >
                        <span className="sr-only">Close sidebar</span>
                        <XMarkIcon
                          className="h-6 w-6 text-white"
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                  </Transition.Child>
                  <div className="flex flex-shrink-0 items-center px-4">
                    <img
                      className="h-8 w-auto"
                      src={redwooodLogo}
                      alt="RedwoodJS Logo"
                    />
                  </div>
                  <div className="mt-5 h-0 flex-1 overflow-y-auto">
                    <nav className="space-y-1 px-2">
                      <SidebarContent />
                    </nav>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
              <div className="w-14 flex-shrink-0" aria-hidden="true">
                {/* Dummy element to force sidebar to shrink to fit close icon */}
              </div>
            </div>
          </Dialog>
        </Transition.Root>

        {/* Static sidebar for desktop */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
          {/* Sidebar component, swap this element with another sidebar if you like */}
          <div className="flex flex-grow flex-col overflow-y-auto pt-5 bg-rich-black">
            <div className="flex flex-shrink-0 items-center px-4">
              <img
                className="h-8 w-auto"
                src={redwooodLogo}
                alt="RedwoodJS Logo"
              />
            </div>
            <div className="mt-5 flex flex-1 flex-col">
              <nav className="flex-1 space-y-1 px-2 pb-4">
                <SidebarContent />
              </nav>
            </div>
          </div>
        </div>
        <div className="flex flex-1 flex-col lg:pl-64">
          <SearchFilterContextProvider>
            <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 bg-white shadow">
              <button
                type="button"
                className="border-r border-gray-200 px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-slate-500 lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <span className="sr-only">Open sidebar</span>
                <Bars3BottomLeftIcon className="h-6 w-6" aria-hidden="true" />
              </button>
              <div className="flex flex-1 justify-between px-4">
                <SearchFilterBar />
                <div className="ml-4 flex items-center lg:ml-6">
                  <button
                    type="button"
                    className="rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                  >
                    <span className="sr-only">View notifications</span>
                    <BellIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>

            <main>
              <ErrorBoundary FallbackComponent={ErrorComponent}>
                <Outlet />
              </ErrorBoundary>
            </main>
          </SearchFilterContextProvider>
        </div>
      </div>
    </>
  )
}

function ErrorComponent({ error }: { error: any }) {
  return (
    <div className="mx-auto py-6 px-4 max-w-[97.5%] md:max-w-[90%] sm:px-6 lg:px-8 flex justify-center">
      <ErrorPanel error={error} />
    </div>
  )
}
