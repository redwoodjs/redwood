import { Link } from '@redwoodjs/router/dist/link'
import { namedRoutes as routes } from '@redwoodjs/router/namedRoutes'
import { Metadata } from '@redwoodjs/web/Metadata'

import { getRequestCookies, getRequestHeaders } from '@redwoodjs/web/request'

const StorePage = () => {
  return (
    <>
      <Metadata title="Store" description="Store page" />
      <h1>Request Details</h1>
      <p>This page checks that we can get request cookies and headers imported from '@redwoodjs/web/request'</p>
      <ul>
        <li data-testid="user-agent-header">User-Agent Header: {getRequestHeaders().get('User-Agent') || 'NO USER AGENT!'}</li>
        {/* This cookie gets set in the playwright test */}
        <li data-testid="smoke-test-cookie">Smoke Test Cookie: {getRequestCookies().get('smoke-test-cookie') || 'NO SMOKE TEST COOKIE'}</li>
      </ul>
    </>
  )
}

export default StorePage
