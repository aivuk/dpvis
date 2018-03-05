// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import Vuex from 'vuex'
import App from './App'
import Buefy from 'buefy'
import router from './router'
import 'buefy/lib/buefy.css'
import store from './store'

Vue.config.productionTip = false
Vue.use(Buefy, { defaultIconPack: 'fa' })
Vue.use(Vuex)

var config = {
  'datapackage': 'a6a16b964a7e784f99adecc47f26318a:berlin-be',
  'hierarchies': [
    {
      'datapackageHierarchy': 'administrative_classification',
      'url': 'einzelplane',
      'label': 'Einzelpläne'
    },
    {
      'datapackageHierarchy': 'functional_classification',
      'url': 'funktionen',
      'label': 'Funktionen'
    },
    {
      'datapackageHierarchy': 'economic_classification',
      'url': 'gruppen',
      'label': 'Gruppen'
    }
  ],
  'value': [
    {
      'field': 'Betrag.sum',
      'formatOptions': {
        'symbol': '',
        'decimal': ',',
        'thousand': '.',
        'precision': '',
        'format': '%s%v',
        'postfix': '€',
        'grouping': 3
      },
      'label': 'Betrag'
    }
  ],
  'scale': [
    {
      'label': 'Total',
      'number': 1,
      'description': ''
    },
    {
      'label': 'Pro Einwohner (3.574.830 in 2016)',
      'number': '3574830 ',
      'description': 'p. E.'
    }
  ],
  'filters': {
    'Jahr': {
      'name': 'date_2.Jahr',
      'label_ref': 'date_2.Jahr',
      'ref': 'date_2',
      'type': 'integer',
      'default': true,
      'defaultValue': 2018,
      'defaultLabel': 'All',
      'label': 'Jahr',
      'values': [
        {
          'value': 2014,
          'label': 2014
        },
        {
          'value': 2015,
          'label': 2015
        },
        {
          'value': 2016,
          'label': 2016
        },
        {
          'value': 2017,
          'label': 2017
        },
        {
          'value': 2018,
          'label': 2018
        },
        {
          'value': 2019,
          'label': 2019
        }
      ]
    },
    'Titelart': {
      'name': 'direction_2.Titelart',
      'label_ref': 'direction_2.Titelart',
      'ref': 'direction_2',
      'type': 'string',
      'default': true,
      'defaultValue': 'Ausgaben',
      'defaultLabel': 'All',
      'label': 'Titelart',
      'values': [
        {
          'value': 'Ausgaben',
          'label': 'Ausgaben'
        },
        {
          'value': 'Einnahmen',
          'label': 'Einnahmen'
        }
      ]
    },
    'BetragTyp': {
      'name': 'phase_2.BetragTyp',
      'label_ref': 'phase_2.BetragTyp',
      'ref': 'phase_2',
      'type': 'string',
      'default': true,
      'defaultValue': 'Plan',
      'defaultLabel': 'All',
      'label': 'Betrag-Typ',
      'values': [
        {
          'value': 'Ist',
          'label': 'Ist'
        },
        {
          'value': 'Plan',
          'label': 'Plan'
        }
      ]
    },
    'Typ': {
      'name': 'fin_source_2.Typ',
      'label_ref': 'fin_source_2.Bezeichnung',
      'ref': 'fin_source_2',
      'type': 'string',
      'default': true,
      'defaultValue': '',
      'defaultLabel': 'All',
      'label': 'Bereich',
      'values': [
        {
          'value': '',
          'label': 'All'
        },
        {
          'value': '1',
          'label': 'Senatsverwaltungen'
        },
        {
          'value': '2',
          'label': 'Verfassungsorgane'
        },
        {
          'value': '31',
          'label': 'Mitte'
        },
        {
          'value': '32',
          'label': 'Friedrichshain-Kreuzberg'
        },
        {
          'value': '33',
          'label': 'Pankow'
        },
        {
          'value': '34',
          'label': 'Charlottenburg-Wilmersdorf'
        },
        {
          'value': '35',
          'label': 'Spandau'
        },
        {
          'value': '36',
          'label': 'Steglitz-Zehlendorf'
        },
        {
          'value': '37',
          'label': 'Tempelhof-Schöneberg'
        },
        {
          'value': '38',
          'label': 'Neukölln'
        },
        {
          'value': '39',
          'label': 'Treptow-Köpenick'
        },
        {
          'value': '40',
          'label': 'Marzahn-Hellersdorf'
        },
        {
          'value': '41',
          'label': 'Lichtenberg'
        },
        {
          'value': '42',
          'label': 'Reinickendorf'
        }
      ]
    }
  },
  'level': 'land',
  'state': 'BE',
  'name': 'BE',
  'text': 'Haushalt',
  'hasBarChart': true
}

Vue.prototype.$treemapconfig = config

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  template: '<App/>',
  components: { App }
})
