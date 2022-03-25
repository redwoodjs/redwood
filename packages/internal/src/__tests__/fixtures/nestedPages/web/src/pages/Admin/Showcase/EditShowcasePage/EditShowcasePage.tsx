import EditShowcaseCell from 'src/components/Showcase/EditShowcaseCell'

type ShowcasePageProps = {
  id: number
}

const EditShowcasePage = ({ id }: ShowcasePageProps) => {
  return <EditShowcaseCell id={id} />
}

export default EditShowcasePage
