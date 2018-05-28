// const packagePath = '/api/package/'
// const packageInfo = require(packagePath + 'index.json')
// const Tokenizer = require('./token/Tokenizer')
// const library = { Path: packagePath, ...packageInfo }
// async function load (path) {
//   const res = await fetch(path, { method: 'get' })
//   const json = await res.json()
//   if (json.type === 'buffer') {
//     return json.content
//   } else {
//     return new Tokenizer(json.content, load, library).getLibrary()
//   }
// }

module.exports = {
  load: () => {},
  library: {}
}
