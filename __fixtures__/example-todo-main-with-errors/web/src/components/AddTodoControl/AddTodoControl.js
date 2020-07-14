import styled from 'styled-components'
import { useState } from 'react'
import Check from 'src/components/Check'

const AddTodoControl = ({ submitTodo }) => {
  const [todoText, setTodoText] = useState('')

  const handleSubmit = (event) => {
    submitTodo(todoText)
    setTodoText('')
    event.preventDefault()
  }

  const handleChange = (event) => {
    setTodoText(event.target.value)
  }

  return (
    <SC.Form onSubmit={handleSubmit}>
      <Check type="plus" />
      <SC.Body>
        <SC.Input
          type="text"
          value={todoText}
          placeholder="Memorize the dictionary"
          onChange={handleChange}
        />
        <SC.Button type="submit" value="Add Item" />
      </SC.Body>
    </SC.Form>
  )
}

const SC = {}
SC.Form = styled.form`
  display: flex;
  align-items: center;
`
SC.Body = styled.div`
  border-top: 1px solid #efefef;
  border-bottom: 1px solid #efefef;
  width: 100%;
`
SC.Input = styled.input`
  border: none;
  font-size: 18px;
  font-family: 'Inconsolata', monospace;
  padding: 10px 0;
  width: 75%;

  ::placeholder {
    color: #e1e1e1;
  }
`
SC.Button = styled.input`
  float: right;
  margin-top: 5px;
  border-radius: 6px;
  background-color: #8000ff;
  padding: 5px 15px;
  color: white;
  border: 0;
  font-size: 18px;
  font-family: 'Inconsolata', monospace;

  :hover {
    background-color: black;
    cursor: pointer;
  }
`

export default AddTodoControl
