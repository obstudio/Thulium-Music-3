const index = require('./index.json')
const Vue = require('vue')
const extensions = []

for (const ext of index) {
  Vue.component('tm-ext-' + ext, require('./' + ext + '/main.js'))
  extensions.push({
    name: ext,
    i18n: require(`./${ext}/i18n.json`)
  })
}

module.exports = extensions