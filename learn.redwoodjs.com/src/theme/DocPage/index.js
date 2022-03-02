/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useState, useCallback } from 'react'

import Head from '@docusaurus/Head'
import renderRoutes from '@docusaurus/renderRoutes'
import { Redirect } from '@docusaurus/router'
import { matchPath } from '@docusaurus/router'
import {
  ThemeClassNames,
  docVersionSearchTag,
  DocsSidebarProvider,
  useDocsSidebar,
  DocsVersionProvider,
} from '@docusaurus/theme-common'
import { translate } from '@docusaurus/Translate'
import { MDXProvider } from '@mdx-js/react'
import BackToTopButton from '@theme/BackToTopButton'
import DocSidebar from '@theme/DocSidebar'
import IconArrow from '@theme/IconArrow'
import Layout from '@theme/Layout'
import MDXComponents from '@theme/MDXComponents'
import NotFound from '@theme/NotFound'
import clsx from 'clsx'

import getFirstArticleId from '../../utils/getFirstArticleId'

import styles from './styles.module.css'

function DocPageContent({
  currentDocRoute,
  versionMetadata,
  children,
  sidebarName,
}) {
  const sidebar = useDocsSidebar()
  const { pluginId, version } = versionMetadata
  const [hiddenSidebarContainer, setHiddenSidebarContainer] = useState(false)
  const [hiddenSidebar, setHiddenSidebar] = useState(false)
  const toggleSidebar = useCallback(() => {
    if (hiddenSidebar) {
      setHiddenSidebar(false)
    }

    setHiddenSidebarContainer((value) => !value)
  }, [hiddenSidebar])
  return (
    <Layout
      wrapperClassName={ThemeClassNames.wrapper.docsPages}
      pageClassName={ThemeClassNames.page.docsDocPage}
      searchMetadata={{
        version,
        tag: docVersionSearchTag(pluginId, version),
      }}
    >
      <div className={styles.docPage}>
        <BackToTopButton />

        {sidebar && (
          <aside
            className={clsx(
              ThemeClassNames.docs.docSidebarContainer,
              styles.docSidebarContainer,
              {
                [styles.docSidebarContainerHidden]: hiddenSidebarContainer,
              }
            )}
            onTransitionEnd={(e) => {
              if (
                !e.currentTarget.classList.contains(styles.docSidebarContainer)
              ) {
                return
              }

              if (hiddenSidebarContainer) {
                setHiddenSidebar(true)
              }
            }}
          >
            <DocSidebar
              key={
                // Reset sidebar state on sidebar changes
                // See https://github.com/facebook/docusaurus/issues/3414
                sidebarName
              }
              sidebar={sidebar}
              path={currentDocRoute.path}
              onCollapse={toggleSidebar}
              isHidden={hiddenSidebar}
            />

            {hiddenSidebar && (
              <div
                className={styles.collapsedDocSidebar}
                title={translate({
                  id: 'theme.docs.sidebar.expandButtonTitle',
                  message: 'Expand sidebar',
                  description:
                    'The ARIA label and title attribute for expand button of doc sidebar',
                })}
                aria-label={translate({
                  id: 'theme.docs.sidebar.expandButtonAriaLabel',
                  message: 'Expand sidebar',
                  description:
                    'The ARIA label and title attribute for expand button of doc sidebar',
                })}
                tabIndex={0}
                role="button"
                onKeyDown={toggleSidebar}
                onClick={toggleSidebar}
              >
                <IconArrow className={styles.expandSidebarButtonIcon} />
              </div>
            )}
          </aside>
        )}
        <main
          className={clsx(styles.docMainContainer, {
            [styles.docMainContainerEnhanced]:
              hiddenSidebarContainer || !sidebar,
          })}
        >
          <div
            className={clsx(
              'container padding-top--md padding-bottom--lg',
              styles.docItemWrapper,
              {
                [styles.docItemWrapperEnhanced]: hiddenSidebarContainer,
              }
            )}
          >
            <MDXProvider components={MDXComponents}>{children}</MDXProvider>
          </div>
        </main>
      </div>
    </Layout>
  )
}

export default function DocPage(props) {
  const {
    route: { routes: docRoutes },
    versionMetadata,
    location,
  } = props
  const currentDocRoute = docRoutes.find((docRoute) =>
    matchPath(location.pathname, docRoute)
  )

  if (!currentDocRoute) {
    // check to see if currently at the root of a section
    // if so, redirect to first article in section as defined in config.customFields.defaultLandingPages
    const currentSectionPrefix = props.match.path
    const sectionPrefixRegex = new RegExp(`^${currentSectionPrefix}\/`)

    const currentSection = location.pathname
      .replace(sectionPrefixRegex, '')
      .split('/')[0]
    const firstArticleId = getFirstArticleId(currentSection)

    if (firstArticleId) {
      const getFirstArticlePath = [
        currentSectionPrefix,
        currentSection,
        firstArticleId,
      ].join('/')

      return <Redirect to={getFirstArticlePath} />
    }
    return <NotFound />
  } // For now, the sidebarName is added as route config: not ideal!

  const sidebarName = currentDocRoute.sidebar
  const sidebar = sidebarName ? versionMetadata.docsSidebars[sidebarName] : null
  return (
    <>
      <Head>
        {/* TODO we should add a core addRoute({htmlClassName}) action */}
        <html className={versionMetadata.className} />
      </Head>
      <DocsVersionProvider version={versionMetadata}>
        <DocsSidebarProvider sidebar={sidebar}>
          <DocPageContent
            currentDocRoute={currentDocRoute}
            versionMetadata={versionMetadata}
            sidebarName={sidebarName}
          >
            {renderRoutes(docRoutes, {
              versionMetadata,
            })}
          </DocPageContent>
        </DocsSidebarProvider>
      </DocsVersionProvider>
    </>
  )
}
