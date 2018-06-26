import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const state = {
  selectedHierarchy: { levelsParams: [], hierarchy: {}, levels: [] },
  filters: {},
  config: {'datapackage': '', 'hierarchies': [], 'value': [], 'scale': [], 'filters': {}},
  model: {},
  hierarchyColors: {}
}

const mutations = {
  setHierarchy (state, hierarchy) {
    Vue.set(state.selectedHierarchy, 'hierarchy', hierarchy)
  },
  setLevelsParams (state, levelsParams) {
    Vue.set(state.selectedHierarchy, 'levelsParams', levelsParams)
  },
  setLevels (state, levels) {
    Vue.set(state.selectedHierarchy, 'levels', levels)
  },
  addFilter (state, filter) {
    Vue.set(state.filters, filter['name'], filter['value'])
  },
  setConfig (state, config) {
    state.config = config
  },
  setConfigDatapackage (state, datapackage) {
    Vue.set(state.config, 'datapackage', datapackage)
  },
  addConfigHierarchy (state, hierarchy) {
    let newHierarchies = [...state.config['hierarchies'], hierarchy]
    Vue.set(state.config, 'hierarchies', newHierarchies)
  },
  removeConfigHierarchy (state, hpos) {
    let newHierarchies = state.config['hierarchies'].splice(hpos, 1)
    Vue.set(state.config, 'hierarchies', newHierarchies)
  },
  addConfigMeasure (state, measure) {
    let newMeasures = [...state.config['value'], measure]
    Vue.set(state.config, 'value', newMeasures)
  },
  removeConfigMeasure (state, hpos) {
    let newMeasures = state.config['value'].splice(hpos, 1)
    Vue.set(state.config, 'value', newMeasures)
  },
  addConfigFilter (state, filter) {
    Vue.set(state.config['filters'], filter.name, filter.params)
  },
  removeConfigFilter (state, filterName) {
    Vue.delete(state.config['filters'], filterName)
  },
  setModel (state, model) {
    state.model = model
  },
  setHierarchyColors (state, hierarchyColors) {
    state.hierarchyColors = hierarchyColors
  }

}

const actions = {
}

const getters = {
  selectedHierarchy: (state) => { return state.selectedHierarchy },
  filters: (state) => { return state.filters },
  joinFilters: (state) => { return state.filters },
  config: (state) => { return state.config },
  model: (state) => { return state.model },
  hierarchyColors: (state) => { return state.hierarchyColors }
//  currentLevel: (state) => { return state.selectedHierarchy['levelsParams'].length }
}

export default new Vuex.Store({
  state,
  getters,
  actions,
  mutations
})
