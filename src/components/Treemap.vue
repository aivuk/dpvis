<template>

<div class="treemap-content">
  <treemap :datapackage="datapackage" apiurl="https://openspending.org/api/3/cubes/" :config="config"></treemap>
  <time-change v-if="config.hasBarChart"></time-change>
</div>

</template>

<script>
import treemap from './TreemapComponent'
import TimeChange from './TimeChange'

export default {
  name: 'dptreemap',
  components: { treemap, TimeChange },
  data () {
    return {
      apiurl: 'https://openspending.org/api/3/cubes/',
      datapackage: 'a6a16b964a7e784f99adecc47f26318a:berlin_16_17_clean',
      hasModel: false,
      showTreemap: false,
      config: {'hierarchies': [], 'value': [], 'filters': {}, 'hasBarChart': false},
      model: {},
      update: false,
      formatOptionsDefault: { 'symbol': '$', 'decimal': '.', 'thousand': ',', 'precision': 2, format: '%s %v' },
      activeTab: 0
    }
  },
  created: function () {
    this.config = this.$treemapconfig
  }
}
</script>
