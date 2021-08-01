import FailureState from './FailureState'

export const generated = () => {
  return <FailureState error={new Error('Oh no')}/>
}

export default { title: 'Components/FailureState' }
