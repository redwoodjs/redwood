import { Metadata } from '@redwoodjs/web/Metadata'

const HomePage = () => {
  return (
    <>
      <Metadata title="Home" description="Home page" />

      <h1>HomePage</h1>
      <p>
        Refresh the page using the browser refresh button (or Cmd+R etc) and
        notice that the boxes up top always come back in new colors.
      </p>
    </>
  )
}

export default HomePage
