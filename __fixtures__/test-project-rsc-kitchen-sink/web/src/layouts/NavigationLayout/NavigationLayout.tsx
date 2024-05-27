import { namedRoutes as routes } from '@redwoodjs/router/dist/namedRoutes'

import ReadFileServerCell from 'src/components/ReadFileServerCell'

import './NavigationLayout.css'

type NavigationLayoutProps = {
  children?: React.ReactNode
  rnd?: number
}

const Link = (props: any) => {
  return <a href={props.to}>{props.children}</a>
}

const NavigationLayout = ({ children, rnd }: NavigationLayoutProps) => {
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
      <div id="rnd">{Math.round(rnd * 100)}</div>
      <ReadFileServerCell />
      <p>Layout end</p>
      <hr />
      <main>{children}</main>
    </div>
  )
}

export default NavigationLayout
