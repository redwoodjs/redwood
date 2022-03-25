import EditMediaCell from 'src/components/Media/EditMediaCell'

type MediaPageProps = {
  id: number
}

const EditMediaPage = ({ id }: MediaPageProps) => {
  return <EditMediaCell id={id} />
}

export default EditMediaPage
