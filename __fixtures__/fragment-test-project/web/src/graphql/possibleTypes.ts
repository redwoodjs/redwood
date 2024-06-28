export interface PossibleTypesResultData {
  possibleTypes: {
    [key: string]: string[]
  }
}
const result: PossibleTypesResultData = {
  possibleTypes: {
    Groceries: ['Fruit', 'Vegetable'],
    Grocery: ['Fruit', 'Vegetable'],
  },
}
export default result
