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
      os_url: 'https://openspending.org/api/3/cubes/a6a16b964a7e784f99adecc47f26318a:berlin-be/aggregate/?drilldown=date_2.Jahr|phase_2.BetragTyp&order=Betrag.sum:desc&pagesize=2000',
      datacollection: {
        labels: [],
        datasets: []
      },
      levelLabel: 'Total',
      options: {
        scales: {
          yAxes: [{
            ticks: {
              beginAtZero: true
            }
          }]
        },
        maintainAspectRatio: false
      }
    }
  },
  computed: {
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
      var filterArgumentQuote
      for (var k in this.filters) {
        if (k !== 'BetragTyp' && k !== 'Jahr') {
          if (this.filters[k] !== '') {
            filterArgumentQuote = ''
            if (this.config['filters'][k]['type'] === 'string') {
              filterArgumentQuote = '"'
            }
            filters += `${this.config['filters'][k]['name']}:${filterArgumentQuote}${this.filters[k]}${filterArgumentQuote}|`
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
      this.updateLevelLabel()
      axios.get(this.os_url + filtersUrl + hierarchiesUrl).then(resp => {
        let years = {}
        resp.data.cells.forEach(cell => {
          if (!years.hasOwnProperty(cell['phase_2.BetragTyp'])) {
            years[cell['phase_2.BetragTyp']] = []
          }
          years[cell['phase_2.BetragTyp']].push([cell['date_2.Jahr'], cell['Betrag.sum']])
        })

        let yearsLabels = {}
        let yearsData = {}

        for (var k in years) {
          years[k].sort((a, b) => a[0] > b[0])
          yearsLabels[k] = years[k].map(x => x[0])
          yearsData[k] = years[k].map(x => x[1])
        }

        let minIst = years['Ist'][0][0]
        let minPlan = years['Plan'][0][0]

        if (minIst < minPlan) {
          for (let y = minIst; y < minPlan; ++y) {
            yearsData['Plan'] = [0, ...yearsData['Plan']]
          }
        } else if (minPlan < minIst) {
          for (let y = minPlan; y < minIst; ++y) {
            yearsData['Ist'] = [0, ...yearsData['Ist']]
          }
        }

        let minYear = Math.min(years['Ist'][0][0], years['Plan'][0][0])
        let maxYear = Math.max(years['Ist'][years['Ist'].length - 1][0], years['Plan'][years['Plan'].length - 1][0])

        let labels = []
        console.log(minYear, maxYear, years)
        for (var y = minYear; y <= maxYear; ++y) {
          labels.push(y)
        }
        console.log('LABEL', labels)

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
              label: 'Ist',
              backgroundColor: colorBright,
              data: yearsData['Ist']
            },
            {
              label: 'Plan',
              backgroundColor: colorDark,
              data: yearsData['Plan']
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
