const Player = require('../library/player')
const Lexer = require('../library/tmdoc/Lexer')

module.exports = (Vue) => {
  Vue.prototype.$createPlayer = (v) => new Player(v)
  Vue.prototype.$md = (content) => {
    if (typeof content !== 'string') return []
    return new Lexer().lex(content)
  }
}
