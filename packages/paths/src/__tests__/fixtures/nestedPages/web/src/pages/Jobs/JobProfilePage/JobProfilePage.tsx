import { MetaTags } from '@redwoodjs/web'
import JobProfileCell from 'src/components/Jobs/JobProfileCell'

const JobProfilePage = ({ id }) => {
  return (
    <>
      <MetaTags
        title="Job Profile"
        description="RedwoodJS devs available for work"
      />

      <JobProfileCell id={id} />
    </>
  )
}

export default JobProfilePage
