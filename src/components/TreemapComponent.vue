<template>
  <div class="treemap-content">
    <div class="controls">
      <div class="hierarchies">
      <a class="button" v-if="selectedHierarchy['levelsParams'].length >= 1" @click="levelBack()">
        <i class="fa fa-level-up"></i>
        <strong>
        Ebene hoch
        </strong>
      </a>
      <a class="button" :class='{"is-primary": hierarchyURL() === hierq.url}' :href="`#${hierq.url}`" v-bind:hierq="hierq" v-bind:key="hierq['label']" v-for="hierq in config['hierarchies']">
        {{hierq['label']}}
      </a>
      </div>
      <div class="measures" v-if="config['value'].length > 1">
        <b-field>
          <b-select @input="updateData()" v-model="selectedMeasure">
            <option :value="i" :key="measure.label"  v-for="(measure, i) in config['value']">{{measure.label}}</option>
          </b-select>
        </b-field>
      </div>
      <div class="filters">
        <div class="filter" :key="filterName" v-for="(filter, filterName) in config['filters']">
          {{ filter.label }}
          <b-select @input="addFilters()" class="dropdown-toggle" v-model="filters[filterName]">
            <option :value="filterValue.value" :key="filterValue.value" v-for="filterValue in filter.values">{{filterValue.label}}</option>
          </b-select>
        </div>
      </div>
    </div>
    <div id="treemap" class="treemap">
    </div>
    <table class="table table-condensed">
      <tr>
        <th>Titel</th>
        <th class="num">Betrag</th>
        <th class="num">Anteil</th>
      </tr>
      <tr v-bind:class="{small: cell['_small']}" v-for="cell in data['cells']" v-bind:key="cell['_label']">
          <td>
          <i :style="`color: ${cell['_color']};`" class="fa fa-square"></i>
          <a v-if="cell['_url']" :href="cell['_url']">{{ cell['_label'] }}</a>
            <span v-if="!cell['_url']">
              {{ cell['_label'] }}
            </span>
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
</template>

<script>
import Treemap from '../treemap'
import parseURL from '../utils/urlParser'
import axios from 'axios'
import * as d3 from 'd3'
import * as qs from 'query-string'
import * as accounting from 'accounting'

export default {
  name: 'treemap',

  props: [ 'datapackage', 'apiurl', 'config', 'update' ],

  data () {
    return {
      model: {},
      hasModel: false,
      colors: [
        '#CF3D1E', '#F15623', '#F68B1F', '#FFC60B', '#DFCE21',
        '#BCD631', '#95C93D', '#48B85C', '#00833D', '#00B48D',
        '#60C4B1', '#27C4F4', '#478DCB', '#3E67B1', '#4251A3',
        '#59449B', '#6E3F7C', '#6A246D', '#8A4873', '#EB0080',
        '#EF58A0', '#C05A89' ],
      selectedHierarchy: {'levelsParams': []},
      selectedMeasure: 0,
      filters: {},
      data: {},
      hierarchyColors: {}
    }
  },

  computed: {
    currentLevel: function () { return this.selectedHierarchy['levelsParams'].length }
  },

  mounted () {
    this.loadDatapackage()
  },

  methods: {

    loadDatapackage: function () {
      this.treemap = new Treemap('treemap')
      this.getURLParameters()
      this.getModel().then(response => { this.updateData() })
    },

    defaultFilters: function () {
      for (var k in this.config.filters) {
        this.filters[k] = this.config.filters[k].defaultValue
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

    getURLParameters: function () {
      var URLarguments = parseURL(window.location.toString())
      if (URLarguments[0].length === 0) {
        this.$set(this.selectedHierarchy, 'hierarchy', this.config['hierarchies'][0])
        window.location.hash = '/' + this.config['hierarchies'][0]['url']
      } else {
        var hierarchy = this.config['hierarchies'].find(function (h) { return h['url'] === URLarguments[0][0] })
        this.$set(this.selectedHierarchy, 'hierarchy', hierarchy)
      }
      this.$set(this.selectedHierarchy, 'levelsParams', URLarguments[0].splice(1))

      var urlFilters = URLarguments[1]
      for (var k in urlFilters) {
        this.filters[k] = urlFilters[k]
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
            hierqQuery += `|${this.model.dimensions[hierqName]['key_ref']}:"${this.selectedHierarchy['levelsParams'][i]}"`
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
      window.location.hash = `/${URLarguments[0].join('/')}?${qs.stringify(this.filters)}`
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
      var apiRequestUrl = `${this.apiurl}${this.datapackage}/model/`
      return axios.get(apiRequestUrl).then(response => {
        this.model = response.data.model
        this.hasModel = true
        var hierarchyName = this.selectedHierarchy['hierarchy']['datapackageHierarchy']
        this.$set(this.selectedHierarchy, 'levels', this.model['hierarchies'][hierarchyName]['levels'])
        this.defaultFilters()
      })
    },

    getRoot: function () {
      var apiRequestUrl = this.createApiRequestURL(true)
      return axios.get(apiRequestUrl).then(response => {
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
      var levelLabel = this.model['dimensions'][dimensionName]['label_ref']
      var levelKey = this.model['dimensions'][dimensionName]['key_ref']
      return [levelLabel, levelKey]
    },

    getFilters: function () {
      var filters = ''
      var filterArgumentQuote
      for (var k in this.filters) {
        if (this.filters[k] !== '') {
          filterArgumentQuote = ''
          if (this.config['filters'][k]['type'] === 'string') {
            filterArgumentQuote = '"'
          }
          filters += `${this.config['filters'][k]['name']}:${filterArgumentQuote}${this.filters[k]}${filterArgumentQuote}|`
        }
      }

      if (filters !== '') {
        return `cut=${filters}&`
      } else {
        return ''
      }
    },

    formatValue: function (value, formatOptions) {
      var postfix = ''
      if (formatOptions.postfix) {
        postfix = formatOptions.postfix
      }
      return accounting.formatMoney(value, formatOptions) + postfix
    },

    createApiRequestURL: function (rootLevel = false) {
      var drilldown
      var hierarchiesFilter = ''
      if (rootLevel) {
        drilldown = this.getDrilldown(0)
      } else {
        drilldown = this.getDrilldown()
        hierarchiesFilter = this.getHierarchies()
      }
      var filters = this.getFilters()
      var apiRequestUrl = `${this.apiurl}${this.datapackage}/aggregate/?${filters}${hierarchiesFilter}&drilldown=${drilldown}&order=${this.config.value[this.selectedMeasure]['field']}:desc&pagesize=30`
      return apiRequestUrl
    },

    getData: function ($event) {
      var apiRequestUrl = this.createApiRequestURL()
      axios.get(apiRequestUrl).then(response => {
        this.data = response.data
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
        var valueDimension = this.config['value'][this.selectedMeasure]['field']
        this.data['cells'] = this.data['cells'].filter(function (c) { return c[valueDimension] > 0 })

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
          if (this.selectedHierarchy['levelsParams'].length < this.model.hierarchies[this.selectedHierarchy['hierarchy']['datapackageHierarchy']]['levels'].length - 1) {
            this.data['cells'][i]['_url'] = `#${this.selectedHierarchy['hierarchy']['url']}/${levelsParams}${this.data['cells'][i][level[1]]}${filters}`
          }
          this.data['cells'][i]['_percentage'] = this.data['cells'][i]['_value'] / total
          this.data['cells'][i]['_small'] = this.data['cells'][i]['_percentage'] < 0.01
          var percentageFmt = (this.data['cells'][i]['_percentage'] * 100).toFixed(2) + '%'
          percentageFmt = percentageFmt.replace('.', ',')
          this.data['cells'][i]['_percentage_fmt'] = percentageFmt
        }

        this.treemap.render(this.data)
      }).catch(e => {
        console.log(e)
      })
    }
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
        this.defaultFilters()
        this.addFilters()
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

.treemap-content {
  max-width: 1200px;
  margin: auto;
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

  .hierarchies {
    float: left;
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
      font-size: 1.5em;
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

  .label a, .label a:hover {
    color: #fff;
    text-decoration: none;
    font-weight: 400;
  }
}

@font-face {
  font-family: 'fa-minimal';
  src:  url('../assets/fonts/fa-minimal.eot?xss5ew');
  src:  url('../assets/fonts/fa-minimal.eot?xss5ew#iefix') format('embedded-opentype'),
    url('../assets/fonts/fa-minimal.ttf?xss5ew') format('truetype'),
    url('../assets/fonts/fa-minimal.woff?xss5ew') format('woff'),
    url('../assets/fonts/fa-minimal.svg?xss5ew#fa-minimal') format('svg');
  font-weight: normal;
  font-style: normal;
}

.fa {
  display: inline-block;
  /* use !important to prevent issues with browser extensions that change fonts */
  font-family: 'fa-minimal' !important;
  speak: none;
  font-style: normal;
  font-weight: normal;
  font-variant: normal;
  text-transform: none;
  line-height: 1;

  /* Better Font Rendering =========== */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.fa-check:before {
  content: "\f00c";
}
.fa-info-circle:before {
  content: "\f05a";
}
.fa-square:before {
  content: "\f0c8";
}
.fa-plus-square:before {
  content: "\f0fe";
}
.fa-minus-square:before {
  content: "\f146";
}
.fa-level-up:before {
  content: "\f148";
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

</style>
