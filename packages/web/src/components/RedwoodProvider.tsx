import { Helmet, HelmetProvider } from 'react-helmet-async'

interface RedwoodProviderProps {
  children: React.ReactNode
  titleTemplate?: string
}

export const RedwoodProvider = ({
  children,
  titleTemplate,
}: RedwoodProviderProps) => {
  const appTitle = global.__REDWOOD__APP_TITLE
  const template = () => {
    if (titleTemplate) {
      titleTemplate.replace(/%AppTitle/g, () => appTitle)
      titleTemplate.replace(/%PageTitle/g, () => '%s')
      return titleTemplate
    }
    return ''
  }
  return (
    <HelmetProvider context={global.__REDWOOD__HELMET_CONTEXT}>
      <Helmet titleTemplate={template()} defaultTitle={appTitle}>
        {children}
      </Helmet>
    </HelmetProvider>
  )
}

declare global {}
