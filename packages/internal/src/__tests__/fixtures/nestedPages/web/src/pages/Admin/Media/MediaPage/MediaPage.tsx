import MediaCell from 'src/components/Media/MediaCell'

type MediaPageProps = {
  id: number
}

const MediaPage = ({ id }: MediaPageProps) => {
  return <MediaCell id={id} />
}

export default MediaPage
