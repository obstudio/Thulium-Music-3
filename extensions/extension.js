const index = require('./index.json')
const Vue = require('vue')

for (const ext of index) {
  Vue.component('tm-ext-' + ext, require('./' + ext + '/main.js'))
}

module.exports = index