import styled from 'styled-components'
import Check from 'src/components/Check'

const TodoItem = ({ id, body, status, onClickCheck }) => {
  const handleCheck = () => {
    const newStatus = status === 'off' ? 'on' : 'off'
    onClickCheck(id, newStatus)
  }

  return (
    <SC.Item>
      <SC.Target onClick={handleCheck}>
        <Check type={status} />
      </SC.Target>
      <SC.Body>{status === 'on' ? <s>{body}</s> : body}</SC.Body>
    </SC.Item>
  )
}

const SC = {}
SC.Item = styled.li`
  display: flex;
  align-items: center;
  list-style: none;
`
SC.Target = styled.div`
  cursor: pointer;
`
SC.Body = styled.div`
  list-style: none;
  font-size: 18px;
  border-top: 1px solid #efefef;
  padding: 10px 0;
  width: 100%;
`

export default TodoItem
