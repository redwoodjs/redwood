import { useEffect } from 'react'

import { navigate, routes } from '@redwoodjs/router'
import { MetaTags, useMutation } from '@redwoodjs/web'
import { toast } from '@redwoodjs/web/toast'

import JobForm from 'src/components/Jobs/JobForm'

const CREATE_JOB = gql`
  mutation CreateJobMutation($input: CreateJobInput!) {
    createJob(input: $input) {
      id
    }
  }
`

const NewJobPage = ({ token }) => {
  const [createJob, { loading, error }] = useMutation(CREATE_JOB, {
    onCompleted: ({ createJob }) => {
      toast.success('Job post created!', { id: 'saving' })
      navigate(routes.job({ id: createJob.id }))
    },
  })

  useEffect(() => {
    if (error) {
      toast.error(error.message, { id: 'saving' })
    }
  }, [error])

  const createJobWithMessage = (args) => {
    toast.loading('Saving job...', { id: 'saving' })
    createJob(args)
  }

  if (!token || token !== 'cl0hf47710001iq2f7307b18y') {
    return (
      <div className="mt-36 text-center text-lg">
        To list your job, email{' '}
        <a href="mailto:jobs@redwoodjs.com?subject=New%20job%20post">
          jobs@redwoodjs.com
        </a>{' '}
        and we'll get you set up!
      </div>
    )
  }

  return (
    <>
      <MetaTags
        title="Post a Job"
        description="Looking to hire RedwoodJS developers? Post on the Redwood job board!"
      />

      <div className="max-w-screen-lg mx-auto job">
        <header className="mt-36">
          <h1 className="relative text-6xl px-16 text-teal-800 tracking-normal text-center">
            Post a Job
          </h1>
          <div className="mt-2 text-center text-stone-500">
            Get your job in front of the best RedwoodJS devs
          </div>
        </header>

        <JobForm
          loading={loading}
          error={error}
          saveFunc={createJobWithMessage}
        />
      </div>
    </>
  )
}

export default NewJobPage
