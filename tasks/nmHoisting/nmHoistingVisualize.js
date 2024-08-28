/* eslint-env browser */
/* eslint-disable camelcase */
/* eslint-disable no-new */

let element

const data = rawData.map(JSON.parse)

// ------------------------
// Helpers
// ------------------------

const getDep = ([dep]) => dep
const getNestedDepsNo = ([_dep, nestedDeps]) => Object.keys(nestedDeps).length
const getTooltipString = ([dep, version]) => `${dep}@${version}`

const isRWDep = (dep) => dep.startsWith('@redwoodjs/')

// ------------------------
// Raw data
// ------------------------
element = document.querySelector('#raw-data')
element.textContent = JSON.stringify(data, null, 2)

// ------------------------
// Versions
// ------------------------
const versions = data
  .map(({ version }) => version)
  .sort()
  .reverse()
let selectedVersionAIndex = 0
let selectedVersionBIndex = undefined

element = document.querySelector('#versionASelect')
versions.forEach((version, index) => {
  const option = document.createElement('option')
  option.value = index
  option.textContent = version
  option.selected = index === 0
  element.appendChild(option)
})
element.onchange = () => {
  let el = document.querySelector('#versionASelect')
  selectedVersionAIndex = el.value
  analyse()
}

element = document.querySelector('#versionBSelect')
versions.forEach((version, index) => {
  const option = document.createElement('option')
  option.value = index
  option.textContent = version
  element.appendChild(option)
})
element.onchange = () => {
  let el = document.querySelector('#versionBSelect')
  selectedVersionBIndex = el.value === '-1' ? undefined : el.value
  analyse()
}

// ------------------------
// Data
// ------------------------
let activeCharts = []
const analyseNoComparison = () => {
  activeCharts.forEach((chart) => chart.destroy())
  activeCharts = []

  element = document.querySelector('#bar-chart')

  const { node_modules } = data[selectedVersionAIndex]

  // Sort dependencies by those with the most nested dependencies. Here `node_modules` is an object like...
  //
  // ```js
  // {
  //   'jest-runtime': {
  //     'strip-bom': '4.0.0'
  //   },
  //   'browserify-rsa': {
  //     'bn.js': '5.2.1'
  //   },
  //   // ...
  // }
  // ```
  const node_modulesS = Object.entries(node_modules).sort(
    ([_depA, nestedDepsA], [_depB, nestedDepsB]) =>
      Object.keys(nestedDepsB).length - Object.keys(nestedDepsA).length,
  )

  const barChart = {}

  barChart.labels = node_modulesS.map(getDep)
  barChart.data = node_modulesS.map(getNestedDepsNo)
  barChart.tooltipFooter = ([tooltipItem]) => {
    return Object.entries(node_modulesS[tooltipItem.dataIndex][1])
      .map(getTooltipString)
      .join('\n')
  }

  element.style.maxHeight = `${barChart.data.length * 30}px`
  activeCharts.push(
    new Chart(element, {
      type: 'bar',

      data: {
        labels: barChart.labels,
        datasets: [
          {
            label: 'Nested node_modules',
            data: barChart.data,
            borderWidth: 1,
          },
        ],
      },

      options: {
        maintainAspectRatio: false,

        indexAxis: 'y',

        scales: {
          y: {
            beginAtZero: true,
          },
        },

        plugins: {
          tooltip: {
            callbacks: {
              footer: barChart.tooltipFooter,
            },
          },
        },
      },
    }),
  )

  // ------------------------
  // RW Data
  // ------------------------
  element = document.querySelector('#rw-bar-chart')

  const rwBarChart = {}

  rwBarChart.labels = barChart.labels.filter(isRWDep)

  rwBarChart.data = node_modulesS
    .filter(([name]) => isRWDep(name))
    .map(getNestedDepsNo)

  rwBarChart.rwTooltipFooter = ([tooltipItem]) => {
    return Object.entries(
      node_modulesS.filter(([dep]) => isRWDep(dep))[tooltipItem.dataIndex][1],
    )
      .map(getTooltipString)
      .join('\n')
  }

  element.style.maxHeight = `${rwBarChart.data.length * 30}px`
  // eslint-disable-next-line no-new
  activeCharts.push(
    new Chart(element, {
      type: 'bar',

      data: {
        labels: rwBarChart.labels,
        datasets: [
          {
            label: 'Nested node modules',
            data: rwBarChart.data,
            borderWidth: 1,
          },
        ],
      },

      options: {
        maintainAspectRatio: false,

        indexAxis: 'y',

        scales: {
          y: {
            beginAtZero: true,
          },
          x: {
            ticks: {
              stepSize: 1,
            },
          },
        },

        plugins: {
          tooltip: {
            callbacks: {
              footer: rwBarChart.rwTooltipFooter,
            },
          },
        },
      },
    }),
  )
}

const analyseWithComparison = () => {
  activeCharts.forEach((chart) => chart.destroy())
  activeCharts = []

  element = document.querySelector('#bar-chart')

  const { node_modules: node_modulesA } = data[selectedVersionAIndex]
  const { node_modules: node_modulesB } = data[selectedVersionBIndex]

  const allKeys = [
    ...new Set([...Object.keys(node_modulesA), ...Object.keys(node_modulesB)]),
  ].sort()

  const node_modulesDiff = {}
  for (const key of allKeys) {
    const nestedDepsA = node_modulesA[key]
    const nestedDepsB = node_modulesB[key]

    const added = []
    const removed = []
    const unchanged = []

    if (nestedDepsA === undefined) {
      added.push(...Object.keys(nestedDepsB))
    } else if (nestedDepsB === undefined) {
      removed.push(...Object.keys(nestedDepsA))
    } else {
      for (const dep of Object.keys(nestedDepsA)) {
        if (nestedDepsB[dep] === undefined) {
          removed.push(dep)
        } else {
          unchanged.push(dep)
        }
      }
      for (const dep of Object.keys(nestedDepsB)) {
        if (nestedDepsA[dep] === undefined) {
          added.push(dep)
        }
      }
    }

    node_modulesDiff[key] = { added, removed, unchanged }
  }

  const sortedKeys = Object.entries(node_modulesDiff)
    .sort(
      (
        [_depA, { added: addedA, removed: removedA }],
        [_depB, { added: addedB, removed: removedB }],
      ) => addedB.length + removedB.length - (addedA.length + removedA.length),
    )
    .map(([dep]) => {
      return dep
    })
  let addedData = []
  let removedData = []
  let unchangedData = []
  for (const key of sortedKeys) {
    const { added, removed, unchanged } = node_modulesDiff[key]
    addedData.push(added.length)
    removedData.push(-removed.length)
    unchangedData.push(unchanged.length)
  }

  element.style.maxHeight = `${sortedKeys.length * 30}px`
  // eslint-disable-next-line no-new
  activeCharts.push(
    new Chart(element, {
      type: 'bar',

      data: {
        labels: sortedKeys,
        datasets: [
          {
            label: 'Added',
            data: addedData,
            borderWidth: 1,
            borderColor: '#4BC0C0',
            backgroundColor: '#4BC0C0',
          },
          {
            label: 'Removed',
            data: removedData,
            borderWidth: 1,
            borderColor: '#FF6384',
            backgroundColor: '#FF6384',
          },
          {
            label: 'Unchanged',
            data: unchangedData,
            borderWidth: 1,
            borderColor: '#36A2EB',
            backgroundColor: '#36A2EB',
            hidden: true,
          },
        ],
      },

      options: {
        maintainAspectRatio: false,

        indexAxis: 'y',

        scales: {
          y: {
            beginAtZero: true,
            stacked: true,
          },
          x: {
            ticks: {
              stepSize: 1,
            },
            stacked: true,
          },
        },

        plugins: {
          tooltip: {
            callbacks: {
              footer: ([data]) => {
                let index = data.dataIndex
                let type = data.dataset.label
                return node_modulesDiff[sortedKeys[index]][
                  type.toLowerCase()
                ].join('\n')
              },
            },
          },
        },
      },
    }),
  )

  const redwoodKeys = sortedKeys.filter(isRWDep)

  element = document.querySelector('#rw-bar-chart')
  element.style.maxHeight = `${redwoodKeys.length * 30}px`

  addedData = []
  removedData = []
  unchangedData = []
  for (const key of redwoodKeys) {
    const { added, removed, unchanged } = node_modulesDiff[key]
    addedData.push(added.length)
    removedData.push(-removed.length)
    unchangedData.push(unchanged.length)
  }
  // eslint-disable-next-line no-new
  activeCharts.push(
    new Chart(element, {
      type: 'bar',

      data: {
        labels: redwoodKeys,
        datasets: [
          {
            label: 'Added',
            data: addedData,
            borderWidth: 1,
            borderColor: '#4BC0C0',
            backgroundColor: '#4BC0C0',
          },
          {
            label: 'Removed',
            data: removedData,
            borderWidth: 1,
            borderColor: '#FF6384',
            backgroundColor: '#FF6384',
          },
          {
            label: 'Unchanged',
            data: unchangedData,
            borderWidth: 1,
            borderColor: '#36A2EB',
            backgroundColor: '#36A2EB',
            hidden: true,
          },
        ],
      },

      options: {
        maintainAspectRatio: false,

        indexAxis: 'y',

        scales: {
          y: {
            beginAtZero: true,
            stacked: true,
          },
          x: {
            ticks: {
              stepSize: 1,
            },
            stacked: true,
          },
        },

        plugins: {
          tooltip: {
            callbacks: {
              footer: ([data]) => {
                let index = data.dataIndex
                let type = data.dataset.label
                return node_modulesDiff[redwoodKeys[index]][
                  type.toLowerCase()
                ].join('\n')
              },
            },
          },
        },
      },
    }),
  )
}

const analyse = () => {
  if (selectedVersionBIndex === undefined) {
    analyseNoComparison()
  } else {
    analyseWithComparison()
  }
}
analyse()
