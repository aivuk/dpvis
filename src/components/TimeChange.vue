<template>
  <div class="barchart">
    <!-- <div class="barLevel"><h1>{{levelLabel}}</h1></div> -->
    <BarPlot :chart-data=datacollection :options=options></BarPlot>
  </div>
</template>

<script>

import BarPlot from './BarPlot'
import axios from 'axios'
import * as d3 from 'd3'
import { mapGetters, mapMutations } from 'vuex'

export default {
  name: 'TimeChange',
  components: { BarPlot },
  data () {
    return {
      datacollection: {
        labels: [],
        datasets: []
      },
      levelLabel: 'Total',
      options: {
        scales: {
          yAxes: [{
            ticks: {
              beginAtZero: true,
              callback: (value, index, values) => {
                let ivalue = parseInt(value)
                if (ivalue >= 1000) {
                  if (ivalue < 1000000) {
                    return (ivalue / 1000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '€'
                  } else if (ivalue >= 1000000 && ivalue <= 1000000000) {
                    return (ivalue / 1000000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' Mio. €'
                  } else if (ivalue >= 1000000000) {
                    return (ivalue / 1000000000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' Mrd. €'
                  } else {
                    return ivalue + '€'
                  }
                }
              }
            }
          }]
        },
        maintainAspectRatio: false
      }
    }
  },
  computed: {
    hasModel: function () {
      return Object.keys(this.model).length > 0
    },
    os_url: function () {
      return `https://openspending.org/api/3/cubes/${this.config.datapackage}/aggregate/?drilldown=${this.config.date}|${this.config.budgetType}&order=betrag.sum:desc&pagesize=2000`
    },
    ...mapGetters(['selectedHierarchy', 'filters', 'config', 'model', 'hierarchyColors'])
  },
  props: {
    msg: String
  },
  methods: {
    getHierarchies: function () {
      var levelsLength = this.selectedHierarchy['levelsParams'].length
      var hierqQuery = ''

      if (levelsLength > 0) {
        var hierarchy = this.model.hierarchies[this.selectedHierarchy['hierarchy']['datapackageHierarchy']]
        for (var i in hierarchy['levels']) {
          if (i < levelsLength) {
            var hierqName = hierarchy['levels'][i]
            var bar = ''
            if (i > 0) {
              bar = '|'
            }
            hierqQuery += `${bar}${this.model.dimensions[hierqName]['key_ref']}:"${this.selectedHierarchy['levelsParams'][i]}"`
          }
        }
      }
      return hierqQuery
    },

    updateLevelLabel: function () {
      if (!this.hasModel) {
        return
      }

      var hierarchyName = this.selectedHierarchy['hierarchy']['datapackageHierarchy']
      var level = this.selectedHierarchy['levelsParams'].length
      var dimensionName = this.model['hierarchies'][hierarchyName]['levels'][level]
      // var levelKey = this.model['dimensions'][dimensionName]['key_ref']

      let levelsLength = this.selectedHierarchy['levelsParams'].length
      if (levelsLength > 0) {
        // this.levelLabel = this.selectedHierarchy['levelsParams'][this.selectedHierarchy['levelsParams'].length - 1]
        let levelLabel = this.model['dimensions'][dimensionName]['label_ref']
        this.levelLabel = levelLabel
        this.levelLabel = decodeURI(this.levelLabel)
      } else {
        this.levelLabel = 'Total'
      }
    },

    getFilters: function () {
      var filters = ''
      var filterValue
      for (var k in this.filters) {
        if (k !== this.config.budgetTypeFilter && k !== this.config.dateFilter) {
          if (this.filters[k] !== '') {
            if (this.config['filters'][k]['type'] === 'string') {
              if (this.filters[k].indexOf(';') === -1) {
                filterValue = `"${this.filters[k]}"`
              } else {
                filterValue = this.filters[k]
              }
            }
            filters += `${this.config['filters'][k]['name']}:${filterValue}|`
          }
        }
      }

      if (filters !== '') {
        return `cut=${filters}`
      } else {
        return ''
      }
    },

    updateData: function () {
      let filtersUrl = '&' + this.getFilters()
      let hierarchiesUrl = this.getHierarchies()
      // this.updateLevelLabel()
      axios.get(this.os_url + filtersUrl + hierarchiesUrl).then(resp => {
        let years = {}
        resp.data.cells.forEach(cell => {
          if (!years.hasOwnProperty(cell[this.config.budgetType])) {
            years[cell[this.config.budgetType]] = []
          }
          years[cell[this.config.budgetType]].push([cell[this.config.date], cell['betrag.sum']])
        })

        let yearsLabels = {}
        let yearsData = {}
        let phasesNum = 0
        let phases = []
        let minYear, maxYear

        for (var k in years) {
          years[k].sort((a, b) => a[0] > b[0])
          yearsLabels[k] = years[k].map(x => x[0])
          yearsData[k] = years[k].map(x => x[1])
          phasesNum += 1
          phases.push(k)
        }

        if (phasesNum > 1) {
          let minIst = years[this.config.betragIst][0][0]
          let minPlan = years[this.config.betragSoll][0][0]
          if (minIst < minPlan) {
            for (let y = minIst; y < minPlan; ++y) {
              yearsData[this.config.betragSoll] = [0, ...yearsData[this.config.betragSoll]]
            }
          } else if (minPlan < minIst) {
            for (let y = minPlan; y < minIst; ++y) {
              yearsData[this.config.betragIst] = [0, ...yearsData[this.config.betragIst]]
            }
          }
          minYear = Math.min(years[this.config.betragIst][0][0], years[this.config.betragSoll][0][0])
          maxYear = Math.max(years[this.config.betragIst][years[this.config.betragIst].length - 1][0], years[this.config.betragSoll][years[this.config.betragSoll].length - 1][0])
        } else {
          minYear = Math.min(years[phases[0]])
          maxYear = Math.max(years[phases[0]])
        }

        let labels = []
        for (var y = minYear; y <= maxYear; ++y) {
          labels.push(y)
        }

        let colorBright = d3.rgb(98, 0, 234)
        let colorDark = colorBright.darker().darker()

        if (this.selectedHierarchy['levelsParams'].length > 0) {
          colorBright = d3.rgb(this.hierarchyColors[decodeURI(this.selectedHierarchy['levelsParams'][0])])
          colorDark = colorBright.darker().darker()
        }
        this.datacollection = {
          labels: labels,
          datasets: [
            {
              label: 'Soll',
              backgroundColor: colorDark,
              data: yearsData[this.config.betragSoll]
            },
            {
              label: 'Ist',
              backgroundColor: colorBright,
              data: yearsData[this.config.betragIst]
            }
          ]
        }
      })
    },
    ...mapMutations(['setHierarchy', 'setLevelsParams'])
  },
  mounted () {
    this.updateData()
  },
  watch: {
    'filters': {
      'handler': function (newFilters) {
        this.updateData()
      },
      deep: true
    },
    'selectedHierarchy': {
      'handler': function (newFilters) {
        this.updateData()
      },
      deep: true
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.barchart {
  max-height: 300px;
  margin-bottom: 150px;
}
#bar-chart {
}
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
.barLevel {
  > h1 {
    font-weight: bold;
  }
}
</style>
