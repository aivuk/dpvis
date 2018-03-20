// import TreemapComponent from './components/TreemapComponent'
import './styles/lib.scss'
import './styles/lib.styl'
import Vue from 'vue'
import App from './App'
import Vuex from 'vuex'
import Buefy from 'buefy'
import router from './router'
import store from './store'
import 'buefy/lib/buefy.css'

Vue.use(Buefy)
Vue.use(Vuex)

// var treemap = TreemapComponent
// export { treemap }

/* eslint-disable no-new */
export function treemap (el, config = {}) {
  Vue.prototype.$treemapconfig = config
  new Vue({
    el: el,
    router,
    store,
    components: { App },
    render: h => h(App)
  })
}
