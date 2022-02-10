const bazingaFunc = () => {
  console.log('Running bazinga func')

  if (typeof window === 'undefined') {
    console.log('Running on server')
  } else {
    console.log('Running in browser')
  }

  return 'Soft bazinga'.replaceAll('bazinga', 'kittens')
}

export default bazingaFunc
