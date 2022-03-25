import ShowcaseCell from 'src/components/Showcase/ShowcaseCell'

type ShowcasePageProps = {
  id: number
}

const ShowcasePage = ({ id }: ShowcasePageProps) => {
  return <ShowcaseCell id={id} />
}

export default ShowcasePage
