import styled from 'styled-components'
import AddTodo from 'src/components/AddTodo'
import TodoListCell from 'src/components/TodoListCell'

const HomePage = () => {
  return (
    <SC.Wrapper>
      <SC.Title>Todo List</SC.Title>
      <TodoListCell />
      <AddTodo />
    </SC.Wrapper>
  )
}

const SC = {}
SC.Wrapper = styled.div`
  width: 600px;
  margin: 0 auto;
`
SC.Title = styled.h1`
  font-size: 24px;
  font-weight: bold;
  margin-top: 100px;
`

export default HomePage
