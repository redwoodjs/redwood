import React from 'react'

import { Outlet, NavLink } from 'react-router-dom'

import redwooodLogo from '../assets/redwoodjs_diecut.svg'

function MasterLayout() {
  return (
    <div className="font-mono flex flex-row gap-0 min-h-full max-w-full">
      {/* Sidebar */}
      <div className="flex flex-col overflow-y-auto min-w-[200px] pl-2 py-2 flex-none">
        {/* Header with logo */}
        <ul className="space-y-2 flex flex-col align-middle justify-center">
          <li className="flex flex-col gap-1">
            <img
              className="object-contain max-h-[75px]"
              src={redwooodLogo}
              alt="redwoodjs logo"
            />
            <span className="text-center font-bold">
              RedwoodJS
              <br />
              Dev Dashboard
            </span>
          </li>
        </ul>
        {/* Links */}
        <ul className="space-y-2 my-2 pt-2">
          <NavLink to="/" className="flex p-2 [&.active]:bg-gray-200">
            <span className="text-center w-full">Overview</span>
          </NavLink>
          <NavLink className="flex p-2 [&.active]:bg-gray-200" to="/tracing">
            <span className="text-center w-full">Tracing</span>
          </NavLink>
          <NavLink className="flex p-2 [&.active]:bg-gray-200" to="/graphiql">
            <span className="text-center w-full">GraphiQL</span>
          </NavLink>
          <NavLink
            className="flex p-2 [&.active]:bg-gray-200"
            to="/something-else"
          >
            <span className="text-center w-full">Something Else</span>
          </NavLink>
        </ul>
      </div>

      {/* Main */}
      <div className="bg-gray-200 flex-col flex gap-0 pt-2 grow">
        {/* Heading */}
        <div className="p-2 bg-[#FAF9F6] italic">
          TODO: Heading with breadcrumbs...
        </div>
        {/* Content */}
        <div className="p-4 w-full h-full">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default MasterLayout
