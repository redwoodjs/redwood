import type { API, FileInfo } from 'jscodeshift'

const seedFragmentData = `try {
  const stalls = [
    {
      id: 'clr0zv6ow000012nvo6r09vog',
      name: 'Salad Veggies',
      stallNumber: '1',
    },
    {
      id: 'clr0zvne2000112nvyhzf1ifk',
      name: 'Pie Veggies',
      stallNumber: '2',
    },
    {
      id: 'clr0zvne3000212nv6boae9qw',
      name: 'Root Veggies',
      stallNumber: '3',
    },
  ]

  if ((await db.stall.count()) === 0) {
    await Promise.all(
      stalls.map(async (stall) => {
        const newStall = await db.stall.create({ data: stall })

        console.log(newStall)
      })
    )
  } else {
    console.log('Stalls already seeded')
  }

  const produce = [
    {
      id: 'clr0zwyoq000312nvfsu1efcw',
      name: 'Lettuce',
      quantity: 10,
      price: 2,
      ripenessIndicators: null,
      region: '',
      isSeedless: false,
      vegetableFamily: 'Asteraceae',
      stallId: 'clr0zv6ow000012nvo6r09vog',
    },
    {
      id: 'clr0zy32x000412nvsya5g8q0',
      name: 'Strawberries',
      quantity: 24,
      price: 3,
      ripenessIndicators: 'Vitamin C',
      region: 'California',
      isSeedless: false,
      vegetableFamily: 'Soft',
      stallId: 'clr0zvne2000112nvyhzf1ifk',
    },
  ]

  if ((await db.produce.count()) === 0) {
    await Promise.all(
      produce.map(async (produce) => {
        const newProduce = await db.produce.create({ data: produce })

        console.log(newProduce)
      })
    )
  } else {
    console.log('Produce already seeded')
  }
} catch (error) {
  console.error(error)
}`

export default (file: FileInfo, api: API) => {
  const j = api.jscodeshift
  const root = j(file.source)

  return root
    .find(j.TryStatement)
    .at(-1)
    .insertBefore(seedFragmentData)
    .toSource()
}
