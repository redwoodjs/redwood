import ReadFileServerCell from 'src/components/ReadFileServerCell'

import { NavigationStyles } from './NavigationStyles'

const routes = {
  home: () => '/',
  about: () => '/about',
  userExamples: () => '/user-examples',
  emptyUsers: () => '/empty-users',
  multiCell: () => '/multi-cell',
}

const Link = (props: any) => {
  return <a href={props.to}>{props.children}</a>
}

interface NavigationLayoutProps {
  children?: React.ReactNode
}

const NavigationLayout = ({ children }: NavigationLayoutProps) => {
  return (
    <div className="navigation-layout">
      <NavigationStyles />
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
      <ReadFileServerCell />
      <p>Layout end</p>
      <hr />
      <main>{children}</main>
    </div>
  )
}

export default NavigationLayout
