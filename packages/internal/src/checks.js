const project = require('@redwoodjs/internal')

console.log('Enum: ', project.SidesEnum)

console.log('Sides: ', project.getSides())

console.log('TS base: ', project.isTypescript())
console.log('TS api: ', project.isTypescript('api'))
console.log('TS web: ', project.isTypescript('web'))

console.log('DB: ', project.hasDb())
console.log('Schema: ', project.hasDb(true))
