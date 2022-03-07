// This page will be rendered when an error makes it all the way to the top of
// the application without being handled by a Javascript catch statement or
// React error boundary.
//
// You can modify this page as you wish, but it is critically important to keep
// things simple to avoid the possibility that it will cause its own error. If
// it does, the user will receive a blank page.

const FatalErrorPage = () => {
  return <h1>Something went wrong.</h1>
}

export default FatalErrorPage
