import { namedRoutes } from '@redwoodjs/router/namedRoutes'
import { NavLink } from '@redwoodjs/router/NavLink'

import CachingBoxes from 'src/components/CachingBoxes/CachingBoxes'
import ServerDelayForm from 'src/components/ServerDelayForm'

import './MainLayout.css'

interface Props {
  children?: React.ReactNode
}

const MainLayout = ({ children }: Props) => {
  return (
    <div className="main-layout">
      <div className="demo-wrapper">
        <CachingBoxes />
        <ServerDelayForm />
      </div>

      <nav>
        <ul>
          <li>
            <NavLink to={namedRoutes.home()} activeClassName="active">
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to={namedRoutes.cachingOne()} activeClassName="active">
              Caching One
            </NavLink>
          </li>
          <li>
            <NavLink to={namedRoutes.cachingTwo()} activeClassName="active">
              Caching Two
            </NavLink>
          </li>
        </ul>
      </nav>
      <main>{children}</main>
    </div>
  )
}

export default MainLayout
