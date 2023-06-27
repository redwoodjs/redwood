import { HelmetProvider } from 'react-helmet-async'

interface RedwoodProviderProps {
  children: React.ReactNode
  titleTemplate?: string
}

export const RedwoodProvider = ({ children }: RedwoodProviderProps) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // TODO (STREAMING) disabling helmet here, because it clashes with meta routeHooks
  // but still leaving helmet provider to make it easy to migrate to new setup
  // TODO (STREAMING) Figure out how the Helmet stuff can live along side
  // streaming while streaming is still experimental
  return (
    <HelmetProvider context={globalThis.__REDWOOD__HELMET_CONTEXT}>
      {/* <Helmet titleTemplate={template()} defaultTitle={appTitle}>
        <title>{appTitle}</title>
      </Helmet> */}
      {children}
    </HelmetProvider>
  )
}

declare global {}
