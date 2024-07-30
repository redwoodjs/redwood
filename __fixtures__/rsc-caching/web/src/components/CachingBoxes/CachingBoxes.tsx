import './CachingBoxes.css'

const colors = [
  'red',
  'green',
  'blue',
  'yellow',
  'purple',
  'orange',
  'pink',
  'brown',
  'lightblue',
  'lightgreen',
  'cyan',
  'magenta',
  'lime',
  'maroon',
  'navy',
  'olive',
  'teal',
  'aqua',
  'fuchsia',
  'silver',
  'gray',
  'gold',
  'coral',
  'indigo',
  'violet',
]

const CachingBoxes = () => {
  const shuffledColors = colors
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value)

  return (
    <div className="caching-boxes">
      <div
        style={{ backgroundColor: shuffledColors[0] }}
        key={shuffledColors[0]}
      >
        <div style={{ color: 'black' }}>{shuffledColors[0]}</div>
        <div style={{ color: 'white' }}>{shuffledColors[0]}</div>
      </div>

      <div
        style={{ backgroundColor: shuffledColors[1] }}
        key={shuffledColors[1]}
      >
        <div style={{ color: 'black' }}>{shuffledColors[1]}</div>
        <div style={{ color: 'white' }}>{shuffledColors[1]}</div>
      </div>

      <div
        style={{ backgroundColor: shuffledColors[2] }}
        key={shuffledColors[2]}
      >
        <div style={{ color: 'black' }}>{shuffledColors[2]}</div>
        <div style={{ color: 'white' }}>{shuffledColors[2]}</div>
      </div>
    </div>
  )
}

export default CachingBoxes
