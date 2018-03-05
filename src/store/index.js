import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const state = {
  selectedHierarchy: { levelsParams: [], hierarchy: {}, levels: [] },
  filters: {},
  config: {},
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
