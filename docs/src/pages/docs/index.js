import React from 'react'

import { Redirect, useLocation } from '@docusaurus/router'

import config from '../../../docusaurus.config'

const { defaultDocsLandingPage } = config.customFields

function Docs() {
  const location = useLocation()
  const defaultUrl = [
    location.pathname.replace(/\/$/, ''),
    defaultDocsLandingPage,
  ].join('/')

  return <Redirect to={defaultUrl} />
}

export default Docs
