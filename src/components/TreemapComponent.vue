<template>
  <div class="treemap-content">
    <div class="controls">
      <div class="hierarchies">
         <div class="filter">
           Anzeige nach
           <b-field>
             <b-select class="dropdown-toggle" @change="changeHierarqUrl()" v-model='hierarqUrl'>
               <option v-bind:hierq="hierq" v-bind:key="hierq['label']" v-for="hierq in config['hierarchies']" :value="hierq['url']">{{hierq['label']}}</option>
             </b-select>
           </b-field>
         </div>
      </div>
      <div class="measures" v-if="config['value'].length > 1">
        <b-field>
          <b-select @input="updateData()" v-model="selectedMeasure">
            <option :value="i" :key="measure.label" v-for="(measure, i) in config['value']">{{measure.label}}</option>
          </b-select>
        </b-field>
      </div>
      <div class="scales" v-if="config['scale'].length >= 1">
        <div class="filter">
          Betrag anzeigen als
          <b-field>
            <b-select @input="updateScale()" v-model="selectedScale">
              <option :value="i" :key="scale.label"  v-for="(scale, i) in config['scale']">{{scale.label}}</option>
            </b-select>
          </b-field>
        </div>
      </div>
      <div class="filters">
        <div class="filter" :key="filterName" v-for="(filter, filterName) in config['filters']">
          {{ filter.label }}
          <b-select @input="addFilters()" class="dropdown-toggle" v-model="filters[filterName]">
            <option :class="{top: filterValue.isTop}" :value="filterValue.value" :key="filterValue.value" v-for="filterValue in filter.values">{{ filterValue.isSub?'&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;':'' }}{{filterValue.label}}</option>
          </b-select>
        </div>
      </div>
    </div>
    <div class="breadcrumb tc" v-if="breadcrumb.length > 1">
      <div class="blevel" :key="b['label']" v-for="(b, index) in breadcrumb">
        <a :href="b['url']">{{ b['label'] }} </a>
        <span>{{(index < breadcrumb.length - 1)?" >":""}}</span>
      </div>
    </div>
    <div id="treemap" class="treemap">
    </div>
    <div id="table-toggle" @click="showTable = !showTable"><span class="button is-primary">{{ (!showTable)?'Übersicht als Liste':'Zuklappen' }}</span></div>
    <div class="table-div">
      <table class="table table-condensed" v-if="showTable">
        <tr>
          <th @click="updateSort('titel')">Titel <i class="fa" :class="{'inactive-sort': sortType !== 'titel', 'fa-sort-down': sort['titel'] === 1, 'fa-sort-up': sort['titel'] === 0}"></i></th>
          <th @click="updateSort('betrag')" class="num">{{ valueHeader }} <i class="fa" :class="{'inactive-sort': sortType !== 'betrag', 'fa-sort-down': sort['betrag'] === 1, 'fa-sort-up': sort['betrag'] === 0}"></i></th>
          <th @click="updateSort('betrag')" class="num">Anteil <i class="fa" :class="{'inactive-sort': sortType !== 'betrag', 'fa-sort-down': sort['betrag'] === 1, 'fa-sort-up': sort['betrag'] === 0}"></i></th>
        </tr>
        <tr v-for="(cell, i) in dataSorted" :key="i">
            <td>
            <i :style="`color: ${cell['_color']};`" class="level-color fa fa-square"></i>
            <div class="level-label">
              <a v-if="!isLastLevel && cell['_url']" :href="cell['_url']">{{ cell['_label'] }}</a>
              <span v-if="isLastLevel || !cell['_url']">
                {{ cell['_label'] }}
              </span>
            </div>
            </td>
            <td class="num">{{ cell['_value_fmt'] }}</td>
            <td class="num">{{ cell['_percentage_fmt'] }}</td>
          </tr>
        <tr>
          <th>
            Total
          </th>
          <th v-if="data['summary']" class="num">{{ data['summary']['_valueFmt'] }}</th>
          <th class="num">100%</th>
        </tr>
      </table>
    </div>
    <div id="download">
      <a :href="resource">download<!-- <i class="fa fa-download" aria-hidden="true"></i> --></a>
    </div>
  </div>
</template>

<script>
import Treemap from '../treemap'
import { mapGetters, mapMutations } from 'vuex'
import parseURL from '../utils/urlParser'
import axios from 'axios'
import * as d3 from 'd3'
import * as qs from 'query-string'
import * as accounting from 'accounting'

export default {
  name: 'treemap',

  props: [ 'apiurl', 'update' ],

  data () {
    return {
      model: {},
      hasModel: false,
      firstHierarq: true,
      colors: [
        '#AA00FF', '#6200EA', '#304FFE', '#2962FF', '#0091EA',
        '#00B8D4', '#00BFA5', '#64DD17', '#00C853'
      ],
      selectedMeasure: 0,
      selectedScale: 0,
      hasData: false,
      hierarqUrl: '',
      data: {'cells': []},
      sortType: 'betrag',
      sort: {'titel': 0, 'betrag': 1},
      hierarchyColors: {},
      resource: '',
      breadcrumb: [],
      showTable: true,
      datapackageFile: ''
    }
  },

  computed: {
    valueHeader: function () {
      var valueHeaderText = 'Betrag'
      if (this.config.valueHeader) {
        valueHeaderText = `${this.filters[this.config.valueHeader]}-Betrag`
      }
      return valueHeaderText
    },
    dataSorted: function () {
      if (this.sortType === 'betrag') {
        return this.data['cells'].sort((a, b) => (1 * (1 - this.sort[this.sortType]) - this.sort[this.sortType]) * (a['_value'] - b['_value']))
      } else {
        return this.data['cells'].sort((a, b) => (this.sort[this.sortType] === 0) ? a['_label'] > b['_label'] : a['_label'] < b['_label'])
      }
    },
    isLastLevel: function () {
      let hierarchyName = this.selectedHierarchy['hierarchy']['datapackageHierarchy']
      let dim = this.model['hierarchies'][hierarchyName]['levels'].length

      return this.selectedHierarchy['levelsParams'].length === dim
    },
    currentLevel: function () {
      let hierarchyName = this.selectedHierarchy['hierarchy']['datapackageHierarchy']
      let dim = this.model['hierarchies'][hierarchyName]['levels'].length

      if (dim > this.selectedHierarchy['levelsParams'].length) {
        return this.selectedHierarchy['levelsParams'].length
      } else {
        return this.selectedHierarchy['levelsParams'].length - 1
      }
    },
    ...mapGetters([
      'selectedHierarchy', 'filters', 'config'
    ])
  },

  mounted () {
    this.setConfig(this.$treemapconfig)
    if (this.$treemapconfig.hasOwnProperty('colors')) {
      this.colors = this.$treemapconfig['colors']
    }
    this.loadDatapackage()
  },

  methods: {

    changeHierarqUrl: function () {
      var URLarguments = parseURL(window.location.toString())
      var urlBase = ''
      var urlFilters = ''

      if (this.hierarqUrl) {
        urlBase = '#' + this.hierarqUrl
        let params = URLarguments[0].splice(1)
        if (this.hierarqUrl === URLarguments[0] && params.length > 0) {
          urlBase += '/' + params.join('/')
        }
      }

      if (Object.keys(URLarguments[1]).length > 0) {
        urlFilters = `?${qs.stringify(this.filters)}`
      }

      if (this.firstHierarq) {
        this.firstHierarq = false
        return
      }
      window.location.hash = urlBase + urlFilters
    },

    getBreadcrumb: function () {
      var apiRequestUrl = this.createApiRequestURL(false, true)
      var that = this

      var hierarqBase = that.selectedHierarchy.hierarchy.url
      var hierarqBaseLabel = that.selectedHierarchy.hierarchy.label
      var href = `#${hierarqBase}?${qs.stringify(that.filters)}`

      that.breadcrumb = [{'label': hierarqBaseLabel, 'url': href}]

      axios.get(apiRequestUrl).then(response => {
        if (response.data.data.length === 0) {
          return
        }
        that.selectedHierarchy.levelsParams.forEach(function (e, i) {
          // let dim = that.selectedHierarchy.levels[i]
          let hierarchyName = that.selectedHierarchy['hierarchy']['datapackageHierarchy']
          let dim = that.model['hierarchies'][hierarchyName]['levels'][i]
          let label = that.model.dimensions[dim]['label_ref']
          let levelName = response.data.data[0][label]
          let params = that.selectedHierarchy.levelsParams.slice(0, i + 1)
          let href = `#${hierarqBase}/${params.join('/')}?${qs.stringify(that.filters)}`

          that.breadcrumb.push({'label': levelName, 'url': href})
        })
      })
    },

    loadDatapackage: function () {
      this.treemap = new Treemap('treemap')
      this.getURLParameters()
      this.getModel().then(response => { this.updateData() })
    },

    updateSort: function (sortType) {
      if (sortType === this.sortType) {
        this.sort[sortType] = (this.sort[sortType] + 1) % 2
      }
      this.sortType = sortType
    },

    defaultFilters: function () {
      for (var k in this.config.filters) {
        if (!this.filters.hasOwnProperty(k)) {
          this.addFilter({'name': k, 'value': this.config.filters[k].defaultValue})
        }
      }
    },

    hierarchyURL: function () {
      var URLarguments = parseURL(window.location.toString())
      if (URLarguments[0].length > 0) {
        return URLarguments[0][0]
      } else {
        return ''
      }
    },

    updateScale: function () {
      for (var i in this.data['cells']) {
        this.data['cells'][i]['_value_fmt'] = this.formatValue(this.data['cells'][i]['_value'], this.config['value'][this.selectedMeasure]['formatOptions'])
      }
      this.treemap.render(this.data)
    },

    getURLParameters: function () {
      var URLarguments = parseURL(window.location.toString())
      if (URLarguments[0].length === 0) {
        // this.$set(this.selectedHierarchy, 'hierarchy', this.config['hierarchies'][0])
        this.setHierarchy(this.config['hierarchies'][0])
        this.hierarqUrl = this.config['hierarchies'][0]['url']
        window.location.replace('#' + this.config['hierarchies'][0]['url'])
      } else {
        var hierarchyIdx = this.config['hierarchies'].findIndex(function (h) { return h['url'] === URLarguments[0][0] })
        var hierarchy = this.config['hierarchies'][hierarchyIdx]
        this.hierarqUrl = hierarchy['url']
        // this.$set(this.selectedHierarchy, 'hierarchy', hierarchy)
        this.setHierarchy(hierarchy)
      }
      // this.$set(this.selectedHierarchy, 'levelsParams', URLarguments[0].splice(1))
      this.setLevelsParams(URLarguments[0].splice(1))

      var urlFilters = URLarguments[1]
      for (var k in urlFilters) {
        this.addFilter({name: k, value: urlFilters[k]})
      }
    },

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

    levelBack: function () {
      var URLarguments = parseURL(window.location.toString())
      var hierarchyURL = URLarguments[0]
      if (hierarchyURL.length > 1) {
        hierarchyURL.pop()
      }
      window.location.hash = `/${hierarchyURL.join('/')}?${qs.stringify(this.filters)}`
    },

    addFilters: function () {
      var URLarguments = parseURL(window.location.toString())
      window.location.hash = `#${URLarguments[0].join('/')}?${qs.stringify(this.filters, { encode: false })}`
    },

    getDrilldown: function (levelNumber = this.currentLevel) {
      var level = this.getLevel(levelNumber)
      var label = level[0]
      var key = level[1]
      return `${label}|${key}`
    },

    getRootColors: function (color, data) {
      var level = this.getLevel(0)
      for (var i in data['cells']) {
        var cellLevel = data['cells'][i][level[1]]
        this.hierarchyColors[cellLevel] = color(i)
      }
      this.setHierarchyColors(this.hierarchyColors)
    },

    updateData: function () {
      if (!this.hasModel) {
        return
      }
      this.getURLParameters()
      if (Object.keys(this.hierarchyColors).length === 0) {
        return this.getRoot().then(response => { this.getData() })
      }
      this.getData()
    },

    getModel: function () {
      if (this.config.hasOwnProperty('datapackage')) {
        this.datapackage = this.config.datapackage
      }
      var datapackagePath = this.datapackage.replace(':', '/')
      var datapackageUrl = `https://s3.amazonaws.com/datastore.openspending.org/${datapackagePath}/`
      if (this.config.hasOwnProperty('datapackageURL')) {
        this.datapackageFile = this.config.datapackageURL
      } else {
        this.datapackageFile = datapackageUrl + 'datapackage.json'
      }

      return axios.get(this.datapackageFile).then(response => {
        if (this.config.hasOwnProperty('datapackageURL')) {
          this.resource = this.config.datapackageURL.slice(0, this.config.datapackageURL.lastIndexOf('/') + 1) + response.data.resources[0].path
        } else {
          this.resource = datapackageUrl + response.data.resources[0].path
        }

        var apiRequestUrl = `${this.apiurl}${this.datapackage}/model/`
        return axios.get(apiRequestUrl).then(response => {
          this.model = response.data.model
          this.setModel(this.model)
          this.hasModel = true
          var hierarchyName = this.selectedHierarchy['hierarchy']['datapackageHierarchy']
          this.$set(this.selectedHierarchy, 'levels', this.model['hierarchies'][hierarchyName]['levels'])
//          this.setLevels()
          this.addFilters()
          // this.defaultFilters()
        })
      })
    },

    getRoot: function () {
      var apiRequestUrl = this.createApiRequestURL(true)
      return axios.get(apiRequestUrl).then(response => {
        if (response.data.cells.length === 0) {
          return
        }
        var color = d3.scale.ordinal().range(this.colors)
        color = color.domain([response.data.total_cell_count, 0])
        this.getRootColors(color, response.data)
      })
    },

    getRootLevel: function () {
      var hierarchyName = this.selectedHierarchy['hierarchy']['datapackageHierarchy']
      var dimensionName = this.model['hierarchies'][hierarchyName]['levels'][0]
      var levelLabel = this.model['dimensions'][dimensionName]['label_ref']
      var levelKey = this.model['dimensions'][dimensionName]['key_ref']
      return [levelLabel, levelKey]
    },

    getLevel: function (level) {
      var hierarchyName = this.selectedHierarchy['hierarchy']['datapackageHierarchy']
      var dimensionName = this.model['hierarchies'][hierarchyName]['levels'][level]
      console.log('NAME', dimensionName)
      var levelLabel = this.model['dimensions'][dimensionName]['label_ref']
      var levelKey = this.model['dimensions'][dimensionName]['key_ref']
      return [levelLabel, levelKey]
    },

    getFilters: function () {
      var filters = ''
      var filterValue
      for (var k in this.filters) {
        if (this.filters[k] !== '') {
          if (this.config['filters'][k]['type'] === 'string') {
            if (this.filters[k].indexOf(';') === -1) {
              filterValue = `"${this.filters[k]}"`
            } else {
              filterValue = this.filters[k]
            }
          } else {
            filterValue = this.filters[k]
          }
          filters += `${this.config['filters'][k]['name']}:${filterValue}|`
        }
      }

      if (filters !== '') {
        return `cut=${filters}`
      } else {
        return ''
      }
    },

    formatValue: function (value, formatOptions) {
      var postfix = ''
      if (formatOptions.postfix) {
        postfix = formatOptions.postfix
      }

      if (this.selectedScale >= 1) {
        value = value / Number(this.config['scale'][this.selectedScale]['number'])
        postfix = `${postfix} ${this.config['scale'][this.selectedScale]['description']}`
      }
      return accounting.formatMoney(value, formatOptions) + postfix
    },

    createApiRequestURL: function (rootLevel = false, facts = false) {
      var drilldown
      var hierarchiesFilter = ''
      var apiRequestUrl = ''
      if (rootLevel) {
        drilldown = this.getDrilldown(0)
      } else {
        drilldown = this.getDrilldown()
        hierarchiesFilter = this.getHierarchies()
      }
      var filters = this.getFilters()
      if (!facts) {
        apiRequestUrl = `${this.apiurl}${this.datapackage}/aggregate/?${filters}${hierarchiesFilter}&drilldown=${drilldown}&order=${this.config.value[this.selectedMeasure]['field']}:desc`
      } else {
        apiRequestUrl = `${this.apiurl}${this.datapackage}/facts/?${filters}${hierarchiesFilter}&drilldown=${drilldown}&pagesize=1&aggregate=${this.config.value[this.selectedMeasure]['field']}`
      }
      return apiRequestUrl
    },

    getData: function ($event) {
      var apiRequestUrl = this.createApiRequestURL()
      axios.get(apiRequestUrl).then(response => {
        this.data = response.data

        if (this.data.cells.length === 0) {
          this.hasData = false
        } else {
          this.hasData = true
        }

        var level = this.getLevel(this.currentLevel)
        var color = d3.scale.ordinal().range(this.colors)
        color = color.domain([this.data.total_cell_count, 0])

        if (this.selectedHierarchy['levelsParams'].length === 0) {
          this.getRootColors(color, this.data)
        } else {
          var rootColor = d3.rgb(this.hierarchyColors[decodeURI(this.selectedHierarchy['levelsParams'][0])])
          color = d3.scale.linear()
          color = color.interpolate(d3.interpolateRgb)
          color = color.range([rootColor.brighter(), rootColor.darker().darker()])
          color = color.domain([this.data['cells'].length, 0])
        }

        var total = 0
        // Remove data with negative values
        // var valueDimension = this.config['value'][this.selectedMeasure]['field']
        // this.data['cells'] = this.data['cells']

        // Calculate total amount to use it in percentual calculations
        this.data['summary']['_value'] = 0
        for (i in this.data['cells']) {
          total += this.data['cells'][i][this.config['value'][this.selectedMeasure]['field']]
          this.data['summary']['_value'] = total
        }
        this.data['summary']['_valueFmt'] = this.formatValue(this.data['summary']['_value'], this.config['value'][this.selectedMeasure]['formatOptions'])

        for (var i in this.data['cells']) {
          var levelsParams = ''
          var filters = qs.stringify(this.filters)
          if (filters !== '') {
            filters = '?' + filters
          }
          if (this.selectedHierarchy['levelsParams'].length >= 1) {
            levelsParams = `${this.selectedHierarchy['levelsParams'].join('/')}/`
          }
          this.data['cells'][i]['_value'] = this.data['cells'][i][this.config['value'][this.selectedMeasure]['field']]
          this.data['cells'][i]['_color'] = color(i)
          this.data['cells'][i]['_label'] = this.data['cells'][i][level[0]]
          this.data['cells'][i]['_value_fmt'] = this.formatValue(this.data['cells'][i]['_value'], this.config['value'][this.selectedMeasure]['formatOptions'])
          if (this.selectedHierarchy['levelsParams'].length < this.model.hierarchies[this.selectedHierarchy['hierarchy']['datapackageHierarchy']]['levels'].length) {
            this.data['cells'][i]['_url'] = `#${this.selectedHierarchy['hierarchy']['url']}/${levelsParams}${encodeURI(this.data['cells'][i][level[1]])}${filters}`
          }
          this.data['cells'][i]['_percentage'] = this.data['cells'][i]['_value'] / total
          this.data['cells'][i]['_small'] = this.data['cells'][i]['_percentage'] < 0.01
          var percentageFmt = (this.data['cells'][i]['_percentage'] * 100).toFixed(2) + '%'
          percentageFmt = percentageFmt.replace('.', ',')
          this.data['cells'][i]['_percentage_fmt'] = percentageFmt
        }

        this.getBreadcrumb()

        this.treemap.render(this.data)
      }).catch(e => {
        console.log(e)
      })
    },
    ...mapMutations(['setHierarchy', 'setLevelsParams', 'addFilter', 'setConfig', 'setModel', 'setHierarchyColors'])
  },

  watch: {
    '$route' (to, from) {
      this.updateData()
    },
    'config.value': function (newConfig) {
      this.updateData()
    },
    'config': {
      'handler': function (newConfig) {
        this.addFilters()
        this.defaultFilters()
        this.updateData()
      },
      deep: true
    },
    'filters': {
      'handler': function (newFilters) {
        this.addFilters()
      },
      deep: true
    }
  }
}
</script>

<style lang="scss">

.fa {
  font-size: 13px !important;
  vertical-align: middle !important;
}

.treemap-content {
  max-width: 1200px;
  margin: auto;
}

.control {
  position: static !important;
}

.controls {

  padding: 10px 0;

  .filters {
    float: right;

    .filter {
      float: left;
      padding-left: 10px;
    }
  }

  .scales {
    float: left;
  }

  .hierarchies {
    float: left;
    .hierarchy {
      float: left;
      padding-left: 10px;
    }
  }

  .measures {
    float: left;

  }
}

.controls:after {
  visibility: hidden;
  display: block;
  font-size: 0;
  content: " ";
  clear: both;
  height: 0;
}

h1, h2 {
  font-weight: normal;
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

.treemap {
  min-height: 500px;
  overflow: hidden;
}

.inactive-sort {
  opacity: 0.4;
}

.node {
  display: block;
  border: 0;
  color: #fff;
  overflow: hidden;
  position: absolute;
  outline: 1px solid #fff;
  font-size: 0.8em;
  text-indent: -1000px;
  padding: 5px;
  box-sizing: border-box;
  z-index: 5;
  font-weight: 300;
  text-shadow: -2px -2px 13px rgba(150, 150, 150, 0.9);

  a, a:hover {
    color: #fff;
    text-decoration: none;
  }

  &.big {
    text-indent: 2px;

    .amount {
      color: #fff;
      display: block;
      padding-bottom: 0.2em;
      font-size: 1.3em;
      text-indent: 2px;
    }

    &,&:hover {
      color: #fff;
      text-decoration: none;
    }

  }

  &:hover {
    text-indent: 2px;
    text-decoration: none;
  }

}

#download {
  text-align: left;
  margint-top: 5px;

  a {
    color: black;
    border: 1px solid black;
    padding: 0 5px;

    &:hover {
      color: white;
      background-color: black;
    }
  }
}

#table-toggle {
  height: 80px;
  margin: 0 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.table {
  width: 100%;
  margin-top: 1em;

  td, th {
    font-size: 0.9em;
    text-align: left;
  }

  td.num, th.num {
    text-align: right;
  }

  .hide-small, .small {
    display: none;
  }

  .level-color {
    float: left;
  }

  .level-label {
    width: 95%;
    padding-left: 15px;
    float: left;
  }

  .label a, .label a:hover {
    color: #fff;
    text-decoration: none;
    font-weight: 400;
  }
}

.treemap-tooltip {
  position: absolute;
  text-align: center;
  padding: 10px;
  font: 12px sans-serif;
  background: #eee;
  border: 0px;
  border-radius: 8px;
  pointer-events: none;
  z-index: 10;
  display: block;
}

.table-div {
  max-height: 350px;
  overflow-y: auto;
  overflow-x: hidden;
}

.sub {
  padding-left: 10px;
}

.top {
  font-weight: bold;
}

.breadcrumb.tc {
   font-size: 0.7em;
   white-space: normal;
   .blevel {
      display: flex;
      align-items: center;
   }
}

.no-data {
   display: flex;
   align-items: center;
   justify-content: center;
   height: 100%;
   background-color: #ededed;
   font-weight: bold;
}

</style>
