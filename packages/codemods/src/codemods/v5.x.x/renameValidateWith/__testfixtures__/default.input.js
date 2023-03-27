validateWith(() => {
  if (input.name === 'Name') {
    throw "You'll have to be more creative than that"
  }
})

validateWith(() => {
  if (input.name === 'Name') {
    throw new Error("You'll have to be more creative than that")
  }
})
