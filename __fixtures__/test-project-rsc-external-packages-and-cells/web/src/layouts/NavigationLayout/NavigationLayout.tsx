import { Link, routes } from '@redwoodjs/router'

import './NavigationLayout.css'

type NavigationLayoutProps = {
  children?: React.ReactNode
}

const NavigationLayout = ({ children }: NavigationLayoutProps) => {
  return (
    <div className="navigation-layout">
      <nav>
        <ul>
          <li>
            <Link to={routes.home()}>Home</Link>
          </li>
          <li>
            <Link to={routes.about()}>About</Link>
          </li>
          <li>
            <Link to={routes.userExamples()}>User Examples</Link>
          </li>
          <li>
            <Link to={routes.emptyUsers()}>Empty Users</Link>
          </li>
          <li>
            <Link to={routes.multiCell()}>Multi Cell</Link>
          </li>
        </ul>
      </nav>
      <main>{children}</main>
    </div>
  )
}

export default NavigationLayout
