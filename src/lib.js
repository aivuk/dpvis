// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import Vuex from 'vuex'
import Buefy from 'buefy'
import App from './App'
import router from './router'
import 'buefy/lib/buefy.css'
import store from './store'

Vue.config.productionTip = false
Vue.use(Buefy, { defaultIconPack: 'fa' })
Vue.use(Vuex)

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
