import styled from 'styled-components'

import IconOn from './on.svg'
import IconOff from './off.svg'
import IconPlus from './plus.svg'
import IconLoading from './loading.svg'

const map = {
  on: <IconOn />,
  off: <IconOff />,
  plus: <IconPlus />,
  loading: <IconLoading />,
}

const Check = ({ type }) => {
  return <SC.Icon>{map[type]}</SC.Icon>
}

const SC = {}
SC.Icon = styled.div`
  margin-right: 15px;
`

export default Check
