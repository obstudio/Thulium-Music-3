import Player from './lib/player'
import Lexer from './lib/doc/Lexer'

export default (Vue) => {
  Vue.prototype.$createPlayer = (v) => new Player(v)
  Vue.prototype.$md = (content) => {
    if (typeof content !== 'string') return []
    return new Lexer().lex(content)
  }
}
