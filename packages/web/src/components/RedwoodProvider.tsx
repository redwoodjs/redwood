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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // TODO (STREAMING) need to disable helmet here, because it clashes with meta
  // routeHooks but can still leave helmet provider to make it easy to migrate
  // to new setup
  // TODO (STREAMING) Figure out how the Helmet stuff can live along side
  // streaming while streaming is still experimental
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
