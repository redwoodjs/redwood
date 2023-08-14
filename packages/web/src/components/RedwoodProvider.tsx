import { Helmet, HelmetProvider } from 'react-helmet-async'

interface RedwoodProviderProps {
  children: React.ReactNode
  titleTemplate?: string
}

export const RedwoodProvider = ({
  children,
  titleTemplate,
}: RedwoodProviderProps) => {
  const appTitle = globalThis.__REDWOOD__APP_TITLE
  const template = () => {
    if (titleTemplate) {
      let template = titleTemplate.replace(/%AppTitle/g, appTitle)
      template = template.replace(/%PageTitle/g, '%s')
      return template
    }
    return ''
  }

  // @TODO (STREAMING): We can remove Helmet, HelmetProvider
  // Once we've migrated to using the new PortalHead component
  return (
    <HelmetProvider context={globalThis.__REDWOOD__HELMET_CONTEXT}>
      <Helmet titleTemplate={template()} defaultTitle={appTitle}>
        <title>{appTitle}</title>
      </Helmet>
      {children}
    </HelmetProvider>
  )
}

declare global {}
