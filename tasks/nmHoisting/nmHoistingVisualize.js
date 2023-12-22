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
// Data
// ------------------------
element = document.querySelector('#bar-chart')

const { node_modules } = data[0]

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
    Object.keys(nestedDepsB).length - Object.keys(nestedDepsA).length
)

const barChart = {}

barChart.labels = node_modulesS.map(getDep)
barChart.data = node_modulesS.map(getNestedDepsNo)
barChart.tooltipFooter = ([tooltipItem]) => {
  return Object.entries(node_modulesS[tooltipItem.dataIndex][1])
    .map(getTooltipString)
    .join('\n')
}

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
})

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
    node_modulesS.filter(([dep]) => isRWDep(dep))[tooltipItem.dataIndex][1]
  )
    .map(getTooltipString)
    .join('\n')
}

// eslint-disable-next-line no-new
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
    // maintainAspectRatio: false,

    indexAxis: 'y',

    scales: {
      y: {
        beginAtZero: true,
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
})
